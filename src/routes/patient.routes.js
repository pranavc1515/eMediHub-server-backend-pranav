const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const Patient = require('../models/patient.model');

/**
 * @swagger
 * /api/patients/profile:
 *   post:
 *     summary: Create a new patient profile (self or family member)
 *     tags: [Patients]
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
 *               - dateOfBirth
 *               - phoneNumber
 *               - preferredLanguage
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               profilePicture:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               password:
 *                 type: string
 *               medicalHistory:
 *                 type: object
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredLanguage:
 *                 type: string
 *               relationship:
 *                 type: string
 *                 description: Relationship with the main user (required for family members)
 *     responses:
 *       201:
 *         description: Patient profile created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/profile', auth, async (req, res) => {
  try {
    const isMainProfile = !req.body.relationship;

    // Check if main profile already exists for this user
    if (isMainProfile) {
      const existingMainProfile = await Patient.findOne({
        where: {
          userId: req.user.id,
          isMainUser: true,
        },
      });

      if (existingMainProfile) {
        return res.status(400).json({
          success: false,
          message: 'Main patient profile already exists for this user',
        });
      }
    }

    // Required fields validation
    const requiredFields = [
      'firstName',
      'lastName',
      'gender',
      'dateOfBirth',
      'phoneNumber',
      'preferredLanguage',
    ];

    if (!isMainProfile) {
      requiredFields.push('relationship');
    }

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

    // Validate date format
    if (isNaN(Date.parse(req.body.dateOfBirth))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for dateOfBirth',
      });
    }

    // Create patient profile
    const patient = await Patient.create({
      ...req.body,
      userId: req.user.id,
      isMainUser: isMainProfile,
    });

    // Remove sensitive information
    const patientData = patient.toJSON();
    delete patientData.password;

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: patientData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating patient profile',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/family:
 *   get:
 *     summary: Get all family members' profiles
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Family members retrieved successfully
 */
router.get('/family', auth, async (req, res) => {
  try {
    const patients = await Patient.findAll({
      where: {
        userId: req.user.id,
        isMainUser: false,
      },
      attributes: { exclude: ['password'] },
    });

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching family members',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/profile/{id}:
 *   get:
 *     summary: Get a specific patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient profile retrieved successfully
 *       404:
 *         description: Patient not found
 */
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      attributes: { exclude: ['password'] },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching patient profile',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/profile/{id}:
 *   put:
 *     summary: Update a patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Patient profile updated successfully
 *       404:
 *         description: Patient not found
 */
router.put('/profile/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Remove fields that shouldn't be updated directly
    delete req.body.userId;
    delete req.body.isMainUser;
    delete req.body.password;

    // Validate gender if provided
    if (req.body.gender && !['Male', 'Female', 'Other'].includes(req.body.gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value',
      });
    }

    // Validate date format if provided
    if (req.body.dateOfBirth && isNaN(Date.parse(req.body.dateOfBirth))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format for dateOfBirth',
      });
    }

    await patient.update(req.body);

    // Remove sensitive information
    const patientData = patient.toJSON();
    delete patientData.password;

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: patientData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating patient profile',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/profile/{id}:
 *   delete:
 *     summary: Delete a patient profile (family member only)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient profile deleted successfully
 *       400:
 *         description: Cannot delete main user profile
 *       404:
 *         description: Patient not found
 */
router.delete('/profile/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    if (patient.isMainUser) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete main user profile',
      });
    }

    await patient.destroy();

    res.json({
      success: true,
      message: 'Patient profile deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting patient profile',
      error: error.message,
    });
  }
});

module.exports = router; 