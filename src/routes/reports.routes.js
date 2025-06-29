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
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "JWT Authorization header using the Bearer scheme. Example: 'Authorization: Bearer {token}'"
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the report
 *           example: 122
 *         user_id:
 *           type: integer
 *           description: ID of the user who owns the report
 *           example: 238
 *         doctor_id:
 *           type: integer
 *           nullable: true
 *           description: ID of the doctor
 *           example: 0
 *         uploaded_by:
 *           type: string
 *           nullable: true
 *           description: Who uploaded the report
 *           example: null
 *         related_user:
 *           type: string
 *           nullable: true
 *           description: Related user information
 *           example: null
 *         doctor_name:
 *           type: string
 *           description: Name of the doctor
 *           example: "Dr. Smith"
 *         report_date:
 *           type: string
 *           format: date
 *           description: Date of the report
 *           example: "2025-06-29"
 *         report_reason:
 *           type: string
 *           nullable: true
 *           description: Reason for the report
 *           example: null
 *         report_analysis:
 *           type: string
 *           nullable: true
 *           description: Analysis or findings from the report
 *           example: null
 *         report_pdf:
 *           type: string
 *           description: URL to the PDF file
 *           example: "http://43.204.91.138:3000/uploads/users/reports/1751222840180-file.pdf"
 *         food_allergies:
 *           type: string
 *           nullable: true
 *           description: Food allergies information
 *           example: null
 *         drug_allergies:
 *           type: string
 *           nullable: true
 *           description: Drug allergies information
 *           example: null
 *         blood_group:
 *           type: string
 *           nullable: true
 *           description: Blood group
 *           example: null
 *         implants:
 *           type: string
 *           nullable: true
 *           description: Implants information
 *           example: null
 *         surgeries:
 *           type: string
 *           nullable: true
 *           description: Surgery history
 *           example: null
 *         family_medical_history:
 *           type: string
 *           nullable: true
 *           description: Family medical history
 *           example: null
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-06-29T18:47:20.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2025-06-29T18:47:20.000Z"
 *         patient_name:
 *           type: string
 *           description: Name of the patient
 *           example: "John Doe"
 *     UploadReportRequest:
 *       type: object
 *       required:
 *         - doctor_name
 *         - report_date
 *         - report_pdf
 *       properties:
 *         report_pdf:
 *           type: array
 *           description: One or more PDF files (max size and count subject to validation)
 *           items:
 *             type: string
 *             format: binary
 *         report_date:
 *           type: string
 *           format: date
 *           description: Date of the report in YYYY-MM-DD format
 *           example: "2025-06-29"
 *         doctor_name:
 *           type: string
 *           description: Name of the doctor
 *           example: "Dr. Smith"
 *         target_user_id:
 *           type: integer
 *           description: Required for doctors uploading reports for patients
 *           example: 123
 *         doctor_id:
 *           type: integer
 *           description: Optional doctor ID if uploaded by a patient
 *           example: 456
 *     UploadReportResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the upload was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 201
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Report uploaded successfully"
 *         file_size:
 *           type: string
 *           description: Size of uploaded file
 *           example: "0.50 MB"
 *         total_usage:
 *           type: string
 *           description: Total storage usage
 *           example: "2.50 MB"
 *         show_warning:
 *           type: boolean
 *           description: Whether to show storage warning
 *           example: false
 *     ViewReportsResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the request was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         message:
 *           type: string
 *           description: Response message
 *           example: "Reports fetched successfully"
 *         data:
 *           type: array
 *           description: Array of report objects
 *           items:
 *             $ref: '#/components/schemas/Report'
 *     EditReportRequest:
 *       type: object
 *       description: All fields are optional - include only the fields you want to update
 *       properties:
 *         report_pdf:
 *           type: array
 *           description: One or more updated PDF files for the report
 *           items:
 *             type: string
 *             format: binary
 *         report_title:
 *           type: string
 *           description: Title of the report
 *           example: "Updated Blood Test Report"
 *         report_type:
 *           type: string
 *           description: Type of the report
 *           example: "Lab"
 *         report_date:
 *           type: string
 *           format: date
 *           description: Updated report date
 *           example: "2025-06-29"
 *         doctor_name:
 *           type: string
 *           description: Updated doctor name
 *           example: "Dr. Smith"
 *         target_user_id:
 *           type: integer
 *           description: Required if edited by a doctor for a patient
 *           example: 123
 *         doctor_id:
 *           type: integer
 *           description: Optional doctor ID if edited by a patient
 *           example: 456
 *     EditReportResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the update was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Report updated successfully"
 *     DownloadSingleResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the download was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Report downloaded successfully"
 *         data:
 *           type: object
 *           properties:
 *             fileUrl:
 *               type: string
 *               description: URL to download the PDF file
 *               example: "http://43.204.91.138:3000/uploads/users/reports/summary_1751222840180-file.pdf"
 *             fileName:
 *               type: string
 *               description: Name of the file
 *               example: "summary_1751222840180-file.pdf"
 *             patientName:
 *               type: string
 *               description: Name of the patient
 *               example: "John Doe"
 *             doctorName:
 *               type: string
 *               description: Name of the doctor
 *               example: "Dr. Smith"
 *             reportDate:
 *               type: string
 *               description: Formatted report date
 *               example: "June 29, 2025"
 *             reportReason:
 *               type: string
 *               description: Reason for the report
 *               example: "Annual Checkup"
 *             reportNotes:
 *               type: string
 *               description: Report notes or analysis
 *               example: "All vitals are normal."
 *     DownloadMergedRequest:
 *       type: object
 *       properties:
 *         related_user:
 *           type: string
 *           description: Related user identifier
 *           example: "family_member_123"
 *         start_date:
 *           type: string
 *           format: date
 *           description: Start date for filtering
 *           example: "2025-01-01"
 *         end_date:
 *           type: string
 *           format: date
 *           description: End date for filtering
 *           example: "2025-12-31"
 *     DownloadMergedResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the merge was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Reports merged successfully"
 *         fileUrl:
 *           type: string
 *           description: URL to download the merged PDF file
 *           example: "https://your-domain.com/uploads/users/reports/merged-report-123.pdf"
 *     DeleteReportResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the deletion was successful
 *           example: true
 *         status_code:
 *           type: integer
 *           description: HTTP status code
 *           example: 200
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Report deleted successfully"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: false
 *         status_code:
 *           type: integer
 *           example: 400
 *         message:
 *           type: string
 *           example: "Error message description"
 *         show_upgrade_popup:
 *           type: boolean
 *           description: Whether to show upgrade popup for storage limits
 *           example: true
 */

