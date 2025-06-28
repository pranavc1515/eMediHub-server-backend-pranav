const sequelize = require('./src/config/database');

async function dropForeignKeyConstraints() {
  try {
    console.log('Starting foreign key constraint removal for microservice mode...');
    
    // Check if microservice mode is enabled
    const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;
    
    if (!ENABLE_PATIENT_MICROSERVICE || ENABLE_PATIENT_MICROSERVICE !== 'true') {
      console.log('Microservice mode not enabled. Keeping foreign key constraints.');
      return;
    }

    console.log('Microservice mode enabled. Removing patient foreign key constraints...');

    // Drop foreign key constraints
    const queries = [
      // Drop patient_queue foreign key constraint
      `ALTER TABLE patient_queue DROP FOREIGN KEY patient_queue_ibfk_1;`,
      
      // Drop consultation foreign key constraint (if exists)
      `ALTER TABLE consultation DROP FOREIGN KEY consultation_ibfk_1;`,
      
      // Drop prescription foreign key constraint (if exists)  
      `ALTER TABLE prescription DROP FOREIGN KEY prescription_ibfk_1;`
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log(`✅ Successfully executed: ${query}`);
      } catch (error) {
        // Ignore errors for constraints that don't exist
        if (error.original && error.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`⚠️  Constraint already dropped or doesn't exist: ${query}`);
        } else {
          console.log(`⚠️  Error executing ${query}:`, error.message);
        }
      }
    }

    console.log('✅ Foreign key constraint removal completed!');
    
  } catch (error) {
    console.error('❌ Error dropping foreign key constraints:', error);
    throw error;
  }
}

async function addForeignKeyConstraints() {
  try {
    console.log('Starting foreign key constraint addition for internal mode...');
    
    // Check if microservice mode is disabled
    const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;
    
    if (ENABLE_PATIENT_MICROSERVICE === 'true') {
      console.log('Microservice mode enabled. Skipping foreign key constraint addition.');
      return;
    }

    console.log('Internal mode enabled. Adding patient foreign key constraints...');

    // Add foreign key constraints
    const queries = [
      // Add patient_queue foreign key constraint
      `ALTER TABLE patient_queue 
       ADD CONSTRAINT patient_queue_ibfk_1 
       FOREIGN KEY (patientId) REFERENCES patient_personal(id) 
       ON DELETE CASCADE ON UPDATE CASCADE;`,
      
      // Add consultation foreign key constraint
      `ALTER TABLE consultation 
       ADD CONSTRAINT consultation_ibfk_1 
       FOREIGN KEY (patientId) REFERENCES patient_personal(id) 
       ON DELETE CASCADE ON UPDATE CASCADE;`,
      
      // Add prescription foreign key constraint
      `ALTER TABLE prescription 
       ADD CONSTRAINT prescription_ibfk_1 
       FOREIGN KEY (patientId) REFERENCES patient_personal(id) 
       ON DELETE CASCADE ON UPDATE CASCADE;`
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log(`✅ Successfully executed: ${query}`);
      } catch (error) {
        // Ignore errors for constraints that already exist
        if (error.original && error.original.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Constraint already exists: ${query}`);
        } else {
          console.log(`⚠️  Error executing ${query}:`, error.message);
        }
      }
    }

    console.log('✅ Foreign key constraint addition completed!');
    
  } catch (error) {
    console.error('❌ Error adding foreign key constraints:', error);
    throw error;
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;
    
    if (ENABLE_PATIENT_MICROSERVICE === 'true') {
      await dropForeignKeyConstraints();
    } else {
      await addForeignKeyConstraints();
    }
    
    await sequelize.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  dropForeignKeyConstraints,
  addForeignKeyConstraints
};