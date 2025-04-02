const express = require('express');
const router = express.Router();
const { generateToken, createRoom } = require('../controllers/video.controller');
const { authenticateToken } = require('../middleware/auth');

// Use authentication middleware based on environment
const useAuth = process.env.NODE_ENV === 'production' ? authenticateToken : (req, res, next) => next();

/**
 * @swagger
 * /api/video/token:
 *   post:
 *     summary: Generate a Twilio access token for video calls
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomName
 *             properties:
 *               roomName:
 *                 type: string
 *                 description: Name of the video room to join
 *               identity:
 *                 type: string
 *                 description: User identity (only required if not authenticated)
 *     responses:
 *       200:
 *         description: Token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token for Twilio video
 *       401:
 *         description: Unauthorized - Authentication required in production environment
 *       500:
 *         description: Server error while generating token
 */
router.post('/token', useAuth, generateToken);

/**
 * @swagger
 * /api/video/room:
 *   post:
 *     summary: Create a new Twilio video room
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomName
 *             properties:
 *               roomName:
 *                 type: string
 *                 description: Unique name for the video room
 *     responses:
 *       200:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 room:
 *                   type: object
 *                   description: Twilio room details
 *       401:
 *         description: Unauthorized - Authentication required in production environment
 *       500:
 *         description: Server error while creating room
 */
router.post('/room', useAuth, createRoom);

module.exports = router;