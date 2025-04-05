const sequelize = require('./config/database');
const { DoctorPersonal, DoctorProfessional } = require('./models/doctor.model');
const User = require('./models/user.model');
const Consultation = require('./models/consultation.model');

// Function to sync all models
const syncAllModels = async () => {
  try {
    console.log('Starting database synchronization...');
    
    // Sync Doctor models with alter=true to update table schema
    await DoctorPersonal.sync({ alter: true });
    console.log('DoctorPersonal table synchronized');
    
    await DoctorProfessional.sync({ alter: true });
    console.log('DoctorProfessional table synchronized');

    // Sync Consultation model
    await Consultation.sync({ alter: true });
    console.log('Consultation table synchronized');

    // Add other models here if needed
    // Uncomment if needed:
    // await User.sync({ alter: true });
    // console.log('User table synchronized');
    
    console.log('All database tables synchronized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database tables:', error);
    process.exit(1);
  }
};

// Connect to the database and sync all models
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established');
    syncAllModels();
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }); 