const { Sequelize, Op } = require('sequelize');
const { PatientIN } = require('../models/patientIN.model');
const { DoctorPersonal } = require('../models/doctor.model');
const { Consultation } = require('../models/consultation.model');
const { Prescription } = require('../models/prescription.model');
const { Specialization } = require('../models/specialization.model');
const { SystemConfig } = require('../models/systemConfig.model');
const { Content } = require('../models/content.model');

// Helper function to generate random date within a range
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to get random item from an array
const getRandomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get random number in a range
const getRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Seed patients
const seedPatients = async (count = 20) => {
    try {
        const existingCount = await PatientIN.count();
        if (existingCount >= count) {
            console.log(`${existingCount} patients already exist, skipping patient seeding`);
            return;
        }

        const genders = ['Male', 'Female', 'Other'];
        const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
        const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

        const patientsToCreate = count - existingCount;
        console.log(`Creating ${patientsToCreate} patients...`);

        for (let i = 0; i < patientsToCreate; i++) {
            const patientId = existingCount + i + 1;
            const gender = getRandomItem(genders);
            const firstName = gender === 'Male' ?
                getRandomItem(['John', 'James', 'Robert', 'Michael', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles']) :
                getRandomItem(['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah']);

            const lastName = getRandomItem(['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore']);
            const name = `${firstName} ${lastName}`;

            // Create patient
            const patient = await PatientIN.create({
                name,
                phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
                email: `patient${patientId}@example.com`,
                age: getRandomNumber(18, 80),
                dob: randomDate(new Date(1940, 0, 1), new Date(2005, 0, 1)),
                gender,
                marital_status: getRandomItem(maritalStatuses),
                isPhoneVerify: true,
                isEmailVerify: true
            });

            // Create patient details
            await patient.createDetails({
                user_id: patient.id,
                height: getRandomNumber(150, 190),
                weight: getRandomNumber(45, 100),
                diet: getRandomItem(['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Pescatarian']),
                profession: getRandomItem(['Teacher', 'Engineer', 'Doctor', 'Student', 'Retired', 'Business', 'Other']),
                blood_group: getRandomItem(bloodGroups)
            });
        }

        console.log(`${patientsToCreate} patients created successfully`);
    } catch (error) {
        console.error('Error seeding patients:', error);
    }
};

// Seed specializations
const seedSpecializations = async () => {
    try {
        const existingCount = await Specialization.count();
        if (existingCount >= 10) {
            console.log(`${existingCount} specializations already exist, skipping specialization seeding`);
            return;
        }

        const specializations = [
            { name: 'Cardiology', description: 'Deals with disorders of the heart and blood vessels', consultationFee: 1500 },
            { name: 'Dermatology', description: 'Focuses on diseases of the skin, hair, and nails', consultationFee: 1200 },
            { name: 'Neurology', description: 'Deals with disorders of the nervous system', consultationFee: 1800 },
            { name: 'Orthopedics', description: 'Focuses on the musculoskeletal system', consultationFee: 1400 },
            { name: 'Pediatrics', description: 'Deals with the health of children', consultationFee: 1000 },
            { name: 'Psychiatry', description: 'Focuses on mental, emotional, and behavioral disorders', consultationFee: 1600 },
            { name: 'Ophthalmology', description: 'Deals with disorders of the eye', consultationFee: 1300 },
            { name: 'ENT', description: 'Focuses on ear, nose, and throat disorders', consultationFee: 1100 },
            { name: 'Gynecology', description: 'Deals with women\'s health', consultationFee: 1400 },
            { name: 'Urology', description: 'Focuses on the urinary tract and male reproductive organs', consultationFee: 1500 }
        ];

        for (const spec of specializations) {
            await Specialization.findOrCreate({
                where: { name: spec.name },
                defaults: spec
            });
        }

        console.log('Specializations seeded successfully');
    } catch (error) {
        console.error('Error seeding specializations:', error);
    }
};

// Seed doctors
const seedDoctors = async (count = 10) => {
    try {
        const existingCount = await DoctorPersonal.count();
        if (existingCount >= count) {
            console.log(`${existingCount} doctors already exist, skipping doctor seeding`);
            return;
        }

        // First ensure we have specializations
        await seedSpecializations();
        const specializations = await Specialization.findAll();

        const genders = ['Male', 'Female'];
        const degrees = ['MBBS', 'MD', 'MS', 'DNB', 'DM', 'MCh', 'PhD'];
        const universities = ['AIIMS', 'CMC Vellore', 'KEM Mumbai', 'JIPMER', 'PGIMER', 'MAMC Delhi'];

        const doctorsToCreate = count - existingCount;
        console.log(`Creating ${doctorsToCreate} doctors...`);

        for (let i = 0; i < doctorsToCreate; i++) {
            const doctorId = existingCount + i + 1;
            const gender = getRandomItem(genders);
            const firstName = gender === 'Male' ?
                getRandomItem(['Rajesh', 'Suresh', 'Ramesh', 'Vikram', 'Ajay', 'Sanjay']) :
                getRandomItem(['Priya', 'Neha', 'Meera', 'Anita', 'Sunita', 'Kavita']);

            const lastName = getRandomItem(['Sharma', 'Patel', 'Verma', 'Gupta', 'Singh', 'Kumar']);
            const fullName = `Dr. ${firstName} ${lastName}`;

            // Get random specialization
            const specialization = getRandomItem(specializations);

            // Create doctor
            await DoctorPersonal.create({
                fullName,
                email: `doctor${doctorId}@example.com`,
                phone: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
                gender,
                specialization: specialization.name,
                specializationId: specialization.id,
                degree: getRandomItem(degrees),
                university: getRandomItem(universities),
                experience: getRandomNumber(2, 25),
                consultationFee: getRandomNumber(500, 2000),
                status: 1,
                isVerified: true
            });
        }

        console.log(`${doctorsToCreate} doctors created successfully`);
    } catch (error) {
        console.error('Error seeding doctors:', error);
    }
};

// Seed consultations
const seedConsultations = async (count = 50) => {
    try {
        const existingCount = await Consultation.count();
        if (existingCount >= count) {
            console.log(`${existingCount} consultations already exist, skipping consultation seeding`);
            return;
        }

        // Get patients and doctors
        const patients = await PatientIN.findAll();
        const doctors = await DoctorPersonal.findAll();

        if (patients.length === 0 || doctors.length === 0) {
            console.log('No patients or doctors found. Please seed patients and doctors first.');
            return;
        }

        const consultationStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
        const consultationTypes = ['general', 'follow-up', 'emergency', 'specialist'];
        const paymentStatuses = ['pending', 'completed', 'refunded', 'failed'];

        const consultationsToCreate = count - existingCount;
        console.log(`Creating ${consultationsToCreate} consultations...`);

        // Current date and dates for different time ranges
        const now = new Date();
        const pastDate = new Date(now);
        pastDate.setMonth(pastDate.getMonth() - 3);

        const futureDate = new Date(now);
        futureDate.setMonth(futureDate.getMonth() + 1);

        for (let i = 0; i < consultationsToCreate; i++) {
            const patient = getRandomItem(patients);
            const doctor = getRandomItem(doctors);

            // Decide if consultation is past, present, or future
            let scheduledDate, status;
            const timeframe = Math.random();

            if (timeframe < 0.6) { // 60% past consultations
                scheduledDate = randomDate(pastDate, now);
                status = Math.random() > 0.2 ? 'completed' : getRandomItem(['cancelled', 'rescheduled']);
            } else { // 40% future consultations
                scheduledDate = randomDate(now, futureDate);
                status = 'scheduled';
            }

            // Create consultation
            await Consultation.create({
                patientId: patient.id,
                doctorId: doctor.id,
                scheduledDate,
                duration: getRandomNumber(15, 60),
                consultationType: getRandomItem(consultationTypes),
                status,
                paymentStatus: status === 'completed' ? 'completed' : getRandomItem(paymentStatuses),
                amount: doctor.consultationFee,
                notes: `Consultation notes for ${patient.name} with ${doctor.fullName}`,
                symptoms: ['fever', 'headache', 'cough'].slice(0, getRandomNumber(1, 3))
            });
        }

        console.log(`${consultationsToCreate} consultations created successfully`);
    } catch (error) {
        console.error('Error seeding consultations:', error);
    }
};

// Seed prescriptions
const seedPrescriptions = async (count = 40) => {
    try {
        const existingCount = await Prescription.count();
        if (existingCount >= count) {
            console.log(`${existingCount} prescriptions already exist, skipping prescription seeding`);
            return;
        }

        // Get completed consultations
        const completedConsultations = await Consultation.findAll({
            where: { status: 'completed' },
            include: [
                { model: PatientIN, as: 'patient' },
                { model: DoctorPersonal, as: 'doctor' }
            ]
        });

        if (completedConsultations.length === 0) {
            console.log('No completed consultations found. Please seed consultations first.');
            return;
        }

        const prescriptionTypes = ['custom', 'file'];
        const medicines = [
            { name: 'Paracetamol', dosage: '500mg', frequency: 'TID', duration: '5 days' },
            { name: 'Amoxicillin', dosage: '250mg', frequency: 'BID', duration: '7 days' },
            { name: 'Ibuprofen', dosage: '400mg', frequency: 'TID', duration: '3 days' },
            { name: 'Cetirizine', dosage: '10mg', frequency: 'OD', duration: '5 days' },
            { name: 'Omeprazole', dosage: '20mg', frequency: 'OD', duration: '14 days' },
            { name: 'Azithromycin', dosage: '500mg', frequency: 'OD', duration: '3 days' },
            { name: 'Montelukast', dosage: '10mg', frequency: 'OD', duration: '30 days' },
            { name: 'Metformin', dosage: '500mg', frequency: 'BID', duration: '30 days' },
            { name: 'Atorvastatin', dosage: '10mg', frequency: 'OD', duration: '30 days' },
            { name: 'Losartan', dosage: '50mg', frequency: 'OD', duration: '30 days' }
        ];

        const prescriptionsToCreate = Math.min(count - existingCount, completedConsultations.length);
        console.log(`Creating ${prescriptionsToCreate} prescriptions...`);

        for (let i = 0; i < prescriptionsToCreate; i++) {
            const consultation = completedConsultations[i % completedConsultations.length];
            const prescriptionType = getRandomItem(prescriptionTypes);

            // Generate random medicines
            const medicineCount = getRandomNumber(1, 5);
            const prescribedMedicines = [];
            for (let j = 0; j < medicineCount; j++) {
                const medicine = { ...getRandomItem(medicines) };
                medicine.instructions = getRandomItem([
                    'Take after food',
                    'Take before food',
                    'Take with water',
                    'Avoid alcohol',
                    'Avoid driving after taking this medicine'
                ]);
                prescribedMedicines.push(medicine);
            }

            // Create prescription
            await Prescription.create({
                consultationId: consultation.id,
                patientId: consultation.patientId,
                doctorId: consultation.doctorId,
                prescriptionType,
                medicines: prescribedMedicines,
                customPrescription: prescriptionType === 'custom' ?
                    `Prescription for ${consultation.patient.name} by ${consultation.doctor.fullName}` : null,
                prescriptionUrl: prescriptionType === 'file' ?
                    `https://emediHub.com/prescriptions/sample-${i}.pdf` : null,
                instructions: 'Take medicines as prescribed. Follow up after 7 days.',
                diagnosis: getRandomItem([
                    'Common Cold',
                    'Viral Fever',
                    'Bacterial Infection',
                    'Allergic Rhinitis',
                    'Gastritis',
                    'Hypertension',
                    'Diabetes Mellitus',
                    'Migraine'
                ])
            });
        }

        console.log(`${prescriptionsToCreate} prescriptions created successfully`);
    } catch (error) {
        console.error('Error seeding prescriptions:', error);
    }
};

// Seed system configurations
const seedSystemConfigs = async () => {
    try {
        const existingCount = await SystemConfig.count();
        if (existingCount > 0) {
            console.log(`${existingCount} system configurations already exist, skipping system config seeding`);
            return;
        }

        const configs = [
            {
                key: 'WORKING_HOURS',
                value: JSON.stringify({
                    monday: { start: '09:00', end: '18:00', isOpen: true },
                    tuesday: { start: '09:00', end: '18:00', isOpen: true },
                    wednesday: { start: '09:00', end: '18:00', isOpen: true },
                    thursday: { start: '09:00', end: '18:00', isOpen: true },
                    friday: { start: '09:00', end: '18:00', isOpen: true },
                    saturday: { start: '10:00', end: '16:00', isOpen: true },
                    sunday: { start: '00:00', end: '00:00', isOpen: false }
                }),
                description: 'System working hours'
            },
            {
                key: 'CONSULTATION_FEES',
                value: JSON.stringify({
                    general: 500,
                    specialist: 1000,
                    emergency: 1500,
                    followUp: 300
                }),
                description: 'Default consultation fees'
            },
            {
                key: 'EMAIL_TEMPLATES',
                value: JSON.stringify({
                    welcome: {
                        subject: 'Welcome to eMediHub',
                        body: '<h1>Welcome to eMediHub!</h1><p>Thank you for registering with us. We are excited to have you on board.</p>'
                    },
                    appointmentConfirmation: {
                        subject: 'Appointment Confirmation',
                        body: '<h1>Appointment Confirmed</h1><p>Your appointment with {{doctorName}} on {{appointmentDate}} has been confirmed.</p>'
                    },
                    appointmentReminder: {
                        subject: 'Appointment Reminder',
                        body: '<h1>Appointment Reminder</h1><p>This is a reminder for your appointment with {{doctorName}} tomorrow at {{appointmentTime}}.</p>'
                    },
                    passwordReset: {
                        subject: 'Password Reset Request',
                        body: '<h1>Password Reset</h1><p>Click the link below to reset your password:</p><p>{{resetLink}}</p>'
                    }
                }),
                description: 'Email notification templates'
            },
            {
                key: 'SMS_TEMPLATES',
                value: JSON.stringify({
                    welcome: 'Welcome to eMediHub! Your registration is complete.',
                    appointmentConfirmation: 'Your appointment with {{doctorName}} on {{appointmentDate}} is confirmed.',
                    appointmentReminder: 'Reminder: Your appointment with {{doctorName}} is tomorrow at {{appointmentTime}}.',
                    otpVerification: 'Your eMediHub verification code is {{otp}}. Valid for 10 minutes.'
                }),
                description: 'SMS notification templates'
            },
            {
                key: 'PLATFORM_SETTINGS',
                value: JSON.stringify({
                    maintenanceMode: false,
                    allowRegistrations: true,
                    maxFileUploadSize: 5, // in MB
                    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
                    sessionTimeout: 30, // in minutes
                    defaultLanguage: 'en',
                    supportedLanguages: ['en', 'hi', 'ta', 'te', 'ml', 'kn']
                }),
                description: 'General platform settings'
            }
        ];

        for (const config of configs) {
            await SystemConfig.create(config);
        }

        console.log('System configurations seeded successfully');
    } catch (error) {
        console.error('Error seeding system configurations:', error);
    }
};

// Seed content
const seedContent = async () => {
    try {
        const existingCount = await Content.count();
        if (existingCount > 0) {
            console.log(`${existingCount} content items already exist, skipping content seeding`);
            return;
        }

        const contentItems = [
            {
                type: 'faq',
                title: 'How do I book an appointment?',
                content: 'You can book an appointment by logging into your account, selecting a doctor, and choosing an available time slot.',
                status: 'published',
                order: 1
            },
            {
                type: 'faq',
                title: 'How do I pay for consultations?',
                content: 'We accept various payment methods including credit/debit cards, net banking, UPI, and wallet payments.',
                status: 'published',
                order: 2
            },
            {
                type: 'faq',
                title: 'Can I cancel my appointment?',
                content: 'Yes, you can cancel your appointment up to 2 hours before the scheduled time for a full refund.',
                status: 'published',
                order: 3
            },
            {
                type: 'faq',
                title: 'How do I access my prescription?',
                content: 'You can access your prescriptions from the "My Prescriptions" section in your patient dashboard.',
                status: 'published',
                order: 4
            },
            {
                type: 'policy',
                title: 'Privacy Policy',
                content: `<h1>Privacy Policy</h1>
        <p>At eMediHub, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
        <h2>Information We Collect</h2>
        <p>We collect personal information that you voluntarily provide to us when you register on the platform, express interest in obtaining information about us or our products and services, or otherwise contact us.</p>
        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, to process your requests, transactions, and payments, and to communicate with you.</p>`,
                status: 'published',
                order: 1
            },
            {
                type: 'policy',
                title: 'Terms of Service',
                content: `<h1>Terms of Service</h1>
        <p>These Terms of Service govern your use of the eMediHub platform and services.</p>
        <h2>User Accounts</h2>
        <p>When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
        <h2>Medical Advice Disclaimer</h2>
        <p>The content on eMediHub is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>`,
                status: 'published',
                order: 2
            },
            {
                type: 'help',
                title: 'Getting Started Guide',
                content: `<h1>Getting Started with eMediHub</h1>
        <p>Welcome to eMediHub! This guide will help you get started with our platform.</p>
        <h2>Step 1: Create an Account</h2>
        <p>Click on the "Sign Up" button and fill in your details to create an account.</p>
        <h2>Step 2: Complete Your Profile</h2>
        <p>Add your medical history, allergies, and other relevant information to your profile.</p>
        <h2>Step 3: Find a Doctor</h2>
        <p>Browse through our list of doctors or use the search function to find a doctor based on specialty, location, or availability.</p>
        <h2>Step 4: Book an Appointment</h2>
        <p>Select a convenient time slot and book your appointment.</p>`,
                status: 'published',
                order: 1
            },
            {
                type: 'about',
                title: 'About eMediHub',
                content: `<h1>About eMediHub</h1>
        <p>eMediHub is a comprehensive healthcare platform that connects patients with healthcare providers for online consultations, prescription management, and health record maintenance.</p>
        <h2>Our Mission</h2>
        <p>Our mission is to make healthcare accessible, affordable, and convenient for everyone through technology.</p>
        <h2>Our Team</h2>
        <p>Our team consists of healthcare professionals, technology experts, and customer service specialists dedicated to providing you with the best healthcare experience.</p>`,
                status: 'published',
                order: 1
            },
            {
                type: 'about',
                title: 'Our Services',
                content: `<h1>Our Services</h1>
        <p>eMediHub offers a range of healthcare services to meet your needs.</p>
        <h2>Online Consultations</h2>
        <p>Connect with doctors from the comfort of your home through video, audio, or chat consultations.</p>
        <h2>Prescription Management</h2>
        <p>Get digital prescriptions and manage your medications easily.</p>
        <h2>Health Records</h2>
        <p>Store and access your health records securely in one place.</p>`,
                status: 'published',
                order: 2
            }
        ];

        for (const item of contentItems) {
            await Content.create(item);
        }

        console.log('Content items seeded successfully');
    } catch (error) {
        console.error('Error seeding content:', error);
    }
};

// Main seeder function
const seedAll = async () => {
    console.log('Starting to seed dummy data for admin APIs...');

    // Seed in order of dependencies
    await seedSpecializations();
    await seedPatients();
    await seedDoctors();
    await seedConsultations();
    await seedPrescriptions();
    await seedSystemConfigs();
    await seedContent();

    console.log('All dummy data seeded successfully!');
};

module.exports = { seedAll }; 
