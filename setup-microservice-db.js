require('dotenv').config();
const sequelize = require('./src/config/database');

async function setupMicroserviceDatabase() {
  try {
    console.log('🚀 Setting up database for microservice mode...');
    console.log(
      `Environment: ENABLE_PATIENT_MICROSERVICE = ${process.env.ENABLE_PATIENT_MICROSERVICE}`
    );

    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Check current foreign key constraints
    console.log('\n📋 Checking current foreign key constraints...');

    const [results] = await sequelize.query(`
      SELECT 
        CONSTRAINT_NAME, 
        TABLE_NAME, 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE 
        CONSTRAINT_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_NAME IN ('patient_queue', 'consultation', 'prescription')
        AND REFERENCED_TABLE_NAME = 'patient_personal';
    `);

    console.log('Current patient-related foreign key constraints:');
    results.forEach((constraint) => {
      console.log(
        `  - ${constraint.CONSTRAINT_NAME}: ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`
      );
    });

    if (process.env.ENABLE_PATIENT_MICROSERVICE === 'true') {
      console.log(
        '\n🔧 Microservice mode enabled - removing foreign key constraints...'
      );

      // Drop all patient-related foreign key constraints
      for (const constraint of results) {
        try {
          await sequelize.query(
            `ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME};`
          );
          console.log(
            `✅ Dropped constraint: ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}`
          );
        } catch (error) {
          console.log(
            `⚠️  Could not drop ${constraint.CONSTRAINT_NAME}: ${error.message}`
          );
        }
      }
    } else {
      console.log('\n🔧 Internal database mode - constraints should remain.');
    }

    console.log('\n✅ Database setup completed!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
  }
}

setupMicroserviceDatabase();
