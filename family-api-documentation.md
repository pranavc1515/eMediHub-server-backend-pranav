# Family Member Management API Documentation 👨‍👩‍👧‍👦

## Overview
The Family Member Management system allows users to add, manage, and maintain information about their family members in the eMediHub platform. This is useful for medical history tracking, emergency contacts, and family-based healthcare management.

## Table Schema

### Family Members Table (`family_members`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Primary key, auto-generated |
| `userId` | UUID | Yes | Reference to the user who owns this family member |
| `firstName` | String(50) | Yes | First name of family member |
| `lastName` | String(50) | Yes | Last name of family member |
| `relationship` | ENUM | Yes | Relationship type (Father, Mother, Spouse, Brother, Sister, Son, Daughter, Other) |
| `dateOfBirth` | DATE | No | Date of birth |
| `gender` | ENUM | No | Gender (Male, Female, Other) |
| `phone` | String(15) | No | Phone number |
| `email` | String | No | Email address |
| `bloodGroup` | ENUM | No | Blood group (A+, A-, B+, B-, AB+, AB-, O+, O-) |
| `medicalConditions` | TEXT | No | Medical conditions or allergies |
| `emergencyContact` | Boolean | No | Whether this person is an emergency contact (default: false) |
| `isActive` | Boolean | No | Record status (default: true) |
| `profileImage` | String | No | URL to profile image |
| `notes` | TEXT | No | Additional notes |
| `created_at` | DateTime | Auto | Record creation timestamp |
| `updated_at` | DateTime | Auto | Record update timestamp |

## API Endpoints

### Base URL: `/api/family`

---

### 1. Add Family Member
**POST** `/api/family/add`

Add a new family member to the system.

**Request Body:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "firstName": "John",
  "lastName": "Doe",
  "relationship": "Father",
  "dateOfBirth": "1970-05-15",
  "gender": "Male",
  "phone": "1234567890",
  "email": "john.doe@example.com",
  "bloodGroup": "O+",
  "medicalConditions": "Hypertension",
  "emergencyContact": true,
  "notes": "Primary emergency contact"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Family member added successfully",
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "relationship": "Father",
    "dateOfBirth": "1970-05-15",
    "gender": "Male",
    "phone": "1234567890",
    "email": "john.doe@example.com",
    "bloodGroup": "O+",
    "medicalConditions": "Hypertension",
    "emergencyContact": true,
    "isActive": true,
    "profileImage": null,
    "notes": "Primary emergency contact"
  }
}
```

---

### 2. Get All Family Members for User
**GET** `/api/family/user/{userId}`

Retrieve all family members for a specific user.

**Query Parameters:**
- `relationship` (optional): Filter by relationship type
- `isActive` (optional): Filter by active status (true/false)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family members retrieved successfully",
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "John",
      "lastName": "Doe",
      "relationship": "Father",
      "dateOfBirth": "1970-05-15",
      "gender": "Male",
      "phone": "1234567890",
      "email": "john.doe@example.com",
      "bloodGroup": "O+",
      "medicalConditions": "Hypertension",
      "emergencyContact": true,
      "isActive": true,
      "profileImage": null,
      "notes": "Primary emergency contact"
    }
  ],
  "count": 1
}
```

---

### 3. Get Family Member by ID
**GET** `/api/family/{id}`

Retrieve a specific family member by their ID.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member retrieved successfully",
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "relationship": "Father",
    "dateOfBirth": "1970-05-15",
    "gender": "Male",
    "phone": "1234567890",
    "email": "john.doe@example.com",
    "bloodGroup": "O+",
    "medicalConditions": "Hypertension",
    "emergencyContact": true,
    "isActive": true,
    "profileImage": null,
    "notes": "Primary emergency contact"
  }
}
```

---

### 4. Update Family Member
**PUT** `/api/family/{id}`

Update an existing family member's information.

**Request Body:**
```json
{
  "firstName": "Jonathan",
  "phone": "0987654321",
  "email": "jonathan.doe@example.com",
  "notes": "Updated contact information"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member updated successfully",
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "relationship": "Father",
    "dateOfBirth": "1970-05-15",
    "gender": "Male",
    "phone": "0987654321",
    "email": "jonathan.doe@example.com",
    "bloodGroup": "O+",
    "medicalConditions": "Hypertension",
    "emergencyContact": true,
    "isActive": true,
    "profileImage": null,
    "notes": "Updated contact information"
  }
}
```

---

### 5. Delete Family Member (Soft Delete)
**DELETE** `/api/family/{id}`

Soft delete a family member (sets isActive to false).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member deleted successfully"
}
```

---

### 6. Permanently Delete Family Member
**DELETE** `/api/family/{id}/permanent`

Permanently remove a family member from the database.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family member permanently deleted"
}
```

---

### 7. Get Family Members by Relationship
**GET** `/api/family/user/{userId}/relationship/{relationship}`

Get all family members of a specific relationship type for a user.

**Example:** `/api/family/user/123e4567-e89b-12d3-a456-426614174000/relationship/Father`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Father family members retrieved successfully",
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "John",
      "lastName": "Doe",
      "relationship": "Father",
      "dateOfBirth": "1970-05-15",
      "gender": "Male",
      "phone": "1234567890",
      "email": "john.doe@example.com",
      "bloodGroup": "O+",
      "medicalConditions": "Hypertension",
      "emergencyContact": true,
      "isActive": true,
      "profileImage": null,
      "notes": "Primary emergency contact"
    }
  ],
  "count": 1
}
```

---

### 8. Get Emergency Contacts
**GET** `/api/family/user/{userId}/emergency-contacts`

Retrieve all family members marked as emergency contacts for a user.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contacts retrieved successfully",
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "John",
      "lastName": "Doe",
      "relationship": "Father",
      "phone": "1234567890",
      "email": "john.doe@example.com",
      "emergencyContact": true,
      "isActive": true
    }
  ],
  "count": 1
}
```

---

### 9. Search Family Members
**GET** `/api/family/user/{userId}/search?query={searchTerm}`

Search family members by name, relationship, phone, or email.

**Query Parameter:**
- `query` (required): Search term

**Example:** `/api/family/user/123e4567-e89b-12d3-a456-426614174000/search?query=John`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "John",
      "lastName": "Doe",
      "relationship": "Father",
      "phone": "1234567890",
      "email": "john.doe@example.com",
      "emergencyContact": true,
      "isActive": true
    }
  ],
  "count": 1
}
```

---

### 10. Get Family Statistics
**GET** `/api/family/user/{userId}/statistics`

Get statistical information about a user's family members.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Family statistics retrieved successfully",
  "data": {
    "totalMembers": 4,
    "emergencyContactsCount": 2,
    "relationshipBreakdown": [
      {
        "relationship": "Father",
        "count": 1
      },
      {
        "relationship": "Mother",
        "count": 1
      },
      {
        "relationship": "Brother",
        "count": 1
      },
      {
        "relationship": "Sister",
        "count": 1
      }
    ]
  }
}
```

---

## Relationship Types

The following relationship types are supported:
- `Father`
- `Mother`
- `Spouse`
- `Brother`
- `Sister`
- `Son`
- `Daughter`
- `Other`

## Blood Group Types

The following blood group types are supported:
- `A+`, `A-`
- `B+`, `B-`
- `AB+`, `AB-`
- `O+`, `O-`

## Gender Types

The following gender types are supported:
- `Male`
- `Female`
- `Other`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "First name, last name, and relationship are required",
  "error": "Validation error details"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Family member not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to add family member",
  "error": "Detailed error message"
}
```

## Frontend Integration Examples

### JavaScript/React Examples

#### Add Family Member
```javascript
const addFamilyMember = async (familyData) => {
  try {
    const response = await fetch('/api/family/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(familyData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Family member added:', result.data);
    }
  } catch (error) {
    console.error('Error adding family member:', error);
  }
};
```

#### Get Family Members
```javascript
const getFamilyMembers = async (userId) => {
  try {
    const response = await fetch(`/api/family/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching family members:', error);
  }
};
```

#### Search Family Members
```javascript
const searchFamilyMembers = async (userId, query) => {
  try {
    const response = await fetch(`/api/family/user/${userId}/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error searching family members:', error);
  }
};
```

## Usage Notes

1. **User ID**: Always provide a valid `userId` when adding family members
2. **Emergency Contacts**: Mark important family members as emergency contacts for quick access
3. **Soft Delete**: By default, deletion is soft (sets `isActive` to false) to maintain data integrity
4. **Search**: The search functionality looks across multiple fields for flexibility
5. **Validation**: All required fields must be provided, and enum values must match exactly
6. **Medical Information**: Store relevant medical conditions and allergies for healthcare purposes

## Database Migration

When setting up the database, ensure the family_members table is created with proper indexes:

```sql
-- Indexes for better performance
CREATE INDEX idx_family_user_id ON family_members(userId);
CREATE INDEX idx_family_relationship ON family_members(relationship);
CREATE INDEX idx_family_user_relationship ON family_members(userId, relationship);
``` 