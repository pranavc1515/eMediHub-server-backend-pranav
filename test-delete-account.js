/**
 * Test Script for Doctor Delete Account API
 * 
 * This script demonstrates how to use the delete account API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/doctors';

// Example JWT token (replace with actual token)
const DOCTOR_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

async function testDeleteAccountAPIs() {
    console.log('🧪 Testing Doctor Delete Account APIs\n');

    try {
        // Test 1: Delete account using doctor ID parameter
        console.log('Test 1: Delete account with doctor ID parameter');
        console.log('Endpoint: DELETE /api/doctors/delete-account/:doctorId');
        console.log('Example: DELETE /api/doctors/delete-account/123\n');

        const testDoctorId = 123;

        try {
            const response1 = await axios.delete(`${BASE_URL}/delete-account/${testDoctorId}`, {
                headers: {
                    'Authorization': DOCTOR_TOKEN,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Success Response:');
            console.log(JSON.stringify(response1.data, null, 2));
        } catch (error) {
            console.log('❌ Error Response:');
            console.log(`Status: ${error.response?.status}`);
            console.log(JSON.stringify(error.response?.data, null, 2));
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Delete own account (self-deletion)
        console.log('Test 2: Delete own account (self-deletion)');
        console.log('Endpoint: DELETE /api/doctors/delete-account');
        console.log('Uses authenticated user\'s ID from JWT token\n');

        try {
            const response2 = await axios.delete(`${BASE_URL}/delete-account`, {
                headers: {
                    'Authorization': DOCTOR_TOKEN,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Success Response:');
            console.log(JSON.stringify(response2.data, null, 2));
        } catch (error) {
            console.log('❌ Error Response:');
            console.log(`Status: ${error.response?.status}`);
            console.log(JSON.stringify(error.response?.data, null, 2));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Example usage with curl commands
console.log('📋 Curl Command Examples:\n');

console.log('1. Delete account with doctor ID:');
console.log(`curl -X DELETE "${BASE_URL}/delete-account/123" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"\n`);

console.log('2. Delete own account (self-deletion):');
console.log(`curl -X DELETE "${BASE_URL}/delete-account" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"\n`);

console.log('🔧 Expected Response Format:');
console.log(`{
  "success": true,
  "message": "Doctor account deleted successfully",
  "data": {
    "deletedAt": "2025-01-20T10:30:00.000Z",
    "doctorId": 123
  }
}\n`);

console.log('⚠️  Possible Error Responses:');
console.log('- 400: Active consultations or patients in queue');
console.log('- 401: Authentication required');
console.log('- 403: Can only delete own account');
console.log('- 404: Doctor not found');
console.log('- 500: Server error\n');

// Uncomment the line below to run the actual tests
// testDeleteAccountAPIs(); 