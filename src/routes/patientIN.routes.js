const express = require('express');
const router = express.Router();
const patientINController = require('../controllers/patientIN.controller');

/**
 * @swagger
 * /api/patients/register-new:
 *   post:
 *     summary: Register a new patient
 *     tags: [PatientsIN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *               uid:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful, OTP sent
 *       400:
 *         description: Error in registration
 */
router.post('/register-new', async (req, res) => {
  try {
    const { phone, uid } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // First check if patient exists
    const patientExistsResult = await patientINController.checkUserExists(
      phone
    );

    if (patientExistsResult.isUserExist) {
      // If patient exists, proceed with login
      const loginResult = await patientINController.doLogin(phone);
      return res.json(loginResult);
    } else {
      // If patient doesn't exist, proceed with registration
      const result = await patientINController.registerNewPatient(phone, uid);
      res.json(result);
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/validate-otp:
 *   post:
 *     summary: Validate OTP for patient authentication
 *     tags: [PatientsIN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP validated successfully
 *       400:
 *         description: Invalid OTP or error in validation
 */
router.post('/validate-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    const result = await patientINController.validateOTP(phone, otp);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/checkUserExists:
 *   post:
 *     summary: Check if patient exists by phone number
 *     tags: [PatientsIN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response with existence status
 *       400:
 *         description: Error in checking existence
 */
router.post('/checkUserExists', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'fhone number is required',
      });
    }

    const result = await patientINController.checkUserExists(phone);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/do-login:
 *   post:
 *     summary: Login a patient (send OTP)
 *     tags: [PatientsIN]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Phone number or email
 *     responses:
 *       200:
 *         description: Login initiated, OTP sent
 *       400:
 *         description: Error in login
 */
router.post('/do-login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username (phone/email) is required',
      });
    }

    const result = await patientINController.doLogin(username);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/record-personal-details:
 *   put:
 *     summary: Update patient's personal details
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               marital_status:
 *                 type: string
 *               height:
 *                 type: string
 *               weight:
 *                 type: string
 *               diet:
 *                 type: string
 *               profession:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Personal details updated successfully
 *       400:
 *         description: Error in updating details
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.put('/record-personal-details', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.recordPersonalDetails(
      req.body,
      authHeader
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/profile-details:
 *   get:
 *     summary: Get patient's profile details
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error in retrieving details
 */
router.get('/profile-details', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.getProfileDetails(authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/medical-details:
 *   get:
 *     summary: Get patient's medical details
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Medical details retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error in retrieving details
 */
router.get('/medical-details', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.getMedicalDetails(authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/medical-details:
 *   post:
 *     summary: Update patient's medical details
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               food_allergies:
 *                 type: string
 *               drug_allergies:
 *                 type: string
 *               blood_group:
 *                 type: string
 *               implants:
 *                 type: string
 *               surgeries:
 *                 type: string
 *               family_medical_history:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medical details updated successfully
 *       400:
 *         description: Error in updating details
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.post('/medical-details', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.updateMedicalDetails(
      req.body,
      authHeader
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/email-verify:
 *   put:
 *     summary: Verify patient's email
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Error in verification
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.put('/email-verify', async (req, res) => {
  try {
    const { email } = req.body;
    const authHeader = req.headers.authorization;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.verifyEmail(email, authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/do-delete-account:
 *   delete:
 *     summary: Delete patient account
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         description: Error in deleting account
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.delete('/do-delete-account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.deleteAccount(authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/video-price:
 *   get:
 *     summary: Get video consultation pricing
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pricing details retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error in retrieving pricing
 */
router.get('/video-price', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.getVideoConsultationPricing(
      authHeader
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/doctor-price/{doctorId}:
 *   get:
 *     summary: Get doctor's consultation price
 *     tags: [PatientsIN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor price retrieved successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error in retrieving doctor price
 */
router.get('/doctor-price/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
      });
    }

    const result = await patientINController.getDoctorPrice(
      doctorId,
      authHeader
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
