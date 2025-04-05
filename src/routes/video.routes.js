const express = require('express');
const router = express.Router();
const { 
    generateToken, 
    createRoom, 
    listRooms, 
    getRoom, 
    completeRoom, 
    listParticipants, 
    disconnectParticipant 
} = require('../controllers/video.controller');
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

/**
 * @swagger
 * /api/video/rooms:
 *   get:
 *     summary: List all video rooms
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter rooms by status (in-progress, completed)
 *     responses:
 *       200:
 *         description: List of rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 rooms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Room details
 *       401:
 *         description: Unauthorized - Authentication required
 *       500:
 *         description: Server error while fetching rooms
 */
router.get('/rooms', useAuth, listRooms);

/**
 * @swagger
 * /api/video/room/{roomSid}:
 *   get:
 *     summary: Get details of a specific room
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomSid
 *         required: true
 *         schema:
 *           type: string
 *         description: The SID of the room to retrieve
 *     responses:
 *       200:
 *         description: Room details retrieved successfully
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
 *                   description: Room details
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error while fetching room
 */
router.get('/room/:roomSid', useAuth, getRoom);

/**
 * @swagger
 * /api/video/room/{roomSid}/complete:
 *   post:
 *     summary: End a room manually
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomSid
 *         required: true
 *         schema:
 *           type: string
 *         description: The SID of the room to complete
 *     responses:
 *       200:
 *         description: Room completed successfully
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
 *                   description: Updated room details
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error while completing room
 */
router.post('/room/:roomSid/complete', useAuth, completeRoom);

/**
 * @swagger
 * /api/video/room/{roomSid}/participants:
 *   get:
 *     summary: List all participants in a room
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomSid
 *         required: true
 *         schema:
 *           type: string
 *         description: The SID of the room
 *     responses:
 *       200:
 *         description: Participants list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 participants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Participant details
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error while fetching participants
 */
router.get('/room/:roomSid/participants', useAuth, listParticipants);

/**
 * @swagger
 * /api/video/room/{roomSid}/participant/{participantSid}/disconnect:
 *   post:
 *     summary: Disconnect a participant from a room
 *     tags: [Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomSid
 *         required: true
 *         schema:
 *           type: string
 *         description: The SID of the room
 *       - in: path
 *         name: participantSid
 *         required: true
 *         schema:
 *           type: string
 *         description: The SID of the participant to disconnect
 *     responses:
 *       200:
 *         description: Participant disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Participant disconnected successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Room or participant not found
 *       500:
 *         description: Server error while disconnecting participant
 */
router.post('/room/:roomSid/participant/:participantSid/disconnect', useAuth, disconnectParticipant);

module.exports = router;