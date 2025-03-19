const Doctor = require('../models/doctor.model');

const seedDoctors = async () => {
  try {
    const doctors = [
      {
        email: 'cardiologist@emedi.com',
        password: 'doc123',
        firstName: 'John',
        lastName: 'Smith',
        gender: 'Male',
        specialization: 'Cardiologist',
        qualification: 'MD, DM Cardiology',
        hospitalClinicName: 'Heart Care Center',
        profilePicture: 'https://example.com/doctor1.jpg',
        dateOfBirth: '1980-01-15',
        yearsOfExperience: 15,
        phoneNumber: '+1234567890',
        address: '123 Medical Plaza, Healthcare City',
        languagesSpoken: ['English', 'Hindi', 'Spanish'],
        preferredLanguage: 'English',
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        availableTimeSlots: {
          Monday: ['09:00-13:00', '15:00-18:00'],
          Wednesday: ['09:00-13:00', '15:00-18:00'],
          Friday: ['09:00-13:00']
        },
        timeZone: 'Asia/Kolkata',
        consultationFees: 1500,
        additionalCharges: {
          emergency: 500,
          weekend: 300
        },
        paymentMethods: ['UPI', 'Card', 'Bank Transfer'],
        upiId: 'doctor1@upi',
        medicalLicenseNumber: 'MED001',
        licenseExpiryDate: '2025-12-31',
        licenseCountry: 'India',
        previousWorkExperience: [
          {
            hospital: 'City Hospital',
            position: 'Senior Cardiologist',
            duration: '2015-2020'
          }
        ],
        awards: [
          {
            name: 'Best Cardiologist Award',
            year: 2019,
            organization: 'Medical Association'
          }
        ],
        certifications: [
          {
            name: 'Advanced Cardiac Life Support',
            issuer: 'American Heart Association',
            year: 2018
          }
        ],
        consultationModes: ['Video', 'Audio', 'Text'],
        bio: 'Experienced cardiologist with 15 years of practice in treating heart conditions.',
        isVerified: true,
        rating: 4.8,
        numberOfReviews: 120,
        isActive: true
      },
      {
        email: 'pediatrician@emedi.com',
        password: 'doc123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        gender: 'Female',
        specialization: 'Pediatrician',
        qualification: 'MD Pediatrics',
        hospitalClinicName: 'Kids Care Hospital',
        profilePicture: 'https://example.com/doctor2.jpg',
        dateOfBirth: '1985-03-20',
        yearsOfExperience: 10,
        phoneNumber: '+1234567891',
        address: '456 Child Care Center, Medical District',
        languagesSpoken: ['English', 'French'],
        preferredLanguage: 'English',
        availableDays: ['Tuesday', 'Thursday', 'Saturday'],
        availableTimeSlots: {
          Tuesday: ['10:00-14:00', '16:00-19:00'],
          Thursday: ['10:00-14:00', '16:00-19:00'],
          Saturday: ['10:00-15:00']
        },
        timeZone: 'Asia/Kolkata',
        consultationFees: 1000,
        additionalCharges: {
          emergency: 400,
          weekend: 200
        },
        paymentMethods: ['UPI', 'Card'],
        upiId: 'doctor2@upi',
        medicalLicenseNumber: 'MED002',
        licenseExpiryDate: '2026-06-30',
        licenseCountry: 'India',
        previousWorkExperience: [
          {
            hospital: 'Children\'s Hospital',
            position: 'Pediatrician',
            duration: '2018-2023'
          }
        ],
        awards: [
          {
            name: 'Excellence in Child Care',
            year: 2021,
            organization: 'Pediatric Society'
          }
        ],
        certifications: [
          {
            name: 'Pediatric Advanced Life Support',
            issuer: 'American Academy of Pediatrics',
            year: 2020
          }
        ],
        consultationModes: ['Video', 'Audio'],
        bio: 'Dedicated pediatrician with a focus on newborn and child healthcare.',
        isVerified: true,
        rating: 4.9,
        numberOfReviews: 85,
        isActive: true
      },
      {
        email: 'dermatologist@emedi.com',
        password: 'doc123',
        firstName: 'Michael',
        lastName: 'Brown',
        gender: 'Male',
        specialization: 'Dermatologist',
        qualification: 'MD Dermatology',
        hospitalClinicName: 'Skin Care Clinic',
        profilePicture: 'https://example.com/doctor3.jpg',
        dateOfBirth: '1982-07-10',
        yearsOfExperience: 12,
        phoneNumber: '+1234567892',
        address: '789 Skin Care Center, Medical Complex',
        languagesSpoken: ['English', 'German'],
        preferredLanguage: 'English',
        availableDays: ['Monday', 'Tuesday', 'Thursday'],
        availableTimeSlots: {
          Monday: ['11:00-15:00', '16:00-19:00'],
          Tuesday: ['11:00-15:00', '16:00-19:00'],
          Thursday: ['11:00-15:00']
        },
        timeZone: 'Asia/Kolkata',
        consultationFees: 1200,
        additionalCharges: {
          emergency: 300,
          weekend: 200
        },
        paymentMethods: ['Card', 'Bank Transfer'],
        medicalLicenseNumber: 'MED003',
        licenseExpiryDate: '2025-09-30',
        licenseCountry: 'India',
        previousWorkExperience: [
          {
            hospital: 'Derma Care Hospital',
            position: 'Senior Dermatologist',
            duration: '2016-2022'
          }
        ],
        awards: [
          {
            name: 'Best Dermatology Practice',
            year: 2020,
            organization: 'Dermatology Association'
          }
        ],
        certifications: [
          {
            name: 'Advanced Cosmetic Dermatology',
            issuer: 'International Dermatology Board',
            year: 2019
          }
        ],
        consultationModes: ['Video', 'Text'],
        bio: 'Expert dermatologist specializing in skin conditions and cosmetic procedures.',
        isVerified: false,
        rating: 4.7,
        numberOfReviews: 65,
        isActive: true
      }
    ];

    await Promise.all(doctors.map(doctor => Doctor.create(doctor)));
    console.log('Doctors seeded successfully');
  } catch (error) {
    console.error('Error seeding doctors:', error);
    throw error;
  }
};

module.exports = seedDoctors; 