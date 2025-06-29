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
 *           example: 2
 *         user_id:
 *           type: integer
 *           description: ID of the user who owns the report
 *           example: 1
 *         related_user:
 *           type: integer
 *           nullable: true
 *           description: ID of related user (family member)
 *           example: 5
 *         doctor_name:
 *           type: string
 *           description: Name of the doctor
 *           example: "Dr test2"
 *         report_date:
 *           type: string
 *           format: date
 *           description: Date of the report
 *           example: "2024-09-27"
 *         report_reason:
 *           type: string
 *           description: Reason for the report
 *           example: "Routine checkup"
 *         report_analysis:
 *           type: string
 *           description: Analysis or findings from the report
 *           example: "Blood test results"
 *         report_pdf:
 *           type: array
 *           description: Array of PDF file URLs
 *           items:
 *             type: string
 *           example: ["http://13.234.252.76:3000/uploads/reports/1727775051374-merged_report_1_1727679211462.pdf"]
 *         food_allergies:
 *           type: string
 *           nullable: true
 *           description: Food allergies information
 *           example: "Nuts"
 *         drug_allergies:
 *           type: string
 *           nullable: true
 *           description: Drug allergies information
 *           example: "Penicillin"
 *         blood_group:
 *           type: string
 *           nullable: true
 *           description: Blood group
 *           example: "O+"
 *         implants:
 *           type: string
 *           nullable: true
 *           description: Implants information
 *           example: "None"
 *         surgeries:
 *           type: string
 *           nullable: true
 *           description: Surgery history
 *           example: "hello"
 *         family_medical_history:
 *           type: string
 *           nullable: true
 *           description: Family medical history
 *           example: "Diabetes"
 *         medical_condition:
 *           type: string
 *           nullable: true
 *           description: Current medical conditions
 *           example: "Hypertension"
 *         allergies:
 *           type: string
 *           nullable: true
 *           description: General allergies
 *           example: "Pollen"
 *         medications:
 *           type: string
 *           nullable: true
 *           description: Current medications
 *           example: "Lisinopril"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2024-10-01T09:30:51.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-10-01T09:30:51.000Z"
 *     ReportsResponse:
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
 *     UploadReportRequest:
 *       type: object
 *       required:
 *         - doctor_name
 *         - report_date
 *         - report_reason
 *         - report_analysis
 *         - report_pdf
 *       properties:
 *         related_user:
 *           type: string
 *           description: ID of related user (family member) - optional
 *           example: ""
 *         doctor_name:
 *           type: string
 *           description: Name of the doctor
 *           minLength: 2
 *           maxLength: 100
 *           example: "Drname"
 *         report_date:
 *           type: string
 *           format: date
 *           description: Date of the report in YYYY-MM-DD format
 *           example: "2024-10-9"
 *         report_reason:
 *           type: string
 *           description: Reason for the report
 *           minLength: 2
 *           maxLength: 500
 *           example: "testing1"
 *         report_analysis:
 *           type: string
 *           description: Analysis or findings from the report
 *           minLength: 2
 *           maxLength: 1000
 *           example: "Blood test result1"
 *         food_allergies:
 *           type: string
 *           description: Food allergies information
 *           maxLength: 200
 *           example: "Nuts"
 *         drug_allergies:
 *           type: string
 *           description: Drug allergies information
 *           maxLength: 200
 *           example: "Penicillin"
 *         blood_group:
 *           type: string
 *           description: Blood group
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *           example: "O+"
 *         implants:
 *           type: string
 *           description: Implants information
 *           maxLength: 200
 *           example: "None"
 *         surgeries:
 *           type: string
 *           description: Surgery history
 *           maxLength: 500
 *           example: "hello"
 *         family_medical_history:
 *           type: string
 *           description: Family medical history
 *           maxLength: 500
 *           example: "Diabetes"
 *         medical_condition:
 *           type: string
 *           description: Current medical conditions
 *           maxLength: 500
 *           example: "Hypertension"
 *         allergies:
 *           type: string
 *           description: General allergies
 *           maxLength: 200
 *           example: "Pollen"
 *         medications:
 *           type: string
 *           description: Current medications
 *           maxLength: 500
 *           example: "Lisinopril"
 *         report_pdf:
 *           type: string
 *           format: binary
 *           description: PDF file(s) to upload - supports multiple files
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
 *     ViewReportsRequest:
 *       type: object
 *       description: All filter parameters are optional
 *       properties:
 *         patientName:
 *           type: string
 *           description: Filter by patient name
 *           example: ""
 *         doctor_name:
 *           type: string
 *           description: Filter by doctor name
 *           example: ""
 *         report_reason:
 *           type: string
 *           description: Filter by report reason
 *           example: ""
 *         start_date:
 *           type: string
 *           format: date
 *           description: Filter by start date (report_date)
 *           example: ""
 *         end_date:
 *           type: string
 *           format: date
 *           description: Filter by end date (report_date)
 *           example: ""
 *         related_user:
 *           type: integer
 *           description: Filter by related user ID
 *           example: 0
 *         searchText:
 *           type: string
 *           description: General search across multiple fields
 *           example: ""
 *     EditReportRequest:
 *       type: object
 *       description: All fields are optional - include only the fields you want to update
 *       properties:
 *         related_user:
 *           type: string
 *           description: Updated related user ID
 *           example: ""
 *         doctor_name:
 *           type: string
 *           description: Updated doctor name
 *           example: "satyammmm"
 *         report_date:
 *           type: string
 *           format: date
 *           description: Updated report date
 *           example: "2024-09-27"
 *         report_reason:
 *           type: string
 *           description: Updated report reason
 *           example: "Routine checkup "
 *         report_analysis:
 *           type: string
 *           description: Updated report analysis
 *           example: "Blood test  j"
 *         food_allergies:
 *           type: string
 *           description: Updated food allergies
 *           example: "Nuts"
 *         drug_allergies:
 *           type: string
 *           description: Updated drug allergies
 *           example: "Penicillin"
 *         blood_group:
 *           type: string
 *           description: Updated blood group
 *           example: "O+"
 *         implants:
 *           type: string
 *           description: Updated implants information
 *           example: "None"
 *         surgeries:
 *           type: string
 *           description: Updated surgery history
 *           example: "hello"
 *         family_medical_history:
 *           type: string
 *           description: Updated family medical history
 *           example: "Diabetes"
 *         medical_condition:
 *           type: string
 *           description: Updated medical conditions
 *           example: "Hypertension"
 *         allergies:
 *           type: string
 *           description: Updated allergies
 *           example: "Pollen"
 *         medications:
 *           type: string
 *           description: Updated medications
 *           example: "Lisinopril"
 *         report_pdf:
 *           type: string
 *           format: binary
 *           description: New PDF file to replace existing one
 *         deletePages:
 *           type: array
 *           description: Array of page numbers to delete from existing PDF
 *           items:
 *             type: integer
 *           example: []
 *         addAfterPage:
 *           type: integer
 *           description: Page number after which to add new content
 *           example: ""
 *     DownloadResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           description: Indicates if the download was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Reports merged successfully"
 *         fileUrl:
 *           type: string
 *           description: URL to download the merged PDF file
 *           example: "http://13.234.252.76:3000/uploads/reports/merged-report-1-0.pdf"
 *     GenericResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         status_code:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
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
 */

