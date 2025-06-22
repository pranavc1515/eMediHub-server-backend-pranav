const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const consultationController = require('../controllers/consultation.controller');

// Use authentication middleware based on environment
// const useAuth =
//   process.env.NODE_ENV === 'production'
//     ? authenticateToken
//     : (req, res, next) => {
//         // For development, simulate a logged-in patient
//         req.user = {
//           id: req.headers['x-patient-id'] || process.env.TEST_PATIENT_ID,
//         };
//         next();
//       };

router.post('/startConsultation', consultationController.startConsultation);

router.post('/nextConsultation', consultationController.NextConsultation);

// New routes for consultation status and reconnection
router.post('/checkStatus', consultationController.checkConsultationStatus);
router.post('/rejoin', consultationController.rejoinConsultation);
router.post('/endConsultation', consultationController.endConsultationByDoctor);

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
router.get('/history', consultationController.getDoctorConsultationHistory);

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
router.delete('/:id/cancel', consultationController.cancelConsultation);

/**
 * @swagger
 * /api/consultation/doctor/{doctorId}/history:
 *   get:
 *     summary: Get doctor's consultation history
 *     tags: [Doctor Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor's ID
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
 *           default: 15
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Doctor's consultation history with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 consultations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       patient:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                 totalCount:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 7
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 15
 *       400:
 *         description: Doctor ID is required
 *       500:
 *         description: Server error
 */
router.get('/doctor/:doctorId/history', consultationController.getDoctorConsultationHistory);

/**
 * @swagger
 * /api/consultation/patient/{patientId}/history:
 *   get:
 *     summary: Get patient's consultation history
 *     tags: [Patient Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient's ID
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
 *           default: 15
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Patient's consultation history with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 consultations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                       doctor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           specialization:
 *                             type: string
 *                 totalCount:
 *                   type: integer
 *                   example: 100
 *                 totalPages:
 *                   type: integer
 *                   example: 7
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 15
 *       400:
 *         description: Patient ID is required
 *       500:
 *         description: Server error
 */
router.get('/patient/:patientId/history', consultationController.getPatientConsultationHistory);

module.exports = router;
