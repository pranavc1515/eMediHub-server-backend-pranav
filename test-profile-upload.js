const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_DOCTOR_ID = 1; // Change this to a valid doctor ID in your database

// Mock JWT token for testing - replace with actual token
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidHlwZSI6ImRvY3RvciIsImlhdCI6MTczNzM2MTIwMCwiZXhwIjoxNzM4MjI1MjAwfQ.example'; // Replace with actual token

async function testProfileUpload() {
    try {
        console.log('🧪 Testing Profile Photo Upload Functionality');
        console.log('='.repeat(50));

        // Test 1: Get current doctor profile
        console.log('\n📋 Test 1: Getting current doctor profile...');
        const profileResponse = await axios.get(`${BASE_URL}/api/doctors/profile?doctorId=${TEST_DOCTOR_ID}`);
        console.log('✅ Current profile data:', {
            id: profileResponse.data.data.id,
            fullName: profileResponse.data.data.fullName,
            profilePhoto: profileResponse.data.data.profilePhoto || 'No photo set'
        });

        // Test 2: Update personal details without photo
        console.log('\n📝 Test 2: Updating personal details without photo...');
        const updateData = {
            fullName: 'Dr. Updated Name',
            email: 'updated@example.com',
            gender: 'Male'
        };

        const updateResponse = await axios.put(
            `${BASE_URL}/api/doctors/personal-details/${TEST_DOCTOR_ID}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Details updated successfully:', updateResponse.data.message);

        // Test 3: Create a dummy image file for testing (if not exists)
        const testImagePath = path.join(__dirname, 'test-profile.png');
        if (!fs.existsSync(testImagePath)) {
            console.log('\n📸 Creating dummy test image...');
            // Create a simple PNG file (1x1 pixel)
            const dummyPng = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
                0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
                0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
                0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
            ]);
            fs.writeFileSync(testImagePath, dummyPng);
            console.log('✅ Test image created');
        }

        // Test 4: Upload profile photo
        console.log('\n📤 Test 3: Uploading profile photo...');
        const formData = new FormData();
        formData.append('fullName', 'Dr. Updated Name with Photo');
        formData.append('profilePhoto', fs.createReadStream(testImagePath), {
            filename: 'test-profile.png',
            contentType: 'image/png'
        });

        const uploadResponse = await axios.put(
            `${BASE_URL}/api/doctors/personal-details/${TEST_DOCTOR_ID}`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`,
                    ...formData.getHeaders()
                }
            }
        );
        console.log('✅ Profile photo uploaded successfully!');
        console.log('📷 New profile photo URL:', uploadResponse.data.data.profilePhoto);

        // Test 5: Verify doctors listing API returns profile photo
        console.log('\n📋 Test 4: Verifying doctors listing API...');
        const listResponse = await axios.get(`${BASE_URL}/api/doctors?page=1&limit=5`);
        const doctorWithPhoto = listResponse.data.data.find(doc => doc.id === TEST_DOCTOR_ID);

        if (doctorWithPhoto && doctorWithPhoto.profilePhoto) {
            console.log('✅ Profile photo is included in doctors listing API');
            console.log('📷 Profile photo URL:', doctorWithPhoto.profilePhoto);
        } else {
            console.log('❌ Profile photo not found in doctors listing API');
        }

        // Test 6: Test available doctors API
        console.log('\n📋 Test 5: Testing available doctors API...');
        const availableResponse = await axios.get(`${BASE_URL}/api/doctors/available?page=1&limit=5`);
        console.log('✅ Available doctors API response:', {
            count: availableResponse.data.count,
            hasData: availableResponse.data.data.length > 0
        });

        console.log('\n🎉 All tests completed successfully!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
        console.log('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method
        });
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testProfileUpload();
}

module.exports = { testProfileUpload }; 