/**
 * @swagger
 * /api/reports/upload:
 *   post:
 *     summary: Upload a medical report with PDF files
 *     description: Upload a new medical report with associated PDF files and medical information. Supports multiple PDF file uploads.
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
 *             basic_upload:
 *               summary: Basic report upload
 *               value:
 *                 related_user: ""
 *                 doctor_name: "Drname"
 *                 report_date: "2024-10-9"
 *                 report_reason: "testing1"
 *                 report_analysis: "Blood test result1"
 *             detailed_upload:
 *               summary: Detailed report with medical history
 *               value:
 *                 related_user: "5"
 *                 doctor_name: "Dr test2"
 *                 report_date: "2024-09-27"
 *                 report_reason: "Routine checkup"
 *                 report_analysis: "Blood test results"
 *                 food_allergies: "Nuts"
 *                 drug_allergies: "Penicillin"
 *                 blood_group: "O+"
 *                 implants: "None"
 *                 surgeries: "hello"
 *                 family_medical_history: "Diabetes"
 *                 medical_condition: "Hypertension"
 *                 allergies: "Pollen"
 *                 medications: "Lisinopril"
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
 *       400:
 *         description: Validation error - Missing required fields or invalid file format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Required fields: doctor_name, report_date, report_reason, report_analysis"
 *               invalid_file:
 *                 summary: Invalid file format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Only PDF files are allowed"
 *               file_too_large:
 *                 summary: File size exceeded
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "File size cannot exceed 10MB"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       500:
 *         description: Internal server error during file upload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while uploading report"
 */
