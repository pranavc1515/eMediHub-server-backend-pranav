# Family API Integration Documentation

## Overview

This document describes the integration of the 3rd party Family API into the eMediHub backend server. The integration acts as a proxy, allowing the frontend to access all Family API functionality through the existing eMediHub backend infrastructure.

## Base Configuration

- **3rd Party API Base URL**: `http://43.204.91.138:3001` (example)
- **Local Proxy Endpoints**: `http://localhost:3000/api/family/*`
- **Environment Variable**: `FAMILY_API_BASE_URL` (optional, defaults to the above URL)

## Available Endpoints

### 1. View Family Tree

**Endpoint**: `GET /api/family/view-family-tree`

**Authentication**: Required (Bearer token)

**Description**: Retrieves the complete family tree structure for the authenticated user, including all family members and their relationships.

**Example cURL**:
```bash
curl -X GET "http://localhost:3000/api/family/view-family-tree" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response Example**:
```json
{
    "status": true,
    "status_code": 200,
    "message": "Family tree retrieved successfully",
    "data": {
        "user": {
            "id": 125,
            "totalRelativMembers": 4
        },
        "familyTree": [
            {
                "id": 128,
                "name": "mybrother",
                "relation_type": "Brother",
                "phone": "+918585858522",
                "email": "brother55@gmail.com",
                "age": 50,
                "dob": "1998-01-01T00:00:00.000Z",
                "gender": "Male",
                "marital_status": "Married",
                "profession": null,
                "image": null,
                "relatives": [
                    {
                        "id": 129,
                        "name": "mysister",
                        "relation_type": "Sister",
                        "phone": "+918569856985",
                        "email": "brother558@gmail.com",
                        "age": 21,
                        "dob": "1998-01-01T00:00:00.000Z",
                        "gender": "Male",
                        "marital_status": "Married",
                        "profession": null,
                        "image": null,
                        "relatives": []
                    }
                ]
            }
        ]
    }
}
```

### 2. Add Family Connection

**Endpoint**: `POST /api/family/add-family-connection`

**Authentication**: Required (Bearer token)

**Content-Type**: `application/json`

**Required Parameters**:
- `nodeUserId` (integer): ID of the user to connect the family member to
- `relationName` (string): Relationship type (e.g., "Father", "Mother", "Brother", "Sister", "Spouse")
- `name` (string): Name of the family member

**Optional Parameters**:
- `phone` (string): Phone number
- `email` (string): Email address
- `age` (string): Age (e.g., "25-year")
- `dob` (string): Date of birth (YYYY-MM-DD format)
- `gender` (string): Gender (male/female/other)
- `marital_status` (string): Marital status
- `profession` (string): Profession/occupation
- `height` (string): Height (e.g., "160-cm")
- `weight` (string): Weight (e.g., "150-kg")
- `diet` (string): Diet preference ("Vegetarian"/"Non-Vegetarian")
- `image` (string): Base64 encoded image data

**Example cURL**:
```bash
curl -X POST "http://localhost:3000/api/family/add-family-connection" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nodeUserId": 141,
    "relationName": "Spouse",
    "name": "rohan sohan",
    "phone": "+919999966667",
    "email": "",
    "age": "25-year",
    "dob": "",
    "gender": "male",
    "marital_status": "Married",
    "profession": "myprofession",
    "height": "160-cm",
    "weight": "150-kg",
    "diet": "Non-Vegetarian"
  }'
