const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth.middleware');
const reportsController = require('../controllers/reports.controller');

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

/**
 * @swagger
 * /api/reports/upload:
 *   post:
 *     summary: Upload a medical report PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - report_title
 *               - report_type
 *               - doctor_name
 *             properties:
 *               report_title:
 *                 type: string
 *                 description: Title of the medical report
 *               report_type:
 *                 type: string
 *                 description: Type of the report (e.g., Lab, Radiology)
 *               doctor_name:
 *                 type: string
 *                 description: Name of the doctor
 *               doctor_id:
 *                 type: integer
 *                 description: Optional doctor ID (for non-doctor uploads)
 *               target_user_id:
 *                 type: integer
 *                 description: Required if uploader is a doctor
 *               related_user:
 *                 type: integer
 *                 description: Optional related user ID
 *               report_date:
 *                 type: string
 *                 format: date
 *                 description: Date of the report
 *               report_reason:
 *                 type: string
 *                 description: Reason for the report
 *               report_analysis:
 *                 type: string
 *                 description: Analysis or findings
 *               food_allergies:
 *                 type: string
 *                 description: Food allergies information
 *               drug_allergies:
 *                 type: string
 *                 description: Drug allergies information
 *               blood_group:
 *                 type: string
 *                 description: Blood group
 *               implants:
 *                 type: string
 *                 description: Implants information
 *               surgeries:
 *                 type: string
 *                 description: Surgery history
 *               family_medical_history:
 *                 type: string
 *                 description: Family medical history
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload
 *     responses:
 *       201:
 *         description: Report uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 status_code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 file_size:
 *                   type: string
 *                 total_usage:
 *                   type: string
 *                 show_warning:
 *                   type: boolean
 *       400:
 *         description: Validation error or storage exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/upload', auth, upload.single('file'), reportsController.uploadReport);

/**
 * @swagger
 * /api/reports/view:
 *   get:
 *     summary: View user and family medical reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports from this date (e.g., 2024-01-01)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports up to this date (e.g., 2024-12-31)
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 status_code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       report_title:
 *                         type: string
 *                       report_type:
 *                         type: string
 *                       report_pdf:
 *                         type: string
 *                       report_date:
 *                         type: string
 *                         format: date
 *       500:
 *         description: Internal server error
 */
router.get('/view', auth, reportsController.viewReports);

/**
 * @swagger
 * /api/reports/delete/{report_id}:
 *   delete:
 *     summary: Delete a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: report_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the report to delete
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 status_code:
 *                   type: integer
 *                 message:
 *                   type: string
 *       403:
 *         description: Unauthorized to delete this report
 *       404:
 *         description: Report not found
 *       500:
 *         description: Failed to delete report
 */
router.delete('/delete/:report_id', auth, reportsController.deleteReport);

/**
 * @swagger
 * /api/reports/download:
 *   get:
 *     summary: Download merged reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               related_user:
 *                 type: string
 *                 description: Related user ID
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Start date for filtering
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: End date for filtering
 *     responses:
 *       200:
 *         description: Reports merged and download link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 fileUrl:
 *                   type: string
 *       404:
 *         description: No reports found to download
 *       500:
 *         description: Server error while processing report download
 */
router.get('/download', auth, reportsController.downloadMergedReports);

/**
 * @swagger
 * /api/reports/download/{report_id}:
 *   get:
 *     summary: Download a single report with summary page
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: report_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the report to download
 *     responses:
 *       200:
 *         description: Report downloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 status_code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileUrl:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     patientName:
 *                       type: string
 *                     doctorName:
 *                       type: string
 *                     reportDate:
 *                       type: string
 *                     reportReason:
 *                       type: string
 *                     reportNotes:
 *                       type: string
 *       404:
 *         description: Report or PDF file not found
 *       500:
 *         description: Internal server error
 */
router.get('/download/:report_id', auth, reportsController.downloadSingleReport);

module.exports = router; 