router.post('/upload', auth, upload.array('report_pdf'), reportsController.uploadReport);

/**
 * @swagger
 * /api/reports/view:
 *   get:
 *     summary: View and filter medical reports
 *     description: Retrieve medical reports with optional filtering capabilities. Can filter by patient name, doctor, date range, and more.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ViewReportsRequest'
 *           examples:
 *             no_filters:
 *               summary: Get all reports
 *               value:
 *                 patientName: ""
 *                 doctor_name: ""
 *                 report_reason: ""
 *                 start_date: ""
 *                 end_date: ""
 *                 related_user: 0
 *                 searchText: ""
 *             with_filters:
 *               summary: Filter by doctor and date range
 *               value:
 *                 patientName: ""
 *                 doctor_name: "Dr test2"
 *                 report_reason: ""
 *                 start_date: "2024-09-01"
 *                 end_date: "2024-09-30"
 *                 related_user: 0
 *                 searchText: ""
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportsResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Reports fetched successfully"
 *               data:
 *                 - id: 2
 *                   user_id: 1
 *                   related_user: 5
 *                   doctor_name: "Dr test2"
 *                   report_date: "2024-09-27"
 *                   report_reason: "Routine checkup"
 *                   report_analysis: "Blood test results"
 *                   report_pdf: ["http://13.234.252.76:3000/uploads/reports/1727775051374-merged_report_1_1727679211462.pdf"]
 *                   food_allergies: "Nuts"
 *                   drug_allergies: "Penicillin"
 *                   blood_group: "O+"
 *                   implants: "None"
 *                   surgeries: "hello"
 *                   family_medical_history: "Diabetes"
 *                   created_at: "2024-10-01T09:30:51.000Z"
 *                   updated_at: "2024-10-01T09:30:51.000Z"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       500:
 *         description: Internal server error while fetching reports
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while fetching reports"
 */
router.get('/view', auth, reportsController.viewReports);

/**
 * @swagger
 * /api/reports/download/{report_id}:
 *   get:
 *     summary: Download a specific report by ID
 *     description: Download a single medical report PDF file by providing the report ID.
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
 *         description: Unique ID of the report to download
 *         example: 100
 *     responses:
 *       200:
 *         description: Report file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 status_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Report downloaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileUrl:
 *                       type: string
 *                       example: "http://13.234.252.76:3000/uploads/reports/report_100.pdf"
 *                     fileName:
 *                       type: string
 *                       example: "medical_report_100.pdf"
 *                     patientName:
 *                       type: string
 *                       example: "John Doe"
 *                     doctorName:
 *                       type: string
 *                       example: "Dr test2"
 *                     reportDate:
 *                       type: string
 *                       example: "2024-09-27"
 *                     reportReason:
 *                       type: string
 *                       example: "Routine checkup"
 *                     reportNotes:
 *                       type: string
 *                       example: "Blood test results"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       404:
 *         description: Report not found or PDF file not accessible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 404
 *               message: "Report with ID 100 not found"
 *       500:
 *         description: Internal server error during download
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while downloading report"
 */
