/**
 * Database Fix Script
 * 
 * This script fixes issues with the database tables:
 * 1. Removes excessive unique constraints from doctor_personal table
 * 2. Creates the PatientQueue table with correct data types
 * 3. Creates Consultation table with correct data types
 */

const sequelize = require('./src/config/database');
const { DoctorPersonal } = require('./src/models/doctor.model');
const Patient = require('./src/models/patient.model');
const Consultation = require('./src/models/consultation.model');
const PatientQueue = require('./src/models/patientQueue.model');

// Fix too many keys in doctor_personal table
const fixDoctorPersonalTable = async () => {
  try {
    console.log('🔧 Fixing doctor_personal table - removing excessive unique constraints...');
    
    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'doctor_personal'
    `);
    
    if (tables.length === 0) {
      console.log('❗ doctor_personal table does not exist. Skipping fixes.');
      return true;
    }
    
    // Get existing indexes
    const [indexes] = await sequelize.query(`
      SELECT DISTINCT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_NAME = 'doctor_personal' 
      AND INDEX_NAME != 'PRIMARY'
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    console.log(`Found ${indexes.length} non-primary indexes in doctor_personal table`);
    
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
    
    // Drop all existing non-primary indexes
    for (const index of indexes) {
      try {
        await sequelize.query(`ALTER TABLE doctor_personal DROP INDEX \`${index.INDEX_NAME}\``);
        console.log(`Dropped index: ${index.INDEX_NAME}`);
      } catch (error) {
        console.log(`Failed to drop index ${index.INDEX_NAME}: ${error.message}`);
      }
    }
    
    // Re-add single unique constraints for email and phoneNumber
    try {
      await sequelize.query(`ALTER TABLE doctor_personal ADD UNIQUE INDEX phoneNumber_idx (phoneNumber)`);
      console.log('Added unique index for phoneNumber');
    } catch (error) {
      console.log(`Failed to add phoneNumber index: ${error.message}`);
    }
    
    try {
      await sequelize.query(`ALTER TABLE doctor_personal ADD UNIQUE INDEX email_idx (email)`);
      console.log('Added unique index for email');
    } catch (error) {
      console.log(`Failed to add email index: ${error.message}`);
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
    
    console.log('✅ Fixed doctor_personal table indexes');
    return true;
  } catch (error) {
    console.error('❌ Error fixing doctor_personal table:', error);
    return false;
  }
};

// Try to create tables using Sequelize models
const syncModels = async () => {
  try {
    console.log('🔧 Attempting to create tables using Sequelize models...');
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
    
    // Sync models
    await Consultation.sync({ force: true });
    console.log('✅ Consultations table created with Sequelize');
    
    await PatientQueue.sync({ force: true });
    console.log('✅ PatientQueues table created with Sequelize');
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
    
    return true;
  } catch (error) {
    console.error('⚠️ Failed to create tables with Sequelize, will try manual SQL:', error.message);
    return false;
  }
};

// Create Consultations table with correct data types
const createConsultationsTable = async () => {
  try {
    console.log('🔧 Creating/fixing Consultations table with raw SQL...');
    
    // Check if table exists and drop it if it does
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Consultations'
    `);
    
    if (tables.length > 0) {
      console.log('Found existing Consultations table. Dropping it...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
      await sequelize.query('DROP TABLE IF EXISTS Consultations');
      await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
    }
    
    // Create table with correct data types
    await sequelize.query(`
      CREATE TABLE Consultations (
        id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
        patientId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        doctorId INT NOT NULL,
        scheduledDate DATE NOT NULL,
        startTime TIME NOT NULL,
        endTime TIME NOT NULL,
        status ENUM('pending', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending',
        consultationType ENUM('video', 'in-person') DEFAULT 'video',
        roomName VARCHAR(255),
        notes TEXT,
        cancelReason VARCHAR(255),
        cancelledBy ENUM('patient', 'doctor'),
        actualStartTime DATETIME,
        actualEndTime DATETIME,
        twilioRoomSid VARCHAR(255),
        patientSocketId VARCHAR(255),
        doctorSocketId VARCHAR(255),
        queuePosition INT,
        estimatedDuration INT DEFAULT 15,
        symptoms TEXT,
        prescription TEXT,
        diagnosis TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX patientId_idx (patientId),
        INDEX doctorId_idx (doctorId),
        INDEX status_idx (status),
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctorId) REFERENCES doctor_personal(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    
    console.log('✅ Consultations table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating Consultations table:', error);
    return false;
  }
};

// Create PatientQueues table with correct data types
const createPatientQueueTable = async () => {
  try {
    console.log('🔧 Creating/fixing PatientQueues table with raw SQL...');
    
    // Check if table exists and drop it if it does
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'PatientQueues'
    `);
    
    if (tables.length > 0) {
      console.log('Found existing PatientQueues table. Dropping it...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
      await sequelize.query('DROP TABLE IF EXISTS PatientQueues');
      await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
    }
    
    // Create table with correct data types
    await sequelize.query(`
      CREATE TABLE PatientQueues (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        patientId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
        doctorId INT NOT NULL,
        status ENUM('waiting', 'in_consultation', 'done', 'left') DEFAULT 'waiting',
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        roomName VARCHAR(255) NOT NULL,
        socketId VARCHAR(255),
        consultationId CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
        priority INT DEFAULT 0,
        hasJoinedRoom TINYINT(1) NOT NULL DEFAULT 0,
        consultationStartedAt DATETIME,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX patientId_idx (patientId),
        INDEX doctorId_idx (doctorId),
        INDEX status_idx (status),
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctorId) REFERENCES doctor_personal(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    
    console.log('✅ PatientQueues table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating PatientQueues table:', error);
    return false;
  }
};

// Update PatientQueue foreign key to Consultations
const updatePatientQueueConsultationFK = async () => {
  try {
    console.log('🔧 Updating PatientQueues foreign key to Consultations...');
    
    await sequelize.query(`
      ALTER TABLE PatientQueues 
      ADD CONSTRAINT fk_patientqueue_consultation 
      FOREIGN KEY (consultationId) 
      REFERENCES Consultations(id) 
      ON DELETE SET NULL
    `);
    
    console.log('✅ PatientQueues foreign key updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating PatientQueues foreign key:', error);
    return false;
  }
};

// Main function to fix the database
const fixDatabase = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Fix doctor_personal table
    await fixDoctorPersonalTable();
    
    // Try with Sequelize first
    const sequelizeSuccess = await syncModels();
    
    // If Sequelize method fails, use raw SQL
    if (!sequelizeSuccess) {
      console.log('🔄 Falling back to raw SQL approach...');
      await createConsultationsTable();
      await createPatientQueueTable();
      await updatePatientQueueConsultationFK();
    }
    
    console.log('✅ Database fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
};

// Run the fix
fixDatabase(); 