```

**Response Example**:
```json
{
    "status": true,
    "status_code": 201,
    "message": "Family member added successfully.",
    "familyUserId": 113
}
```

### 3. Update Family Details

**Endpoint**: `POST /api/family/update-family-details/{familyMemberId}`

**Authentication**: Required (Bearer token)

**Content-Type**: `application/json`

**Path Parameters**:
- `familyMemberId` (required): ID of the family member to update

**Request Body Parameters** (all optional):
- `name` (string): Name of the family member
- `relationName` (string): Relationship type
- `phone` (string): Phone number
- `email` (string): Email address
- `age` (string): Age
- `dob` (string): Date of birth
- `gender` (string): Gender
- `marital_status` (string): Marital status
- `profession` (string): Profession/occupation
- `height` (string): Height
- `weight` (string): Weight
- `diet` (string): Diet preference
- `image` (string): Base64 encoded image data

**Example cURL**:
```bash
curl -X POST "http://localhost:3000/api/family/update-family-details/134" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "myname",
    "relationName": "sister",
    "phone": "+911231231231",
    "email": "email@email.email",
    "age": "45year",
    "dob": "1998-01-01",
    "gender": "male",
    "marital_status": "",
    "profession": "Senior Developers",
    "height": "20 ft",
    "weight": "500 pound",
    "diet": "",
    "image": ""
  }'
```

**Response Example**:
```json
{
    "status": true,
    "status_code": 200,
    "message": "Family member details updated successfully."
}
```

### 4. Remove Family Member

**Endpoint**: `DELETE /api/family/remove-member/{relatedUserId}`

**Authentication**: Required (Bearer token)

**Content-Type**: `application/json`

**Path Parameters**:
- `relatedUserId` (required): ID of the family member to remove

**Optional Request Body**:
- `userId` (integer): ID of the user relative to which you want to delete a member

**Example cURL**:
```bash
curl -X DELETE "http://localhost:3000/api/family/remove-member/117" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 103
  }'
