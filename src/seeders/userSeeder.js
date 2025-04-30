const Patient = require('../models/patient.model');

const seedPatients = async () => {
  try {
    // Create admin patient
    await Patient.create({
      email: 'admin@emedi.com',
      password: 'admin123',  
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    // Create some regular patients
    const regularPatients = [
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

    await Promise.all(regularPatients.map(patient => Patient.create(patient)));

    console.log('Patients seeded successfully');
  } catch (error) {
    console.error('Error seeding patients:', error);
    throw error;
  }
};

module.exports = seedPatients; 