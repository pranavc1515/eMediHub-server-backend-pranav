const sequelize = require('./config/database');
const Prescription = require('./models/prescription.model');
const fs = require('fs');

// Function to synchronize only the Prescription model
const syncPrescriptionModel = async () => {
    try {
        console.log('Starting Prescription model synchronization...');

        // Create a log file to track what's happening
        const logStream = fs.createWriteStream('./prescription-sync.log', { flags: 'a' });

        // Log function
        const log = (message) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${message}\n`;
            console.log(message);
            logStream.write(logMessage);
        };

        log('Checking database connection...');
        await sequelize.authenticate();
        log('Database connection established successfully.');

        // Force sync the Prescription model (this will drop and recreate the table)
        log('Creating Prescription table...');
        await Prescription.sync({ force: true });
        log('Prescription table created successfully.');

        // Create a test record to verify the table works
        log('Creating test prescription record...');
        const testPrescription = await Prescription.create({
            consultationId: 'test-consultation-id',
            patientId: 'test-patient-id',
            doctorId: 'test-doctor-id',
            prescriptionType: 'file',
            filename: 'test-prescription.pdf'
        });
        log(`Test record created with ID: ${testPrescription.id}`);

        // Read back the test record
        log('Verifying test record...');
        const verifyPrescription = await Prescription.findByPk(testPrescription.id);
        if (verifyPrescription) {
            log('Test record verified successfully.');
        } else {
            log('ERROR: Could not verify test record!');
        }

        log('Synchronization completed successfully.');
        logStream.end();

        // Exit the process
        process.exit(0);
    } catch (error) {
        console.error('Error synchronizing Prescription table:', error);
        // Write error to log file
        fs.appendFileSync(
            './prescription-sync.log',
            `[${new Date().toISOString()}] ERROR: ${error.message}\n${error.stack}\n`
        );
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
        fs.appendFileSync(
            './prescription-sync.log',
            `[${new Date().toISOString()}] ERROR: ${err.message}\n${err.stack}\n`
        );
        process.exit(1);
    }); 