```

**Response Example**:
```json
{
    "status": true,
    "status_code": 200,
    "message": "Family member removed successfully."
}
```

## Frontend Integration

The frontend can now call these endpoints directly using the existing authentication system:

### JavaScript/Axios Examples

```javascript
// View family tree
const viewFamilyTree = async (token) => {
  try {
    const response = await axios.get('/api/family/view-family-tree', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Add family member
const addFamilyMember = async (familyData, token) => {
  try {
    const response = await axios.post('/api/family/add-family-connection', familyData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Update family member
const updateFamilyMember = async (familyMemberId, updateData, token) => {
  try {
    const response = await axios.post(`/api/family/update-family-details/${familyMemberId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Remove family member
const removeFamilyMember = async (relatedUserId, token, userId = null) => {
  try {
    const requestBody = userId ? { userId } : {};
    const response = await axios.delete(`/api/family/remove-member/${relatedUserId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: requestBody
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FamilyTreeComponent = () => {
  const [familyTree, setFamilyTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFamilyTree();
  }, []);

  const loadFamilyTree = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Or however you store your token
      const response = await axios.get('/api/family/view-family-tree', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFamilyTree(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load family tree');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/family/add-family-connection', memberData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Reload family tree after adding
      loadFamilyTree();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add family member');
    }
  };

  if (loading) return <div>Loading family tree...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Family Tree</h2>
      {familyTree && (
        <div>
          <p>Total Family Members: {familyTree.user.totalRelativMembers}</p>
          {/* Render family tree data */}
          {familyTree.familyTree.map(member => (
            <div key={member.id}>
              <h3>{member.name}</h3>
              <p>Relation: {member.relation_type}</p>
              <p>Phone: {member.phone}</p>
              <p>Email: {member.email}</p>
              {/* Add more member details as needed */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyTreeComponent;
```

## Testing

Create a test file to verify the integration:

```javascript
// test-family-api.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const FAMILY_API_BASE_URL = 'http://43.204.91.138:3001';

// Test token (replace with a valid token)
const TEST_TOKEN = 'your-test-token-here';

console.log('🧪 Testing Family API Integration...\n');

async function testFamilyAPIConnection() {
    try {
        console.log('🔗 Testing direct connection to Family API...');
        const response = await axios.get(`${FAMILY_API_BASE_URL}/health`, {
            timeout: 5000
        });
        console.log('✅ Direct connection successful');
        return true;
    } catch (error) {
        console.log('❌ Direct connection failed:', error.message);
        return false;
    }
}

async function testViewFamilyTree() {
    try {
        console.log('🌳 Testing view family tree...');
        const response = await axios.get(`${BASE_URL}/api/family/view-family-tree`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        console.log('✅ Family tree retrieved successfully');
        console.log('📊 Family members count:', response.data.data?.user?.totalRelativMembers || 0);
        return true;
    } catch (error) {
        console.log('❌ Family tree test failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testAddFamilyMember() {
    try {
        console.log('👥 Testing add family member...');
        const memberData = {
            nodeUserId: 1,
            relationName: "Brother",
            name: "Test Brother",
            phone: "+1234567890",
            email: "test.brother@example.com",
            age: "30-year",
            gender: "male",
            marital_status: "Single",
            profession: "Engineer"
        };

        const response = await axios.post(`${BASE_URL}/api/family/add-family-connection`, memberData, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Family member added successfully');
        console.log('🆔 New family member ID:', response.data.familyUserId);
        return response.data.familyUserId;
    } catch (error) {
        console.log('❌ Add family member test failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function runTests() {
    console.log('🚀 Starting Family API integration tests...\n');

    const results = {
        connection: await testFamilyAPIConnection(),
        viewTree: await testViewFamilyTree(),
        addMember: await testAddFamilyMember()
    };

    console.log('\n📋 Test Results Summary:');
    console.log('✅ Direct API Connection:', results.connection ? 'PASS' : 'FAIL');
    console.log('✅ View Family Tree:', results.viewTree ? 'PASS' : 'FAIL');
    console.log('✅ Add Family Member:', results.addMember ? 'PASS' : 'FAIL');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Family API integration is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the configuration and try again.');
    }
}

runTests();
```

## Environment Variables

Add the following to your `.env` file if you need to override the default API URL:

```env
# Family API Configuration
FAMILY_API_BASE_URL=http://43.204.91.138:3001

# Your existing eMediHub configuration
# PORT=3000
# JWT_SECRET=your_jwt_secret_here
# JWT_EXPIRES_IN=24h
# NODE_ENV=development
```

## Error Handling

The Family API proxy includes comprehensive error handling:

### Common Error Responses

**401 Unauthorized**:
```json
{
    "status": false,
    "status_code": 401,
    "message": "Authentication token required"
}
```

**400 Bad Request**:
```json
{
    "status": false,
    "status_code": 400,
    "message": "Required fields: nodeUserId, relationName, name"
}
```

**404 Not Found**:
```json
{
    "status": false,
    "status_code": 404,
    "message": "Family member not found"
}
```

**500 Internal Server Error**:
```json
{
    "status": false,
    "message": "Internal server error while fetching family tree",
    "error": "Connection timeout"
}
```

## API Rate Limiting

The proxy respects the 3rd party API's rate limiting. If you encounter rate limiting issues, implement appropriate retry logic in your frontend code.

## Security Considerations

1. **Authentication**: All endpoints require valid Bearer tokens
2. **Data Validation**: Input validation is performed on required fields
3. **Error Sanitization**: Sensitive error details are not exposed to the client
4. **CORS**: Properly configured for cross-origin requests

## Monitoring and Logging

All API calls are logged with the following information:
- Request method and endpoint
- Response status codes
- Error messages (when applicable)
- Request timestamps

Monitor the console output for any integration issues.

## Support

For issues with the Family API integration:

1. Check the console logs for detailed error messages
2. Verify your authentication token is valid
3. Ensure the 3rd party Family API is accessible
4. Check network connectivity and timeouts

## Version History

- **v1.0.0**: Initial Family API integration
  - View family tree functionality
  - Add family member functionality
  - Update family member details
  - Remove family member functionality
  - Complete proxy implementation with error handling 