router.get('/download/:report_id', auth, reportsController.downloadSingleReport);

/**
 * @swagger
 * /api/reports/edit/{report_id}:
 *   put:
 *     summary: Edit an existing medical report
 *     description: Update an existing medical report with new information and optionally replace or modify PDF files. All fields are optional - include only what you want to update.
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
 *         description: Unique ID of the report to edit
 *         example: 2
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
 *                 doctor_name: "satyammmm"
 *                 report_reason: "Routine checkup "
 *                 report_analysis: "Blood test  j"
 *             complete_edit:
 *               summary: Update all fields with medical history
 *               value:
 *                 related_user: ""
 *                 doctor_name: "satyammmm"
 *                 report_date: "2024-09-27"
 *                 report_reason: "Routine checkup "
 *                 report_analysis: "Blood test  j"
 *                 food_allergies: "Nuts"
 *                 drug_allergies: "Penicillin"
 *                 blood_group: "O+"
 *                 implants: "None"
 *                 surgeries: "hello"
 *                 family_medical_history: "Diabetes"
 *                 medical_condition: "Hypertension"
 *                 allergies: "Pollen"
 *                 medications: "Lisinopril"
 *                 deletePages: []
 *                 addAfterPage: ""
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Report updated successfully"
 *       400:
 *         description: Validation error - Invalid data format or file constraints
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_file:
 *                 summary: Invalid file format
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "Only PDF files are allowed"
 *               no_changes:
 *                 summary: No fields provided for update
 *                 value:
 *                   status: false
 *                   status_code: 400
 *                   message: "At least one field must be provided for update"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       404:
 *         description: Report not found or user not authorized to edit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 404
 *               message: "Report with ID 2 not found or access denied"
 *       500:
 *         description: Internal server error during update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Internal server error while updating report"
 */
router.put('/edit/:report_id', auth, upload.array('report_pdf'), reportsController.editReport);

/**
 * @swagger
 * /api/reports/download:
 *   get:
 *     summary: Download merged reports as a single PDF
 *     description: Download multiple reports merged into a single PDF file. Can optionally filter by related user.
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
 *                 type: integer
 *                 description: Optional filter by related user ID (0 for all users)
 *                 example: 0
 *           examples:
 *             all_reports:
 *               summary: Download all user reports
 *               value:
 *                 related_user: 0
 *             family_member_reports:
 *               summary: Download specific family member reports
 *               value:
 *                 related_user: 5
 *     responses:
 *       200:
 *         description: Reports merged and download link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DownloadResponse'
 *             example:
 *               status: true
 *               message: "Reports merged successfully"
 *               fileUrl: "http://13.234.252.76:3000/uploads/reports/merged-report-1-0.pdf"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       404:
 *         description: No reports found to merge and download
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 404
 *               message: "No reports found to download"
 *       500:
 *         description: Server error while processing report merge
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Server error while processing report download"
 */
router.get('/download', auth, reportsController.downloadMergedReports);

/**
 * @swagger
 * /api/reports/delete/{report_id}:
 *   delete:
 *     summary: Delete a medical report
 *     description: Permanently delete a medical report and its associated PDF files. This action cannot be undone.
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
 *         description: Unique ID of the report to delete
 *         example: 9
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *             example:
 *               status: true
 *               status_code: 200
 *               message: "Report deleted successfully"
 *       401:
 *         description: Authentication required - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 401
 *               message: "Authentication token required"
 *       403:
 *         description: Unauthorized to delete this report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 403
 *               message: "You are not authorized to delete this report"
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               status_code: 404
 *               message: "Report with ID 9 not found"
 *       500:
 *         description: Failed to delete report due to server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: false
 *               message: "Failed to delete report due to server error"
 */
router.delete('/delete/:report_id', auth, reportsController.deleteReport);

module.exports = router; 