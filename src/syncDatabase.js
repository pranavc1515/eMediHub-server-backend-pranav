const sequelize = require('./config/database');
const { DoctorPersonal, DoctorProfessional } = require('./models/doctor.model');
const Patient = require('./models/patient.model');
const Consultation = require('./models/consultation.model');
const Prescription = require('./models/prescription.model');
const PatientQueue = require('./models/patientQueue.model');

// Fix for too many keys in doctor_personal table
const fixDoctorPersonalTable = async () => {
  try {
    // Drop all indexes except primary key on doctor_personal
    console.log(
      'Fixing doctor_personal table - removing excessive unique constraints...'
    );
    await sequelize.query(`
      SET FOREIGN_KEY_CHECKS=0;
      
      -- Get indexes
      SELECT DISTINCT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_NAME = 'doctor_personal' 
      AND INDEX_NAME != 'PRIMARY'
      AND TABLE_SCHEMA = DATABASE();
    `);

    // Keep only one unique key for email and phoneNumber
    await sequelize.query(`
      ALTER TABLE doctor_personal DROP INDEX phoneNumber;
      ALTER TABLE doctor_personal ADD UNIQUE INDEX phoneNumber (phoneNumber);
      
      ALTER TABLE doctor_personal DROP INDEX email;
      ALTER TABLE doctor_personal ADD UNIQUE INDEX email (email);
      
      SET FOREIGN_KEY_CHECKS=1;
    `);

    console.log('Fixed doctor_personal table indexes');
    return true;
  } catch (error) {
    console.error('Error fixing doctor_personal table:', error);
    return false;
  }
};

// Function to sync all models
const syncAllModels = async () => {
  try {
    console.log('Starting database synchronization...');

    // First, attempt to fix the doctor_personal table
    await fixDoctorPersonalTable();

    // Sync Doctor models with force=true to recreate tables
    console.log('Syncing DoctorPersonal table...');
    await DoctorPersonal.sync({ alter: true });
    console.log('DoctorPersonal table synchronized');

    console.log('Syncing DoctorProfessional table...');
    await DoctorProfessional.sync({ alter: true });
    console.log('DoctorProfessional table synchronized');

    // Sync Patient model
    console.log('Syncing Patient table...');
    await Patient.sync({ alter: true });
    console.log('Patient table synchronized');

    // Sync Consultation model
    console.log('Syncing Consultation table...');
    await Consultation.sync({ alter: true });
    console.log('Consultation table synchronized');

    // Sync PatientQueue model
    console.log('Syncing PatientQueue table...');
    await PatientQueue.sync({ alter: true });
    console.log('PatientQueue table synchronized');

    // Sync Prescription model
    console.log('Syncing Prescription table...');
    await Prescription.sync({ alter: true });
    console.log('Prescription table synchronized');

    console.log('All database tables synchronized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database tables:', error);
    process.exit(1);
  }
};

// Connect to the database and sync all models
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established');
    syncAllModels();
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });
