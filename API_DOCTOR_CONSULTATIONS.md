# Doctor Consultations API

## Overview

This API endpoint allows you to retrieve all consultations for a specific doctor using the doctor's ID as a query parameter. The endpoint supports advanced filtering, sorting, and pagination features.

## Endpoint Details

### Get Doctor Consultations

**GET** `/api/consultation/doctor`

Retrieves all consultations for a specific doctor with comprehensive filtering and pagination options.

## Query Parameters

### Required Parameters

| Parameter  | Type    | Description                               | Example |
| ---------- | ------- | ----------------------------------------- | ------- |
| `doctorId` | integer | **Required**. The unique ID of the doctor | `1`     |

### Optional Parameters

| Parameter          | Type    | Default     | Description                      | Valid Values                                                     | Example         |
| ------------------ | ------- | ----------- | -------------------------------- | ---------------------------------------------------------------- | --------------- |
| `page`             | integer | `1`         | Page number for pagination       | Min: 1                                                           | `1`             |
| `limit`            | integer | `10`        | Number of consultations per page | Min: 1, Max: 100                                                 | `10`            |
| `status`           | string  | -           | Filter by consultation status    | `pending`, `ongoing`, `completed`, `cancelled`                   | `completed`     |
| `consultationType` | string  | -           | Filter by consultation type      | `video`, `in-person`                                             | `video`         |
| `sortBy`           | string  | `createdAt` | Field to sort by                 | `createdAt`, `updatedAt`, `scheduledDate`, `startTime`, `status` | `scheduledDate` |
| `sortOrder`        | string  | `DESC`      | Sort order                       | `ASC`, `DESC`                                                    | `DESC`          |

## Request Examples

### Basic Request

```http
GET /api/consultation/doctor?doctorId=1
```

### Advanced Request with Filters

```http
GET /api/consultation/doctor?doctorId=1&status=completed&consultationType=video&page=1&limit=5&sortBy=scheduledDate&sortOrder=DESC
```

### cURL Examples

#### Basic Request

```bash
curl -X GET "http://localhost:3000/api/consultation/doctor?doctorId=1" \
  -H "Content-Type: application/json"
```

#### Advanced Request

