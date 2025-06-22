const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const consultationController = require('../../controllers/patient/consultation.controller');

// Use authentication middleware based on environment
const useAuth = process.env.NODE_ENV === 'production' ? authenticateToken : (req, res, next) => {
  // For development, simulate a logged-in patient
  req.user = { id: req.headers['x-patient-id'] || process.env.TEST_PATIENT_ID };
  next();
};

/**
 * @swagger
 * /api/consultation/book:
 *   post:
 *     summary: Book a video consultation with a doctor
 *     tags: [Patient Consultations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - scheduledDate
 *               - startTime
 *               - endTime
 *             properties:
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the doctor to book consultation with
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *                 description: Date for the consultation (YYYY-MM-DD)
 *               startTime:
 *                 type: string
 *                 format: time
 *                 description: Start time for the consultation (HH:MM:SS)
 *               endTime:
 *                 type: string
 *                 format: time
 *                 description: End time for the consultation (HH:MM:SS)
 *               notes:
 *                 type: string
 *                 description: Additional notes for the consultation
 *     responses:
 *       201:
 *         description: Consultation booked successfully
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
 *                   example: Consultation booked successfully
 *                 data:
 *                   type: object
 *                   description: Consultation details
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error
 */
router.post('/book', useAuth, consultationController.bookConsultation);

/**
//  * @swagger
 * /api/consultation/upcoming:
 *   get:
 *     summary: Get patient's upcoming consultations
 *     tags: [Patient Consultations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming consultations
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
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Consultation details with doctor information
 *       500:
 *         description: Server error
 */
// router.get('/upcoming', useAuth, consultationController.getUpcomingConsultations);

/**
 * @swagger
 * /api/consultation/history:
 *   get:
 *     summary: Get patient's consultation history
 *     tags: [Patient Consultations]
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
 *                   example: 15
 *                 totalPages:
 *                   type: integer
 *                   example: 2
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Consultation details with doctor information
 *       500:
 *         description: Server error
 */
router.get('/history', useAuth, consultationController.getConsultationHistory);

/**
 * @swagger
 * /api/consultation/{id}:
 *   get:
 *     summary: Get details of a specific consultation
 *     tags: [Patient Consultations]
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
 *         description: Consultation details
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
 *                   description: Consultation details with doctor information
 *       404:
 *         description: Consultation not found
 *       500:
 *         description: Server error
 */
router.get('/:id', useAuth, consultationController.getConsultationDetails);

/**
 * @swagger
 * /api/consultation/{id}/cancel:
 *   delete:
 *     summary: Cancel an upcoming consultation
 *     tags: [Patient Consultations]
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
 *               cancelReason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Consultation cancelled successfully
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
 *                   example: Consultation cancelled successfully
 *                 data:
 *                   type: object
 *                   description: Updated consultation details
 *       404:
 *         description: Consultation not found or cannot be cancelled
 *       500:
 *         description: Server error
 */
router.delete('/:id/cancel', useAuth, consultationController.cancelConsultation);

module.exports = router; 