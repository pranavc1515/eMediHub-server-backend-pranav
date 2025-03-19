const User = require('../models/user.model');

const seedUsers = async () => {
  try {
    // Create admin user
    await User.create({
      email: 'admin@emedi.com',
      password: 'admin123',  
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    // Create some regular users
    const regularUsers = [
      {
        email: 'john.doe@example.com',
        password: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        isActive: true
      },
      {
        email: 'jane.smith@example.com',
        password: 'user123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user',
        isActive: true
      }
    ];

    await Promise.all(regularUsers.map(user => User.create(user)));

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

module.exports = seedUsers; 