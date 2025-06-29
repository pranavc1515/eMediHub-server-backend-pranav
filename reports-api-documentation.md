# Reports API Integration Documentation

## Overview

This document describes the integration of the 3rd party Reports API into the eMediHub backend server. The integration acts as a proxy, allowing the frontend to access all Reports API functionality through the existing eMediHub backend infrastructure.

## Base Configuration

- **3rd Party API Base URL**: `http://43.204.91.138:3000`
- **Local Proxy Endpoints**: `http://localhost:3000/api/reports/*`
- **Environment Variable**: `REPORTS_API_BASE_URL` (optional, defaults to the above URL)

## Available Endpoints

### 1. Upload Medical Report

**Endpoint**: `POST /api/reports/upload`

**Authentication**: Required (Bearer token)

**Content-Type**: `multipart/form-data`

**Description**: Allows authenticated users to upload medical report PDFs. Doctors must provide target_user_id (the patient receiving the report). Patients can upload for themselves, and optionally assign a doctor. File size is validated against the user's subscription plan.

**Parameters**:
- `report_pdf` (array): One or more PDF files (max size and count subject to validation)
- `report_date` (string, date format): Date of the report
- `doctor_name` (string): Name of the doctor
- `target_user_id` (integer): Required for doctors uploading reports for patients
- `doctor_id` (integer, optional): Optional doctor ID if uploaded by a patient

**Success Response (201)**:
```json
{
  "status": true,
  "status_code": 201,
  "message": "Report uploaded successfully",
  "file_size": "0.50 MB",
  "total_usage": "2.50 MB",
  "show_warning": false
}
```

**Error Response (400)**:
```json
{
  "status": true,
  "status_code": 0,
  "message": "string",
  "show_upgrade_popup": true
}
```

**Example cURL**:
```bash
curl -X POST "http://localhost:3000/api/reports/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "report_pdf=@file.pdf;type=application/pdf" \
  -F "report_date=2025-06-29" \
  -F "doctor_name=Dr. Smith" \
  -F "target_user_id=123" \
  -F "doctor_id=456"
```

### 2. View Medical Reports

**Endpoint**: `GET /api/reports/view`

**Authentication**: Required (Bearer token)

**Description**: Returns all medical reports for the authenticated user and their family members.

**Success Response (200)**:
```json
{
  "status": true,
  "status_code": 200,
  "message": "Reports fetched successfully",
  "data": [
    {
      "id": 122,
      "user_id": 238,
      "doctor_id": 0,
      "uploaded_by": null,
      "related_user": null,
      "doctor_name": "Dr. Smith",
      "report_date": "2025-06-29",
      "report_reason": null,
      "report_analysis": null,
      "report_pdf": "http://43.204.91.138:3000/uploads/users/reports/1751222840180-file.pdf",
      "food_allergies": null,
      "drug_allergies": null,
      "blood_group": null,
      "implants": null,
      "surgeries": null,
      "family_medical_history": null,
      "created_at": "2025-06-29T18:47:20.000Z",
      "updated_at": "2025-06-29T18:47:20.000Z",
      "patient_name": "John Doe"
    }
  ]
}
```

**Example cURL**:
```bash
curl -X GET "http://localhost:3000/api/reports/view" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Edit Medical Report

**Endpoint**: `PUT /api/reports/edit/{report_id}`

**Authentication**: Required (Bearer token)

**Content-Type**: `multipart/form-data`

**Description**: Allows authenticated users to edit an existing medical report and optionally update its PDF files. Doctors must provide target_user_id. Patients can upload for themselves and optionally assign a doctor. If new files are uploaded, they replace existing report files.

**Path Parameters**:
- `report_id` (required): ID of the report to edit

**Parameters**:
- `report_pdf` (array, optional): One or more updated PDF files for the report
- `report_title` (string, optional): Title of the report
- `report_type` (string, optional): Type of the report
- `report_date` (string, date format, optional): Date of the report
- `doctor_name` (string, optional): Name of the doctor
- `target_user_id` (integer, optional): Required if edited by a doctor for a patient
- `doctor_id` (integer, optional): Optional doctor ID if edited by a patient

**Success Response (200)**:
```json
{
  "status": true,
  "status_code": 200,
  "message": "Report updated successfully"
}
```

**Example cURL**:
```bash
curl -X PUT "http://localhost:3000/api/reports/edit/122" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "report_title=Updated Blood Test Report" \
  -F "report_type=Lab" \
  -F "report_date=2025-06-29" \
  -F "doctor_name=Dr. Smith" \
  -F "target_user_id=123" \
  -F "doctor_id=456"
