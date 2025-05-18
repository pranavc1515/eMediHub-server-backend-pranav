const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const prescriptionController = require('../controllers/prescription.controller');
const { upload } = require('../utils/fileUpload');

// Helper function to determine auth based on environment
const useAuth = process.env.NODE_ENV === 'production' ? authenticateToken : (req, res, next) => {
    // For development, simulate a logged-in user
    // For backward compatibility, still check headers but prefer query params
    req.user = {
        id: req.query.doctorId || req.query.userId || req.headers['x-doctor-id'] || req.headers['x-user-id'] || process.env.TEST_USER_ID
    };
    next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Medicine:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the medicine
 *         dosage:
 *           type: string
 *           description: Dosage instructions (e.g., "1 tablet")
 *         frequency:
 *           type: string
 *           description: How often to take (e.g., "twice daily")
 *         duration:
 *           type: string
 *           description: How long to take (e.g., "7 days")
 *         notes:
 *           type: string
 *           description: Additional notes
 *       required:
 *         - name
 *         - dosage
 *         - frequency
 *     CustomPrescription:
 *       type: object
 *       properties:
 *         medicines:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Medicine'
 *         instructions:
 *           type: string
 *           description: General instructions for the patient
 *       required:
 *         - medicines
 */

/**
 * @swagger
 * /api/prescriptions/upload/{consultationId}:
 *   post:
 *     summary: Upload a prescription file (PDF or image)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consultation ID
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Required if not authenticated - ID of the doctor creating the prescription
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional - ID of the user (patient) for whom the prescription is created. If not provided, a synthetic ID will be generated.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Prescription file (PDF, JPG, JPEG, PNG)
 *             required:
 *               - file
 *     responses:
 *       201:
 *         description: Prescription uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file or missing required IDs
 *       404:
 *         description: Consultation not found
 *       500:
 *         description: Server error
 */
router.post('/upload/:consultationId', upload.single('file'), prescriptionController.uploadPrescriptionFile);

/**
 * @swagger
 * /api/prescriptions/custom/{consultationId}:
 *   post:
 *     summary: Create a custom prescription
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consultation ID
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Required if not authenticated - ID of the doctor creating the prescription
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Optional - ID of the user (patient) for whom the prescription is created. If not provided, a synthetic ID will be generated.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicines:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Medicine'
 *               instructions:
 *                 type: string
 *                 description: General instructions for the patient
 *               patientName:
 *                 type: string
 *                 description: Optional name of the patient
 *               patientId:
 *                 type: string
 *                 description: Optional ID of the patient, alternative to query param
 *             required:
 *               - medicines
 *     responses:
 *       201:
 *         description: Custom prescription created successfully
 *       400:
 *         description: Invalid request data or missing doctor ID
 *       404:
 *         description: Consultation not found
 *       500:
 *         description: Server error
 */
router.post('/custom/:consultationId', prescriptionController.createCustomPrescription);

/**
 * @swagger
 * /api/prescriptions/patient/me:
 *   get:
 *     summary: Get all prescriptions for a patient
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Required if not authenticated - ID of the patient
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of prescriptions
 *       400:
 *         description: Patient ID is required
 *       500:
 *         description: Server error
 */
router.get('/patient/me', prescriptionController.getPatientPrescriptions);

/**
 * @swagger
 * /api/prescriptions/doctor/me:
 *   get:
 *     summary: Get all prescriptions created by a doctor
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Required if not authenticated - ID of the doctor
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of prescriptions
 *       400:
 *         description: Doctor ID is required
 *       500:
 *         description: Server error
 */
router.get('/doctor/me', prescriptionController.getDoctorPrescriptions);

/**
 * @swagger
 * /api/prescriptions/consultation/{consultationId}:
 *   get:
 *     summary: Get all prescriptions for a specific consultation
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consultation ID
 *     responses:
 *       200:
 *         description: List of prescriptions for the consultation
 *       404:
 *         description: Consultation not found
 *       500:
 *         description: Server error
 */
router.get('/consultation/:consultationId', prescriptionController.getConsultationPrescriptions);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     summary: Get prescription by ID
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription details
 *       404:
 *         description: Prescription not found
 *       500:
 *         description: Server error
 */
router.get('/:id', prescriptionController.getPrescriptionById);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   delete:
 *     summary: Delete a prescription (soft delete)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Prescription ID
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Required if not authenticated - ID of the doctor who created the prescription
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 *       400:
 *         description: Doctor ID is required
 *       404:
 *         description: Prescription not found or no permission
 *       500:
 *         description: Server error
 */
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router; 