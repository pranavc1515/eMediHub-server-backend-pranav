const User = require('../models/user.model');

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

    await Promise.all(admins.map(admin => User.create(admin)));
    console.log('Admin users seeded successfully');
  } catch (error) {
    console.error('Error seeding admin users:', error);
    throw error;
  }
};

module.exports = seedAdmins; 