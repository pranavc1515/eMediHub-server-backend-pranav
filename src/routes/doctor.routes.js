const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth.middleware');
const Doctor = require('../models/doctor.model');

// Define Doctor model
const DoctorModel = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Male', 'Female', 'Other']]
    }
  },
  specialization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Add other fields as needed
}, {
  tableName: 'doctors',
  timestamps: true,
});

DoctorModel.sync()
  .then(() => console.log('Doctor table synchronized'))
  .catch(err => console.error('Error syncing Doctor table:', err));

// Route to Register a New Doctor
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
    const doctor = await DoctorModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      data: doctor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

// Route to Login Doctor
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
  const { email, password } = req.body;
  try {
    const doctor = await DoctorModel.findOne({ where: { email } });
    if (!doctor || doctor.password !== password) { // Replace with actual password comparison logic (e.g., bcrypt)
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

// Route to Get All Doctors
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
    if (specialization) where.specialization = specialization;
    if (verified !== undefined) where.isVerified = verified === 'true';

    const doctors = await DoctorModel.findAll({ where });
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

// Route to Get Doctor Profile (Authenticated)
router.get('/profile', auth, async (req, res) => {
  try {
    const doctor = await DoctorModel.findByPk(req.user.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error fetching profile', error: error.message });
  }
});

module.exports = router;
