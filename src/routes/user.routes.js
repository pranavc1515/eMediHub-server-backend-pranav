const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth.middleware');

// Base URL for the 3rd party API
const API_BASE_URL = 'https://devbackend.emedihub.com/user';

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
    const response = await axios.post(`${API_BASE_URL}/register-new`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to authentication service',
        error: error.message
      }
    );
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
    const response = await axios.post(`${API_BASE_URL}/validate-otp`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to authentication service',
        error: error.message
      }
    );
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
    const response = await axios.post(`${API_BASE_URL}/checkUserExist`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to authentication service',
        error: error.message
      }
    );
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
    
    const response = await axios.put(`${API_BASE_URL}/record-personal-details`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to user service',
        error: error.message
      }
    );
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
    
    const response = await axios.get(`${API_BASE_URL}/profile-details`, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to user service',
        error: error.message
      }
    );
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
    
    const response = await axios.get(`${API_BASE_URL}/medical-details`, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to user service',
        error: error.message
      }
    );
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
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
    }
    
    const response = await axios.put(`${API_BASE_URL}/email-verify`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to user service',
        error: error.message
      }
    );
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
    
    const response = await axios.post(`${API_BASE_URL}/medical-details`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        success: false,
        message: 'Error forwarding request to user service',
        error: error.message
      }
    );
  }
});

module.exports = router; 