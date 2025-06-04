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
router.get('/history', consultationController.getConsultationHistory);

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
 * /api/consultation/doctor:
 *   get:
 *     summary: Get all consultations for a specific doctor
 *     description: Retrieve all consultations for a doctor using doctor ID as query parameter with optional filtering, sorting, and pagination
 *     tags: [Doctor Consultations]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: The unique ID of the doctor
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of consultations per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, ongoing, completed, cancelled]
 *         description: Filter consultations by status
 *         example: completed
 *       - in: query
 *         name: consultationType
 *         schema:
 *           type: string
 *           enum: [video, in-person]
 *         description: Filter consultations by type
 *         example: video
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, scheduledDate, startTime, status]
 *           default: createdAt
 *         description: Field to sort by
 *         example: scheduledDate
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order (ascending or descending)
 *         example: DESC
 *     responses:
 *       200:
 *         description: Successfully retrieved doctor's consultations
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
 *                   example: "Consultations retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     consultations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           patientId:
 *                             type: integer
 *                             example: 123
 *                           doctorId:
 *                             type: integer
 *                             example: 456
 *                           scheduledDate:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-15"
 *                           startTime:
 *                             type: string
 *                             format: time
 *                             example: "10:30:00"
 *                           endTime:
 *                             type: string
 *                             format: time
 *                             example: "11:00:00"
 *                           status:
 *                             type: string
 *                             enum: [pending, ongoing, completed, cancelled]
 *                             example: "completed"
 *                           consultationType:
 *                             type: string
 *                             enum: [video, in-person]
 *                             example: "video"
 *                           roomName:
 *                             type: string
 *                             example: "room_123456"
 *                           notes:
 *                             type: string
 *                             example: "Patient showed improvement"
 *                           symptoms:
 *                             type: string
 *                             example: "Fever, headache"
 *                           diagnosis:
 *                             type: string
 *                             example: "Viral fever"
 *                           prescription:
 *                             type: string
 *                             example: "Paracetamol 500mg twice daily"
 *                           actualStartTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:35:00.000Z"
 *                           actualEndTime:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T11:05:00.000Z"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T09:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T11:05:00.000Z"
 *                           patient:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 123
 *                               fullName:
 *                                 type: string
 *                                 example: "John Doe"
 *                               phoneNumber:
 *                                 type: string
 *                                 example: "+1234567890"
 *                               email:
 *                                 type: string
 *                                 example: "john.doe@email.com"
 *                               gender:
 *                                 type: string
 *                                 example: "Male"
 *                               age:
 *                                 type: integer
 *                                 example: 30
 *                               details:
 *                                 type: object
 *                                 properties:
 *                                   address:
 *                                     type: string
 *                                     example: "123 Main St, City"
 *                                   emergencyContact:
 *                                     type: string
 *                                     example: "+9876543210"
 *                                   bloodGroup:
 *                                     type: string
 *                                     example: "O+"
 *                           doctor:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 456
 *                               fullName:
 *                                 type: string
 *                                 example: "Dr. Smith"
 *                               email:
 *                                 type: string
 *                                 example: "dr.smith@hospital.com"
 *                               phoneNumber:
 *                                 type: string
 *                                 example: "+1234567891"
 *                               profilePhoto:
 *                                 type: string
 *                                 example: "https://example.com/photo.jpg"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalConsultations:
 *                           type: integer
 *                           example: 25
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                     doctor:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 456
 *                         fullName:
 *                           type: string
 *                           example: "Dr. Smith"
 *                         email:
 *                           type: string
 *                           example: "dr.smith@hospital.com"
 *                         phoneNumber:
 *                           type: string
 *                           example: "+1234567891"
 *                     filters:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "all"
 *                         consultationType:
 *                           type: string
 *                           example: "all"
 *                         sortBy:
 *                           type: string
 *                           example: "createdAt"
 *                         sortOrder:
 *                           type: string
 *                           example: "DESC"
 *       400:
 *         description: Bad request - Missing or invalid doctor ID
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
 *                   example: "Doctor ID is required as a query parameter"
 *       404:
 *         description: Doctor not found
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
 *                   example: "Doctor not found"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error while fetching doctor consultations"
 */
router.get('/doctor', consultationController.getDoctorConsultations);

module.exports = router;