```

### 4. Delete Report

**Endpoint**: `DELETE /api/reports/delete/{report_id}`

**Authentication**: Required (Bearer token)

**Description**: Deletes a user's report and deducts the storage used by the file. Only the report owner can delete it.

**Path Parameters**:
- `report_id` (required): ID of the report to delete

**Success Response (200)**:
```json
{
  "status": true,
  "status_code": 200,
  "message": "Report deleted successfully"
}
```

**Error Responses**:
- **403**: Unauthorized to delete this report
- **404**: Report not found
- **500**: Failed to delete report

**Example cURL**:
```bash
curl -X DELETE "http://localhost:3000/api/reports/delete/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Download Merged Reports

**Endpoint**: `GET /api/reports/download`

**Authentication**: Required (Bearer token)

**Description**: Merges and downloads all PDF reports of the authenticated user or a related user into a single file.

**Request Body** (JSON):
- `related_user` (string, optional): Related user identifier
- `start_date` (string, date format, optional): Start date for filtering
- `end_date` (string, date format, optional): End date for filtering

**Success Response (200)**:
```json
{
  "status": true,
  "message": "Reports merged successfully",
  "fileUrl": "https://your-domain.com/uploads/users/reports/merged-report-123.pdf"
}
```

**Error Responses**:
- **404**: No reports found to download
- **500**: Server error while processing report download

**Example cURL**:
```bash
curl -X GET "http://localhost:3000/api/reports/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "related_user": "family_member_123",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  }'
```

### 6. Download Single Report

**Endpoint**: `GET /api/reports/download/{report_id}`

**Authentication**: Required (Bearer token)

**Description**: Downloads a PDF report by ID with an added summary page containing patient and report information.

**Path Parameters**:
- `report_id` (required): ID of the report to download

**Success Response (200)**:
```json
{
  "status": true,
  "status_code": 200,
  "message": "Report downloaded successfully",
  "data": {
    "fileUrl": "http://43.204.91.138:3000/uploads/users/reports/summary_1751222840180-file.pdf",
    "fileName": "summary_1751222840180-file.pdf",
    "patientName": "John Doe",
    "doctorName": "Dr. Smith",
    "reportDate": "June 29, 2025",
    "reportReason": "Annual Checkup",
    "reportNotes": "All vitals are normal."
  }
}
```

**Error Responses**:
- **404**: Report or PDF file not found
- **500**: Internal server error

**Example cURL**:
```bash
curl -X GET "http://localhost:3000/api/reports/download/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

The frontend can now call these endpoints directly using the existing authentication system:

### JavaScript/Axios Example
```javascript
// Upload a report
const uploadReport = async (formData, token) => {
  try {
    const response = await axios.post('/api/reports/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// View reports
const viewReports = async (token) => {
  try {
    const response = await axios.get('/api/reports/view', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Edit report
const editReport = async (reportId, formData, token) => {
  try {
    const response = await axios.put(`/api/reports/edit/${reportId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Delete report
const deleteReport = async (reportId, token) => {
  try {
    const response = await axios.delete(`/api/reports/delete/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Download merged reports
const downloadMergedReports = async (token, filters = {}) => {
  try {
    const response = await axios.get('/api/reports/download', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: filters
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Download single report
const downloadSingleReport = async (reportId, token) => {
  try {
    const response = await axios.get(`/api/reports/download/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
```

## Error Handling

All endpoints return standardized error responses:

- **400**: Validation error or storage limit exceeded
- **401**: Unauthorized (invalid or missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **500**: Internal server error

## Testing

Use the provided test file to verify the integration:

```bash
node test-reports-api.js
```

## Environment Variables

Add the following to your `.env` file if you need to override the default API URL:

```env
REPORTS_API_BASE_URL=http://43.204.91.138:3000
```

## Notes

- File uploads support multiple PDF files via the `report_pdf` parameter
- Storage limits are enforced based on user subscription plans
- The download merged reports endpoint uses GET with a request body, which may require special handling in some HTTP clients
- All date parameters should be in YYYY-MM-DD format
- The API automatically handles storage quota tracking and warnings 