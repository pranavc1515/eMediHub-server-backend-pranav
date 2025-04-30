const Patient = require('../models/patient.model');

const seedAdmins = async () => {
  try {
    const admins = [
      {
        email: 'admin@emedi.com',
        password: 'admin123',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
      },
      {
        email: 'moderator@emedi.com',
        password: 'mod123',
        firstName: 'System',
        lastName: 'Moderator',
        role: 'admin',
        isActive: true,
      },
    ];

    await Promise.all(admins.map(admin => Patient.create(admin)));
    console.log('Admin patients seeded successfully');
  } catch (error) {
    console.error('Error seeding admin patients:', error);
    throw error;
  }
};

module.exports = seedAdmins; 