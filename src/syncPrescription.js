const sequelize = require('./config/database');
const Prescription = require('./models/prescription.model');

// Function to sync only the Prescription model
const syncPrescriptionModel = async () => {
    try {
        console.log('Starting Prescription model synchronization...');

        // Check if table exists
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        console.log('Existing tables:', tables);

        // Sync Prescription model
        console.log('Creating/updating Prescription table...');
        await Prescription.sync({ force: true });
        console.log('Prescription table synchronized successfully');

        // Verify the table was created
        const updatedTables = await queryInterface.showAllTables();
        console.log('Updated tables list:', updatedTables);

        console.log('Synchronization complete');
        process.exit(0);
    } catch (error) {
        console.error('Error synchronizing Prescription table:', error);
        process.exit(1);
    }
};

// Connect to the database and sync the Prescription model
console.log('Attempting to connect to database...');
sequelize.authenticate()
    .then(() => {
        console.log('Database connection established');
        syncPrescriptionModel();
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    }); 