const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth.middleware');
const Doctor = require('../models/doctor.model');

/**
 * @swagger
 * /api/doctors/register:
 *   post:
 *     summary: Register a new doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - gender
 *               - specialization
 *               - qualification
 *               - dateOfBirth
 *               - yearsOfExperience
 *               - phoneNumber
 *               - address
 *               - preferredLanguage
 *               - consultationFees
 *               - medicalLicenseNumber
 *               - licenseExpiryDate
 *               - licenseCountry
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               specialization:
 *                 type: string
 *               qualification:
 *                 type: string
 *     responses:
 *       201:
 *         description: Doctor registered successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/register', async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      data: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/login:
 *   post:
 *     summary: Login doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ where: { email } });

    if (!doctor || !(await doctor.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { id: doctor.id, email: doctor.email, type: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        doctor: {
          id: doctor.id,
          email: doctor.email,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization,
          isVerified: doctor.isVerified,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/profile:
 *   get:
 *     summary: Get doctor's profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/profile:
 *   put:
 *     summary: Update complete doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - gender
 *               - specialization
 *               - qualification
 *               - dateOfBirth
 *               - yearsOfExperience
 *               - phoneNumber
 *               - address
 *               - preferredLanguage
 *               - consultationFees
 *               - medicalLicenseNumber
 *               - licenseExpiryDate
 *               - licenseCountry
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Doctor's first name
 *               lastName:
 *                 type: string
 *                 description: Doctor's last name
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 description: Doctor's gender
 *               specialization:
 *                 type: string
 *                 description: Doctor's specialization (e.g., Cardiologist)
 *               qualification:
 *                 type: string
 *                 description: Doctor's qualification (e.g., MBBS, MD)
 *               hospitalClinicName:
 *                 type: string
 *                 description: Name of hospital or clinic (optional)
 *               profilePicture:
 *                 type: string
 *                 description: URL of profile picture (optional)
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (YYYY-MM-DD)
 *               yearsOfExperience:
 *                 type: integer
 *                 description: Years of medical practice
 *               phoneNumber:
 *                 type: string
 *                 description: Contact number
 *               address:
 *                 type: string
 *                 description: Professional address
 *               languagesSpoken:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of languages (optional)
 *               preferredLanguage:
 *                 type: string
 *                 description: Primary language for communication
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of available days (optional)
 *               availableTimeSlots:
 *                 type: object
 *                 description: Time slots for each day (optional)
 *               timeZone:
 *                 type: string
 *                 description: Preferred timezone (optional)
 *               consultationFees:
 *                 type: number
 *                 description: Base consultation fee
 *               additionalCharges:
 *                 type: object
 *                 description: Extra charges for specific services (optional)
 *               paymentMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Accepted payment methods (optional)
 *               upiId:
 *                 type: string
 *                 description: UPI payment ID (optional)
 *               medicalLicenseNumber:
 *                 type: string
 *                 description: Medical practice license number
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *                 description: License expiry date (YYYY-MM-DD)
 *               licenseCountry:
 *                 type: string
 *                 description: Country where license is issued
 *               previousWorkExperience:
 *                 type: array
 *                 description: Previous work history (optional)
 *               awards:
 *                 type: array
 *                 description: Awards and recognitions (optional)
 *               certifications:
 *                 type: array
 *                 description: Professional certifications (optional)
 *               consultationModes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Video, Audio, Text]
 *                 description: Available consultation modes (optional)
 *               bio:
 *                 type: string
 *                 description: Professional biography (optional)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Required fields validation
    const requiredFields = [
      'firstName',
      'lastName',
      'gender',
      'specialization',
      'qualification',
      'dateOfBirth',
      'yearsOfExperience',
      'phoneNumber',
      'address',
      'preferredLanguage',
      'consultationFees',
      'medicalLicenseNumber',
      'licenseExpiryDate',
      'licenseCountry'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields,
      });
    }

    // Validate gender
    if (!['Male', 'Female', 'Other'].includes(req.body.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value',
      });
    }

    // Validate date formats
    const dateFields = ['dateOfBirth', 'licenseExpiryDate'];
    for (const field of dateFields) {
      if (req.body[field] && isNaN(Date.parse(req.body[field]))) {
        return res.status(400).json({
          success: false,
          message: `Invalid date format for ${field}`,
        });
      }
    }

    // Validate numeric fields
    if (typeof req.body.yearsOfExperience !== 'number' || req.body.yearsOfExperience < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid years of experience',
      });
    }

    if (typeof req.body.consultationFees !== 'number' || req.body.consultationFees < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid consultation fees',
      });
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete req.body.password;
    delete req.body.isVerified;
    delete req.body.rating;
    delete req.body.numberOfReviews;
    delete req.body.email; // Email should be updated through a separate endpoint with verification

    // Handle optional array and object fields
    const arrayFields = ['languagesSpoken', 'availableDays', 'paymentMethods', 'consultationModes'];
    const objectFields = ['availableTimeSlots', 'additionalCharges', 'previousWorkExperience', 'awards', 'certifications'];

    // Initialize empty arrays and objects if not provided
    arrayFields.forEach(field => {
      if (!req.body[field]) {
        req.body[field] = [];
      }
    });

    objectFields.forEach(field => {
      if (!req.body[field]) {
        req.body[field] = {};
      }
    });

    // Validate consultation modes
    if (req.body.consultationModes) {
      const validModes = ['Video', 'Audio', 'Text'];
      const invalidModes = req.body.consultationModes.filter(mode => !validModes.includes(mode));
      if (invalidModes.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid consultation modes',
          invalidModes,
        });
      }
    }

    await doctor.update(req.body);

    // Return updated doctor data without sensitive information
    const updatedDoctor = doctor.toJSON();
    delete updatedDoctor.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedDoctor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of doctors retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const { specialization, verified } = req.query;
    const where = {};

    if (specialization) {
      where.specialization = specialization;
    }

    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    const doctors = await Doctor.findAll({
      where,
      attributes: { 
        exclude: ['password'],
      },
    });

    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message,
    });
  }
});

module.exports = router; 