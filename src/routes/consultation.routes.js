const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const consultationController = require('../controllers/consultation.controller');

// Use authentication middleware based on environment
const useAuth =
  process.env.NODE_ENV === 'production'
    ? authenticateToken
    : (req, res, next) => {
        // For development, simulate a logged-in patient
        req.user = {
          id: req.headers['x-patient-id'] || process.env.TEST_PATIENT_ID,
        };
        next();
      };

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
router.delete(
  '/:id/cancel',
  useAuth,
  consultationController.cancelConsultation
);

module.exports = router;