/**
 * @swagger
 * /api/reports/upload:
 *   post:
 *     summary: Upload one or more medical reports
 *     description: |
 *       Allows authenticated users to upload medical report PDFs.
 *       - Doctors must provide target_user_id (the patient receiving the report)
 *       - Patients can upload for themselves, and optionally assign a doctor
 *       - File size is validated against the user's subscription plan
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UploadReportRequest'
 *           examples:
 *             patient_upload:
 *               summary: Patient uploading for themselves
 *               value:
 *                 report_date: "2025-06-29"
 *                 doctor_name: "Dr. Smith"
 *                 doctor_id: 456
 *             doctor_upload:
 *               summary: Doctor uploading for patient
 *               value:
 *                 report_date: "2025-06-29"
 *                 doctor_name: "Dr. Smith"
 *                 target_user_id: 123
 *     responses:
 *       201:
 *         description: Report uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadReportResponse'
 *             example:
 *               status: true
 *               status_code: 201
 *               message: "Report uploaded successfully"
 *               file_size: "0.50 MB"
 *               total_usage: "2.50 MB"
 *               show_warning: false
 *       400:
 *         description: Validation error or storage limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 400
 *               message: "Storage limit exceeded"
 *               show_upgrade_popup: true
 *       500:
 *         description: Server error
 */
router.post('/upload', auth, upload.array('report_pdf'), reportsController.uploadReport);

