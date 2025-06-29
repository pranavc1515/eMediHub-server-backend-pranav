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

**Parameters**:
- `report_title` (required): Title of the medical report
- `report_type` (required): Type of report (e.g., "Lab", "Radiology")
- `doctor_name` (required): Name of the doctor
- `doctor_id` (optional): Doctor ID (for non-doctor uploads)
- `target_user_id` (optional): Required if uploader is a doctor
- `related_user` (optional): Related user ID
- `report_date` (optional): Date of the report (YYYY-MM-DD)
- `report_reason` (optional): Reason for the report
- `report_analysis` (optional): Analysis or findings
- `food_allergies` (optional): Food allergies information
- `drug_allergies` (optional): Drug allergies information
- `blood_group` (optional): Blood group
- `implants` (optional): Implants information
- `surgeries` (optional): Surgery history
- `family_medical_history` (optional): Family medical history
- `file` (optional): PDF file to upload

**Example cURL**:
```bash
curl -X POST "http://localhost:3000/api/reports/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "report_title=Blood Test Report" \
  -F "report_type=Lab" \
  -F "doctor_name=Dr. Smith" \
  -F "report_date=2024-12-01" \
  -F "report_reason=Annual physical exam" \
  -F "file=@/path/to/file.pdf"
```

### 2. View Medical Reports

**Endpoint**: `GET /api/reports/view`

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)

**Example cURL**:
```bash
curl -X GET "http://localhost:3000/api/reports/view?start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Delete Report

**Endpoint**: `DELETE /api/reports/delete/{report_id}`

**Authentication**: Required (Bearer token)

**Path Parameters**:
- `report_id` (required): ID of the report to delete

**Example cURL**:
```bash
curl -X DELETE "http://localhost:3000/api/reports/delete/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Download Merged Reports

**Endpoint**: `GET /api/reports/download`

**Authentication**: Required (Bearer token)

**Request Body** (JSON):
- `related_user` (optional): Related user ID
- `start_date` (optional): Start date for filtering
- `end_date` (optional): End date for filtering

**Example cURL**:
```bash
curl -X GET "http://localhost:3000/api/reports/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_date": "2024-01-01", "end_date": "2024-12-31"}'
```

### 5. Download Single Report

**Endpoint**: `GET /api/reports/download/{report_id}`

**Authentication**: Required (Bearer token)

**Path Parameters**:
- `report_id` (required): ID of the report to download

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
const viewReports = async (token, startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await axios.get(`/api/reports/view?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
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
```

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