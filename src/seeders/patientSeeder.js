const Patient = require('../models/patient.model');
const User = require('../models/user.model');

const seedPatients = async () => {
  try {
    // First, create some regular users
    const users = [
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

    const createdUsers = await Promise.all(users.map(user => User.create(user)));

    // Create patient profiles for users and their family members
    const patients = [
      {
        // John Doe's profile
        userId: createdUsers[0].id,
        isMainUser: true,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        dateOfBirth: '1990-05-15',
        phoneNumber: '+1234567893',
        email: 'john.doe@example.com',
        address: '123 Main St, City',
        preferredLanguage: 'English',
        medicalHistory: {
          conditions: ['Asthma'],
          bloodGroup: 'O+',
          medications: ['Inhaler']
        },
        allergies: ['Peanuts', 'Penicillin'],
        isActive: true
      },
      {
        // John Doe's daughter
        userId: createdUsers[0].id,
        isMainUser: false,
        relationship: 'daughter',
        firstName: 'Emily',
        lastName: 'Doe',
        gender: 'Female',
        dateOfBirth: '2018-03-10',
        phoneNumber: '+1234567894',
        preferredLanguage: 'English',
        medicalHistory: {
          conditions: [],
          bloodGroup: 'O+',
          medications: []
        },
        allergies: ['Milk'],
        isActive: true
      },
      {
        // Jane Smith's profile
        userId: createdUsers[1].id,
        isMainUser: true,
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'Female',
        dateOfBirth: '1985-08-20',
        phoneNumber: '+1234567895',
        email: 'jane.smith@example.com',
        address: '456 Oak St, City',
        preferredLanguage: 'English',
        medicalHistory: {
          conditions: ['Hypertension'],
          bloodGroup: 'A+',
          medications: ['Lisinopril']
        },
        allergies: [],
        isActive: true
      },
      {
        // Jane Smith's father
        userId: createdUsers[1].id,
        isMainUser: false,
        relationship: 'father',
        firstName: 'Robert',
        lastName: 'Smith',
        gender: 'Male',
        dateOfBirth: '1955-12-03',
        phoneNumber: '+1234567896',
        address: '456 Oak St, City',
        preferredLanguage: 'English',
        medicalHistory: {
          conditions: ['Diabetes', 'Arthritis'],
          bloodGroup: 'B+',
          medications: ['Metformin', 'Ibuprofen']
        },
        allergies: ['Sulfa'],
        isActive: true
      }
    ];

    await Promise.all(patients.map(patient => Patient.create(patient)));
    console.log('Patients seeded successfully');
  } catch (error) {
    console.error('Error seeding patients:', error);
    throw error;
  }
};

module.exports = seedPatients; 