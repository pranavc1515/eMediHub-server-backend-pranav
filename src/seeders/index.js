const sequelize = require('../config/database');
const seedAdmins = require('./adminSeeder');
const seedDoctors = require('./doctorSeeder');
const seedPatients = require('./patientSeeder');

const seedDatabase = async () => {
  try {
    // Sync database (this will drop all tables and recreate them)
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Run seeders in sequence
    await seedAdmins();
    await seedDoctors();
    await seedPatients();

    console.log('All data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder if this file is run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 