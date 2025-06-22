const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const consultationController = require('../../controllers/doctor/consultation.controller');

// Use authentication middleware based on environment
const useAuth = process.env.NODE_ENV === 'production' ? authenticateToken : (req, res, next) => {
  // For development, simulate a logged-in doctor
  req.user = { id: req.headers['x-doctor-id'] || process.env.TEST_DOCTOR_ID };
  next();
};

/**
 * @swagger
 * /api/doctor/consultations/queue:
 *   get:
 *     summary: Fetch all patients in current queue
 *     tags: [Doctor Consultations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients in queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Consultation details with patient information
 *       500:
 *         description: Server error
 */
router.get('/consultations/queue', useAuth, consultationController.getConsultationQueue);

/**
 * @swagger
 * /api/doctor/consultations/start/{id}:
 *   post:
 *     summary: Start consultation for patient (by consultation ID)
 *     tags: [Doctor Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consultation ID
 *     responses:
 *       200:
 *         description: Consultation started successfully
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
 *                   example: Consultation started successfully
 *                 data:
 *                   type: object
 *                   description: Consultation details with patient information
 *       400:
 *         description: Cannot start new consultation while another is in progress
 *       404:
 *         description: Consultation not found or cannot be started
 *       500:
 *         description: Server error
 */
router.post('/consultations/start/:id', useAuth, consultationController.startConsultation);

/**
 * @swagger
 * /api/doctor/consultations/end/{id}:
 *   post:
 *     summary: End consultation
 *     tags: [Doctor Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consultation ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Doctor's notes about the consultation
 *     responses:
 *       200:
 *         description: Consultation ended successfully
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
 *                   example: Consultation ended successfully
 *                 data:
 *                   type: object
 *                   description: Updated consultation details
 *       404:
 *         description: Active consultation not found
 *       500:
 *         description: Server error
 */
router.post('/consultations/end/:id', useAuth, consultationController.endConsultation);

/**
 * @swagger
 * /api/doctor/consultations/current:
 *   get:
 *     summary: Get currently active consultation
 *     tags: [Doctor Consultations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Currently active consultation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Consultation details with patient information
 *       404:
 *         description: No active consultation found
 *       500:
 *         description: Server error
 */
router.get('/consultations/current', useAuth, consultationController.getCurrentConsultation);

/**
 * @swagger
 * /api/doctor/consultations/history:
 *   get:
 *     summary: Past consultations with pagination support
 *     tags: [Doctor Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Consultation history with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Consultation details with patient information
 *       500:
 *         description: Server error
 */
router.get('/consultations/history', useAuth, consultationController.getConsultationHistory);

module.exports = router; 