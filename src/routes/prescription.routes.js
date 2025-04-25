const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const prescriptionController = require('../controllers/prescription.controller');
const { upload } = require('../utils/fileUpload');

// Helper function to determine auth based on environment
const useAuth = process.env.NODE_ENV === 'production' ? authenticateToken : (req, res, next) => {
    // For development, simulate a logged-in user
    req.user = {
        id: req.headers['x-user-id'] || req.headers['x-doctor-id'] || process.env.TEST_USER_ID
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
 *         description: No file uploaded or invalid file
 *       404:
 *         description: Consultation not found
 *       500:
 *         description: Server error
 */
router.post('/upload/:consultationId', useAuth, upload.single('file'), prescriptionController.uploadPrescriptionFile);

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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomPrescription'
 *     responses:
 *       201:
 *         description: Custom prescription created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Consultation not found
 *       500:
 *         description: Server error
 */
router.post('/custom/:consultationId', useAuth, prescriptionController.createCustomPrescription);

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
router.get('/:id', useAuth, prescriptionController.getPrescriptionById);

/**
 * @swagger
 * /api/prescriptions/patient/me:
 *   get:
 *     summary: Get all prescriptions for the authenticated patient
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       500:
 *         description: Server error
 */
router.get('/patient/me', useAuth, prescriptionController.getPatientPrescriptions);

/**
 * @swagger
 * /api/prescriptions/doctor/me:
 *   get:
 *     summary: Get all prescriptions created by the authenticated doctor
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       500:
 *         description: Server error
 */
router.get('/doctor/me', useAuth, prescriptionController.getDoctorPrescriptions);

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
 *       403:
 *         description: Not authorized to access these prescriptions
 *       404:
 *         description: Consultation not found
 *       500:
 *         description: Server error
 */
router.get('/consultation/:consultationId', useAuth, prescriptionController.getConsultationPrescriptions);

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
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 *       404:
 *         description: Prescription not found or no permission
 *       500:
 *         description: Server error
 */
router.delete('/:id', useAuth, prescriptionController.deletePrescription);

module.exports = router; 