```bash
curl -X GET "http://localhost:3000/api/consultation/doctor?doctorId=1&status=completed&consultationType=video&page=1&limit=5" \
  -H "Content-Type: application/json"
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Consultations retrieved successfully",
  "data": {
    "consultations": [
      {
        "id": 1,
        "patientId": 123,
        "doctorId": 456,
        "scheduledDate": "2024-01-15",
        "startTime": "10:30:00",
        "endTime": "11:00:00",
        "status": "completed",
        "consultationType": "video",
        "roomName": "room_123456",
        "notes": "Patient showed improvement",
        "symptoms": "Fever, headache",
        "diagnosis": "Viral fever",
        "prescription": "Paracetamol 500mg twice daily",
        "actualStartTime": "2024-01-15T10:35:00.000Z",
        "actualEndTime": "2024-01-15T11:05:00.000Z",
        "createdAt": "2024-01-15T09:00:00.000Z",
        "updatedAt": "2024-01-15T11:05:00.000Z",
        "patient": {
          "id": 123,
          "fullName": "John Doe",
          "phoneNumber": "+1234567890",
          "email": "john.doe@email.com",
          "gender": "Male",
          "age": 30,
          "details": {
            "address": "123 Main St, City",
            "emergencyContact": "+9876543210",
            "bloodGroup": "O+"
          }
        },
        "doctor": {
          "id": 456,
          "fullName": "Dr. Smith",
          "email": "dr.smith@hospital.com",
          "phoneNumber": "+1234567891",
          "profilePhoto": "https://example.com/photo.jpg"
        }
      }
    ],
    "pagination": {
      "totalConsultations": 25,
      "totalPages": 3,
      "currentPage": 1,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "doctor": {
      "id": 456,
      "fullName": "Dr. Smith",
      "email": "dr.smith@hospital.com",
      "phoneNumber": "+1234567891"
    },
    "filters": {
      "status": "all",
      "consultationType": "all",
      "sortBy": "createdAt",
      "sortOrder": "DESC"
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Doctor ID

```json
{
  "success": false,
  "message": "Doctor ID is required as a query parameter"
}
```

#### 400 Bad Request - Invalid Doctor ID

```json
{
  "success": false,
  "message": "Doctor ID must be a valid number"
}
```

#### 404 Not Found - Doctor Not Found

```json
{
  "success": false,
  "message": "Doctor not found"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error while fetching doctor consultations",
  "error": "Detailed error message (only in development)"
}
```

## Response Fields Description

### Consultation Object

| Field              | Type              | Description                            |
| ------------------ | ----------------- | -------------------------------------- |
| `id`               | integer           | Unique consultation ID                 |
| `patientId`        | integer           | ID of the patient                      |
| `doctorId`         | integer           | ID of the doctor                       |
| `scheduledDate`    | string (date)     | Scheduled date for consultation        |
| `startTime`        | string (time)     | Scheduled start time                   |
| `endTime`          | string (time)     | Scheduled end time                     |
| `status`           | string            | Current status of consultation         |
| `consultationType` | string            | Type of consultation (video/in-person) |
| `roomName`         | string            | Video room name (if applicable)        |
| `notes`            | string            | Doctor's notes about the consultation  |
| `symptoms`         | string            | Patient's reported symptoms            |
| `diagnosis`        | string            | Doctor's diagnosis                     |
| `prescription`     | string            | Prescribed medications/treatment       |
| `actualStartTime`  | string (datetime) | Actual start time of consultation      |
| `actualEndTime`    | string (datetime) | Actual end time of consultation        |
| `createdAt`        | string (datetime) | Record creation timestamp              |
| `updatedAt`        | string (datetime) | Record last update timestamp           |

### Patient Object

| Field         | Type    | Description                |
| ------------- | ------- | -------------------------- |
| `id`          | integer | Patient's unique ID        |
| `fullName`    | string  | Patient's full name        |
| `phoneNumber` | string  | Patient's phone number     |
| `email`       | string  | Patient's email address    |
| `gender`      | string  | Patient's gender           |
| `age`         | integer | Patient's age              |
| `details`     | object  | Additional patient details |

### Pagination Object

| Field                | Type    | Description                      |
| -------------------- | ------- | -------------------------------- |
| `totalConsultations` | integer | Total number of consultations    |
| `totalPages`         | integer | Total number of pages            |
| `currentPage`        | integer | Current page number              |
| `limit`              | integer | Number of items per page         |
| `hasNextPage`        | boolean | Whether there is a next page     |
| `hasPrevPage`        | boolean | Whether there is a previous page |

## Use Cases

### 1. Get All Consultations for a Doctor

```http
GET /api/consultation/doctor?doctorId=1
```

### 2. Get Only Completed Consultations

```http
GET /api/consultation/doctor?doctorId=1&status=completed
```

### 3. Get Video Consultations Only

```http
GET /api/consultation/doctor?doctorId=1&consultationType=video
```

### 4. Get Recent Consultations (Latest First)

```http
GET /api/consultation/doctor?doctorId=1&sortBy=createdAt&sortOrder=DESC
```

### 5. Get Consultations by Scheduled Date

```http
GET /api/consultation/doctor?doctorId=1&sortBy=scheduledDate&sortOrder=ASC
```

### 6. Paginated Results

```http
GET /api/consultation/doctor?doctorId=1&page=2&limit=5
```

### 7. Complex Filter (Completed Video Consultations, Latest First)

```http
GET /api/consultation/doctor?doctorId=1&status=completed&consultationType=video&sortBy=scheduledDate&sortOrder=DESC&page=1&limit=10
```

## JavaScript/Frontend Integration Examples

### Using Fetch API

```javascript
async function getDoctorConsultations(doctorId, options = {}) {
  const params = new URLSearchParams({
    doctorId,
    ...options,
  });

  try {
    const response = await fetch(`/api/consultation/doctor?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error fetching doctor consultations:", error);
    throw error;
  }
}

// Usage examples
const consultations = await getDoctorConsultations(1);
const completedConsultations = await getDoctorConsultations(1, { status: "completed" });
const recentConsultations = await getDoctorConsultations(1, {
  sortBy: "createdAt",
  sortOrder: "DESC",
  limit: 5,
});
```

### Using Axios

```javascript
import axios from "axios";

const getDoctorConsultations = async (doctorId, options = {}) => {
  try {
    const response = await axios.get("/api/consultation/doctor", {
      params: {
        doctorId,
        ...options,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error:", error.response?.data?.message || error.message);
    throw error;
  }
};
```

## Error Handling Best Practices

1. **Always validate doctor ID**: Ensure the doctor ID is provided and is a valid integer
2. **Handle 404 errors**: Check if the doctor exists before querying consultations
3. **Implement pagination**: Use appropriate page size to avoid performance issues
4. **Validate query parameters**: Ensure status and consultationType values are valid
5. **Handle network errors**: Implement proper error handling for network issues

## Performance Considerations

- Use pagination to limit the number of records returned
- Consider using appropriate indexes on `doctorId`, `status`, and `scheduledDate` fields
- Cache frequently accessed doctor consultation data when appropriate
- Use appropriate `limit` values (recommended: 10-50 items per page)

## Security Considerations

- Validate doctor ID to prevent SQL injection
- Implement proper authentication and authorization
- Ensure doctors can only access their own consultation data
- Sanitize input parameters to prevent XSS attacks

## Rate Limiting

Consider implementing rate limiting to prevent abuse:

- Recommended: 100 requests per minute per IP
- For authenticated users: 1000 requests per minute per user
