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

    const result = await patientController.registerNewPatient(username);
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
router.post('/checkUserExists', async (req, res) => {
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
 *     summary: Get user's latest medical details
 *     description: |
 *       Retrieves the most recent medical information saved by the authenticated user.
 *       This includes all medical profile data such as allergies, blood group, 
 *       surgery history, and family medical history.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Medical details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 status_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Medical details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 188
 *                     user_id:
 *                       type: integer
 *                       example: 389
 *                     doctor_id:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     uploaded_by:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     related_user:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     doctor_name:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     report_date:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     report_reason:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     report_analysis:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     report_pdf:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     food_allergies:
 *                       type: string
 *                       example: "Peanuts, Dust"
 *                     drug_allergies:
 *                       type: string
 *                       example: "Smoking"
 *                     blood_group:
 *                       type: string
 *                       example: "O+"
 *                     implants:
 *                       type: string
 *                       example: "Metformin"
 *                     surgeries:
 *                       type: string
 *                       example: "Appendectomy"
 *                     family_medical_history:
 *                       type: string
 *                       example: "Heart disease in parents"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-16T18:41:38.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-07-16T18:41:38.000Z"
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Medical details retrieved successfully"
 *               data:
 *                 id: 188
 *                 user_id: 389
 *                 doctor_id: null
 *                 uploaded_by: null
 *                 related_user: null
 *                 doctor_name: null
 *                 report_date: null
 *                 report_reason: null
 *                 report_analysis: null
 *                 report_pdf: null
 *                 food_allergies: "Peanuts, Dust"
 *                 drug_allergies: "Smoking"
 *                 blood_group: "O+"
 *                 implants: "Metformin"
 *                 surgeries: "Appendectomy"
 *                 family_medical_history: "Heart disease in parents"
 *                 created_at: "2025-07-16T18:41:38.000Z"
 *                 updated_at: "2025-07-16T18:41:38.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Unauthorized - Invalid or missing token"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Server error"
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
 *     summary: Save or update user medical details
 *     description: |
 *       Allows an authenticated user to create or update their medical profile.
 *       This endpoint accepts various medical information including allergies, 
 *       blood group, surgeries, and lifestyle habits.
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blood_group:
 *                 type: string
 *                 description: Blood group of the user
 *                 example: "O+"
 *               food_allergies:
 *                 type: string
 *                 description: Food allergies information
 *                 example: "Peanuts, Dust"
 *               drug_allergies:
 *                 type: string
 *                 description: Drug allergies information
 *                 example: "Smoking"
 *               implants:
 *                 type: string
 *                 description: Information about implants
 *                 example: "Metformin"
 *               surgeries:
 *                 type: string
 *                 description: Surgery history
 *                 example: "Appendectomy"
 *               family_medical_history:
 *                 type: string
 *                 description: Family medical history
 *                 example: "Heart disease in parents"
 *               smoking_habits:
 *                 type: string
 *                 description: Smoking habits
 *                 example: "Never"
 *               alcohol_consumption:
 *                 type: string
 *                 description: Alcohol consumption habits
 *                 example: "Occasionally"
 *               physical_activity:
 *                 type: string
 *                 description: Physical activity level
 *                 example: "Regular exercise"
 *           examples:
 *             complete_profile:
 *               summary: Complete medical profile
 *               value:
 *                 blood_group: "O+"
 *                 food_allergies: "Peanuts, Dust"
 *                 drug_allergies: "Smoking"
 *                 implants: "Metformin"
 *                 surgeries: "Appendectomy"
 *                 family_medical_history: "Heart disease in parents"
 *                 smoking_habits: "Never"
 *                 alcohol_consumption: "Occasionally"
 *                 physical_activity: "Regular exercise"
 *             minimal_profile:
 *               summary: Minimal medical profile
 *               value:
 *                 blood_group: "A+"
 *                 food_allergies: "None"
 *                 drug_allergies: "None"
 *     responses:
 *       200:
 *         description: Medical details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 status_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Medical details updated successfully"
 *                 data:
 *                   type: object
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Medical details updated successfully"
 *               data: {}
 *       201:
 *         description: Medical details added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 status_code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Medical details added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     food_allergies:
 *                       type: string
 *                       example: "Peanuts, Dust"
 *                     drug_allergies:
 *                       type: string
 *                       example: "Smoking"
 *                     blood_group:
 *                       type: string
 *                       example: "O+"
 *                     implants:
 *                       type: string
 *                       example: "Metformin"
 *                     surgeries:
 *                       type: string
 *                       example: "Appendectomy"
 *                     family_medical_history:
 *                       type: string
 *                       example: "Heart disease in parents"
 *             example:
 *               status: true
 *               status_code: 201
 *               message: "Medical details added successfully"
 *               data:
 *                 food_allergies: "Peanuts, Dust"
 *                 drug_allergies: "Smoking"
 *                 blood_group: "O+"
 *                 implants: "Metformin"
 *                 surgeries: "Appendectomy"
 *                 family_medical_history: "Heart disease in parents"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Server error"
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
 *     summary: Verify or update user's email
 *     description: |
 *       Allows an authenticated user to verify their email address. If the email is new 
 *       or not yet verified, an OTP is sent to the email for verification.
 *       This endpoint handles both email verification and email updates.
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
 *                 format: email
 *                 description: Email address to verify
 *                 example: "user@example.com"
 *               name:
 *                 type: string
 *                 description: User's name (optional)
 *                 example: "John Doe"
 *           examples:
 *             with_name:
 *               summary: Email verification with name
 *               value:
 *                 email: "user@example.com"
 *                 name: "John Doe"
 *             email_only:
 *               summary: Email verification only
 *               value:
 *                 email: "newuser@example.com"
 *     responses:
 *       200:
 *         description: OTP sent for verification or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 status_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OTP sent to email for verification"
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "OTP sent to email for verification"
 *       400:
 *         description: Email already in use by another user or missing email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *             examples:
 *               email_in_use:
 *                 summary: Email already in use
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Email is already in use by another user."
 *               missing_email:
 *                 summary: Missing email field
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Email is required"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 status_code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */
router.put('/email-verify', async (req, res) => {
  try {
    const { email, name } = req.body;
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

    const result = await patientController.verifyEmail(email, authHeader, name);
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

/**
 * @swagger
 * /api/patients/do-delete-account:
 *   delete:
 *     summary: Delete user account (soft delete) (Proxy to 3rd party API)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
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
 *         description: Bad request - invalid user ID or deletion failed
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
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

    const result = await patientController.deleteUserAccount(authHeader);
    res.json(result);
  } catch (error) {
    res.status(error.response?.status || 400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/settings/about:
 *   get:
 *     summary: Get about page content (Proxy to 3rd party API)
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: About page content retrieved successfully
 *       400:
 *         description: Error response from 3rd party API
 *       500:
 *         description: Server error
 */
router.get('/settings/about', async (req, res) => {
  try {
    const result = await patientController.getAboutPage();
    res.json(result);
  } catch (error) {
    res.status(error.response?.status || 400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/patients/settings/terms:
 *   get:
 *     summary: Get terms page content (Proxy to 3rd party API)
 *     tags: [Patients]
 *     responses:
 *       200:
 *         description: Terms page content retrieved successfully
 *       400:
 *         description: Error response from 3rd party API
 *       500:
 *         description: Server error
 */
router.get('/settings/terms', async (req, res) => {
  try {
    const result = await patientController.getTermsPage();
    res.json(result);
  } catch (error) {
    res.status(error.response?.status || 400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