/**
 * @swagger
 * /api/reports/view:
 *   get:
 *     summary: View user and family medical reports
 *     description: Returns all medical reports for the authenticated user and their family members.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ViewReportsResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Reports fetched successfully"
 *               data:
 *                 - id: 122
 *                   user_id: 238
 *                   doctor_id: 0
 *                   uploaded_by: null
 *                   related_user: null
 *                   doctor_name: "Dr. Smith"
 *                   report_date: "2025-06-29"
 *                   report_reason: null
 *                   report_analysis: null
 *                   report_pdf: "http://43.204.91.138:3000/uploads/users/reports/1751222840180-file.pdf"
 *                   food_allergies: null
 *                   drug_allergies: null
 *                   blood_group: null
 *                   implants: null
 *                   surgeries: null
 *                   family_medical_history: null
 *                   created_at: "2025-06-29T18:47:20.000Z"
 *                   updated_at: "2025-06-29T18:47:20.000Z"
 *                   patient_name: "John Doe"
 *       500:
 *         description: Internal server error
 */
router.get('/view', auth, reportsController.viewReports);

/**
 * @swagger
 * /api/reports/edit/{report_id}:
 *   put:
 *     summary: Edit a medical report
 *     description: |
 *       Allows authenticated users to edit an existing medical report and optionally update its PDF files.
 *       - Doctors must provide target_user_id
 *       - Patients can upload for themselves and optionally assign a doctor
 *       - If new files are uploaded, they replace existing report files
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: report_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the report to edit
 *         example: 122
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/EditReportRequest'
 *           examples:
 *             basic_edit:
 *               summary: Update basic information
 *               value:
 *                 report_title: "Updated Blood Test Report"
 *                 report_type: "Lab"
 *                 doctor_name: "Dr. Smith"
 *             complete_edit:
 *               summary: Update with new files
 *               value:
 *                 report_title: "Updated Blood Test Report"
 *                 report_type: "Lab"
 *                 report_date: "2025-06-29"
 *                 doctor_name: "Dr. Smith"
 *                 target_user_id: 123
 *                 doctor_id: 456
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EditReportResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Report updated successfully"
 *       404:
 *         description: Report not found or unauthorized access
 *       500:
 *         description: Internal server error
 */
router.put('/edit/:report_id', auth, upload.array('report_pdf'), reportsController.editReport);

/**
 * @swagger
 * /api/reports/delete/{report_id}:
 *   delete:
 *     summary: Delete a report
 *     description: Deletes a user's report and deducts the storage used by the file. Only the report owner can delete it.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: report_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the report to delete
 *         example: 123
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteReportResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Report deleted successfully"
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
 *     description: Merges and downloads all PDF reports of the authenticated user or a related user into a single file.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DownloadMergedRequest'
 *           examples:
 *             all_reports:
 *               summary: Download all user reports
 *               value:
 *                 related_user: ""
 *                 start_date: ""
 *                 end_date: ""
 *             filtered_reports:
 *               summary: Download reports with filters
 *               value:
 *                 related_user: "family_member_123"
 *                 start_date: "2025-01-01"
 *                 end_date: "2025-12-31"
 *     responses:
 *       200:
 *         description: Reports merged and download link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DownloadMergedResponse'
 *             example:
 *               status: true
 *               message: "Reports merged successfully"
 *               fileUrl: "https://your-domain.com/uploads/users/reports/merged-report-123.pdf"
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
 *     description: Downloads a PDF report by ID with an added summary page containing patient and report information.
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
 *         example: "122"
 *     responses:
 *       200:
 *         description: Report downloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DownloadSingleResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Report downloaded successfully"
 *               data:
 *                 fileUrl: "http://43.204.91.138:3000/uploads/users/reports/summary_1751222840180-file.pdf"
 *                 fileName: "summary_1751222840180-file.pdf"
 *                 patientName: "John Doe"
 *                 doctorName: "Dr. Smith"
 *                 reportDate: "June 29, 2025"
 *                 reportReason: "Annual Checkup"
 *                 reportNotes: "All vitals are normal."
 *       404:
 *         description: Report or PDF file not found
 *       500:
 *         description: Internal server error
 */
router.get('/download/:report_id', auth, reportsController.downloadSingleReport);

module.exports = router; 