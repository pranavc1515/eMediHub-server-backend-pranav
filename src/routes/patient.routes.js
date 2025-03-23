const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const patientController = require('../controllers/patient.controller');

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
    // Required fields validation
    const requiredFields = [
      'firstName',
      'lastName',
      'gender',
      'dateOfBirth',
      'phoneNumber',
      'preferredLanguage',
    ];
    
    if (!req.body.relationship) {
      // This is a main profile
    } else {
      // This is a family member profile
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

    const result = await patientController.createPatientProfile(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/profiles:
 *   get:
 *     summary: Get all patient profiles for the authenticated user
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profiles retrieved successfully
 */
router.get('/profiles', auth, async (req, res) => {
  try {
    const profiles = await patientController.getPatientProfiles(req.user.id);

    res.json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
 *         description: Profile retrieved successfully
 *       404:
 *         description: Patient not found
 */
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const profile = await patientController.getPatientProfile(req.params.id, req.user.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message,
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
 *         description: Profile updated successfully
 *       404:
 *         description: Patient not found
 */
router.put('/profile/:id', auth, async (req, res) => {
  try {
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

    const updatedProfile = await patientController.updatePatientProfile(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message,
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
    await patientController.deletePatientProfile(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Patient profile deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message.includes('Cannot delete main user profile')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router; 