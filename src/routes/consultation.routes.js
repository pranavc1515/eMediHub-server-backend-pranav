const express = require('express');
const router = express.Router();
// const { authenticateToken } = require('../middleware/auth');
const consultationController = require('../controllers/consultation.controller');
/**
 * @swagger
 * /api/consultation/startConsultation:
 *   post:
 *     summary: Start or rejoin a consultation
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [doctorId, patientId]
 *             properties:
 *               doctorId: { type: integer, example: 12 }
 *               patientId: { type: integer, example: 45 }
 *               userId: { type: integer, nullable: true, example: 67 }
 *     responses:
 *       200:
 *         description: Consultation created or existing one rejoined
 *         content:
 *           application/json:
 *             examples:
 *               started:
 *                 value:
 *                   success: true
 *                   message: "Consultation started successfully"
 *                   consultationId: 101
 *                   roomName: "room-abc123"
 *                   doctorId: 12
 *                   patientId: 45
 *               rejoin:
 *                 value:
 *                   success: true
 *                   message: "Consultation already exists"
 *                   action: "rejoin"
 *                   consultationId: 101
 *                   roomName: "room-abc123"
 *       400:
 *         description: Missing/invalid fields
 *         content:
 *           application/json:
 *             example:
 *               error: "doctorId is required"
 *       404:
 *         description: Patient not in waiting queue
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "No active patient found in waiting status for this doctor"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Internal server error"
 */

router.post('/startConsultation', consultationController.startConsultation);

/**
 * @swagger
 * /api/consultation/checkStatus:
 *   post:
 *     summary: Check consultation/queue status (auto‑join support)
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [doctorId]
 *             properties:
 *               doctorId: { type: integer, example: 12 }
 *               patientId: { type: integer, nullable: true, example: 45 }
 *               userId: { type: integer, nullable: true, example: 45 }
 *               autoJoin: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Returns current status or processes auto‑join
 *         content:
 *           application/json:
 *             examples:
 *               ongoing:
 *                 value:
 *                   success: true
 *                   status: "ongoing"
 *                   action: "rejoin"
 *                   consultationId: 101
 *                   roomName: "room-abc123"
 *                   message: "Ongoing consultation found"
 *               waiting:
 *                 value:
 *                   success: true
 *                   status: "waiting"
 *                   action: "wait"
 *                   position: 3
 *                   roomName: "room-xyz789"
 *                   estimatedWait: "20 mins"
 *                   queueLength: 5
 *                   message: "Patient is already in queue"
 *               none:
 *                 value:
 *                   success: true
 *                   status: "none"
 *                   action: "none"
 *                   message: "No active consultation or queue entry found"
 *               auto_joined:
 *                 value:
 *                   success: true
 *                   status: "waiting"
 *                   action: "wait"
 *                   position: 4
 *                   roomName: "room-new001"
 *                   estimatedWait: "30 mins"
 *                   queueLength: 6
 *                   message: "Patient automatically joined queue"
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

router.post('/checkStatus', consultationController.checkConsultationStatus);

/**
 * @swagger
 * /api/consultation/rejoin:
 *   post:
 *     summary: Rejoin ongoing consultation
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [consultationId, userId, userType]
 *             properties:
 *               consultationId: { type: integer, example: 101 }
 *               userId: { type: integer, example: 12 }
 *               userType:
 *                 type: string
 *                 enum: [doctor, patient]
 *                 example: "doctor"
 *     responses:
 *       200:
 *         description: Successfully rejoined consultation
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Successfully rejoined consultation"
 *               consultationId: 101
 *               roomName: "room-abc123"
 *               doctorId: 12
 *               patientId: 45
 *       400:
 *         description: Missing or invalid input
 *       403:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized access to this consultation"
 *       404:
 *         description: Consultation not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Active consultation not found or has ended"
 *       500:
 *         description: Server error
 */

router.post('/rejoin', consultationController.rejoinConsultation);

/**
 * @swagger
 * /api/consultation/endConsultation:
 *   post:
 *     summary: End a consultation (doctor only)
 *     tags: [Consultation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [consultationId, doctorId]
 *             properties:
 *               consultationId: { type: integer, example: 101 }
 *               doctorId: { type: integer, example: 12 }
 *               notes: { type: string, example: "Patient advised rest" }
 *     responses:
 *       200:
 *         description: Consultation ended and queue updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Consultation ended successfully"
 *               consultationId: 101
 *               endTime: "2025-07-23T14:30:00.000Z"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Active consultation not found or unauthorized
 *       500:
 *         description: Server error
 */

router.post('/endConsultation', consultationController.endConsultationByDoctor);

/**
 * @swagger
 * /api/consultation/doctor/{doctorId}/history:
 *   get:
 *     summary: Get consultation history for a doctor
 *     tags: [Consultations History]
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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Doctor's consultation history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 consultations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         example: completed
 *                       scheduledDate:
 *                         type: string
 *                         format: date-time
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       patient:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           email:
 *                             type: string
 *                 totalCount:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       400:
 *         description: Doctor ID is required
 *       500:
 *         description: Server error
 */

router.get(
  '/doctor/:doctorId/history',
  consultationController.getDoctorConsultationHistory
);

/**
 * @swagger
 * /api/consultation/patient/{patientId}/history:
 *   get:
 *     summary: Get consultation history for a patient and their family
 *     tags: [Consultations History]
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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Patient's consultation history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 consultations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         example: completed
 *                       doctor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           profilePhoto:
 *                             type: string
 *                           isOnline:
 *                             type: boolean
 *                           DoctorProfessional:
 *                             type: object
 *                             properties:
 *                               specialization:
 *                                 type: string
 *                               yearsOfExperience:
 *                                 type: integer
 *                       patient:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           email:
 *                             type: string
 *                           relationship:
 *                             type: string
 *                             example: Self
 *                 totalCount:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       400:
 *         description: Patient ID is required
 *       500:
 *         description: Server error
 */

router.get(
  '/patient/:patientId/history',
  consultationController.getPatientConsultationHistory
);

module.exports = router;
