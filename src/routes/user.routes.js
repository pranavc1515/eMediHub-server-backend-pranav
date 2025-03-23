const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

/**
 * @swagger
 * /api/users/register-new:
 *   post:
 *     summary: Register a new user (Proxy to 3rd party API)
 *     tags: [Users]
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
        message: 'Phone number is required'
      });
    }
    
    const result = await userController.registerNewUser(phone);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/validate-otp:
 *   post:
 *     summary: Validate OTP for user authentication (Proxy to 3rd party API)
 *     tags: [Users]
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
        message: 'Phone number and OTP are required'
      });
    }
    
    const result = await userController.validateOTP(phone, otp);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/checkUserExist:
 *   post:
 *     summary: Check if user exists by phone number (Proxy to 3rd party API)
 *     tags: [Users]
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
        message: 'Phone number is required'
      });
    }
    
    const result = await userController.checkUserExists(phone);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/record-personal-details:
 *   put:
 *     summary: Update user's personal details (Proxy to 3rd party API)
 *     tags: [Users]
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
        message: 'Authorization header is required'
      });
    }
    
    const result = await userController.recordPersonalDetails(req.body, authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/profile-details:
 *   get:
 *     summary: Get user's profile details (Proxy to 3rd party API)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       401:
 *         description: Unauthorized
 */
router.get('/profile-details', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }
    
    const result = await userController.getProfileDetails(authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/medical-details:
 *   get:
 *     summary: Get user's medical details (Proxy to 3rd party API)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       401:
 *         description: Unauthorized
 */
router.get('/medical-details', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }
    
    const result = await userController.getMedicalDetails(authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/email-verify:
 *   put:
 *     summary: Verify user's email (Proxy to 3rd party API)
 *     tags: [Users]
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
 *       401:
 *         description: Unauthorized
 */
router.put('/email-verify', async (req, res) => {
  try {
    const { email } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const result = await userController.verifyEmail(email, authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/medical-details:
 *   post:
 *     summary: Update user's medical details (Proxy to 3rd party API)
 *     tags: [Users]
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
 *       401:
 *         description: Unauthorized
 */
router.post('/medical-details', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }
    
    const result = await userController.updateMedicalDetails(req.body, authHeader);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/users/do-login:
 *   post:
 *     summary: Login user with username (Proxy to 3rd party API)
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
 *     responses:
 *       200:
 *         description: Success response from 3rd party API
 *       400:
 *         description: Error response from 3rd party API
 */
router.post('/do-login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    const result = await userController.doLogin(username);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 