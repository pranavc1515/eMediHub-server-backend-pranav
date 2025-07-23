const express = require('express');
const router = express.Router();
const {
  getPatientQueue,
  leavePatientQueue,
  joinPatientQueue,
} = require('../controllers/patientQueue.controller');

/**
 * @swagger
 * /api/patientQueue/{doctorId}:
 *   get:
 *     summary: Get the patient queue for a specific doctor
 *     description: Returns a paginated list of patients currently in queue (waiting or in consultation) for a doctor, ordered by their queue position.
 *     tags: [Patient Queue]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the doctor whose queue is being retrieved
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
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Successfully fetched the patient queue
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
 *                   properties:
 *                     queue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           position:
 *                             type: integer
 *                             example: 3
 *                           status:
 *                             type: string
 *                             example: "waiting"
 *                           patient:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Ramesh Reddy"
 *                               phone:
 *                                 type: string
 *                                 example: "+911234567890"
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *       500:
 *         description: Internal server error while fetching queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch patient queue"
 */

router.get('/:doctorId', getPatientQueue);

/**
 * @swagger
 * /api/patientQueue/join:
 *   post:
 *     summary: Join the patient queue for a doctor
 *     description: Adds a patient (or their family member) to the doctor’s queue. Handles existing consultations and conflicts.
 *     tags: [Patient Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, patientId, userId]
 *             properties:
 *               doctorId:
 *                 type: integer
 *                 example: 12
 *               patientId:
 *                 type: integer
 *                 example: 105
 *               userId:
 *                 type: integer
 *                 example: 21
 *     responses:
 *       200:
 *         description: Successfully joined the queue or already present
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "User joined the queue successfully"
 *                 action:
 *                   type: string
 *                   enum: [joined, rejoin, wait, in_consultation]
 *                   example: "joined"
 *                 position:
 *                   type: integer
 *                 roomName:
 *                   type: string
 *                   example: "room-abc123"
 *                 estimatedWait:
 *                   type: string
 *                   example: "20 mins"
 *                 queueLength:
 *                   type: integer
 *       400:
 *         description: Validation error or already in another doctor’s queue
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 value:
 *                   success: false
 *                   message: "Missing doctorId or patientId"
 *               alreadyInAnother:
 *                 value:
 *                   success: false
 *                   message: "User is already in queue or consultation with another doctor"
 *                   action: "conflict"
 *                   conflictingDoctorId: 13
 *                   conflictingPatientId: 201
 *       404:
 *         description: Patient not found or not active
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Patient not found or not active"
 *       500:
 *         description: Failed to join queue
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Failed to join queue"
 */

router.post('/join', joinPatientQueue);

/**
 * @swagger
 * /api/patientQueue/leave:
 *   post:
 *     summary: Leave the patient queue
 *     description: Removes the patient from the queue and adjusts others' positions. Notifies doctor and patients via socket.
 *     tags: [Patient Queue]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, userId]
 *             properties:
 *               doctorId:
 *                 type: integer
 *                 example: 14
 *               patientId:
 *                 type: integer
 *                 example: 208
 *               userId:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       200:
 *         description: Successfully left the queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Successfully left the queue"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       patient:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Ramesh Reddy"
 *                           phone:
 *                             type: string
 *                             example: "+918866514855"
 *                       position:
 *                         type: integer
 *                         example: 2
 *                       status:
 *                         type: string
 *                         example: "waiting"
 *       400:
 *         description: Missing userId or invalid request
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Missing userId - required to identify platform user"
 *       404:
 *         description: Queue entry not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Queue entry not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Failed to leave queue"
 */

router.post('/leave', leavePatientQueue);

module.exports = router;
