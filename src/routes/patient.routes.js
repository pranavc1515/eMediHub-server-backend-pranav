const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');

/**
 * @swagger
 * /api/patients/register-new:
 *   post:
 *     summary: Register a new patient (Proxy to 3rd party API)
 *     tags: [Patients]
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
 *         description: Success response from 3rd party API
 *       400:
 *         description: Error response from 3rd party API
 */
router.post('/register-new', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // First check if patient exists
    const patientExistsResult = await patientController.checkUserExists(
      phone
    );

    if (patientExistsResult.isUserExist) {
      // If patient exists, proceed with login
      const loginResult = await patientController.doLogin(phone);
      return res.json(loginResult);
    } else {
      // If patient doesn't exist, proceed with registration
      const result = await patientController.registerNewPatient(phone);
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
 * /api/patients/do-login:
 *   post:
 *     summary: Login a user with phone number or username (Proxy to 3rd party API)
 *     tags: [Users]
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
 *                 description: Phone number or username of the user
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 status_code:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Error response from 3rd party API
 */
router.post('/do-login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username/phone number is required',
      });
    }

    const result = await userController.doLogin(username);
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
 * /api/patients/validate-otp:
 *   post:
 *     summary: Validate OTP for patient authentication (Proxy to 3rd party API)
 *     tags: [Patients]
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
 *         description: Success response from 3rd party API
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.validateOTP(phone, otp);
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
 * /api/patients/checkUserExist:
 *   post:
 *     summary: Check if patient exists by phone number (Proxy to 3rd party API)
 *     tags: [Patients]
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
 *         description: Success response from 3rd party API
 *       400:
 *         description: Error response from 3rd party API
 */
router.post('/checkUserExist', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const result = await patientController.checkUserExists(phone);
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
 *     summary: Update patient's personal details (Proxy to 3rd party API)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.recordPersonalDetails(
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
 *     summary: Get patient's profile details (Proxy to 3rd party API)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.getProfileDetails(authHeader);
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
 *     summary: Get patient's medical details (Proxy to 3rd party API)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.getMedicalDetails(authHeader);
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
 *     summary: Update patient's medical details (Proxy to 3rd party API)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.updateMedicalDetails(
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
 *     summary: Verify patient's email (Proxy to 3rd party API)
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.verifyEmail(email, authHeader);
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
 *     summary: Get video consultation pricing (Proxy to 3rd party API)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.getVideoConsultationPricing(
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
 *     summary: Get doctor's consultation price (Proxy to 3rd party API)
 *     tags: [Patients]
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
 *         description: Success response from 3rd party API
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       400:
 *         description: Error response from 3rd party API
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

    const result = await patientController.getDoctorPrice(doctorId, authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
