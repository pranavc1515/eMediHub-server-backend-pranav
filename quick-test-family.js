const axios = require('axios');

// Test with simple user ID like "1"
const testData = {
    "userId": "1",
    "firstName": "John",
    "lastName": "Doe",
    "relationship": "Father",
    "dateOfBirth": "1970-05-15",
    "gender": "Male",
    "phone": "1234567890",
    "email": "john.doe@example.com",
    "bloodGroup": "O+",
    "emergencyContact": true
};

const testAddFamilyMember = async () => {
    try {
        console.log('🧪 Testing family member addition with userId: "1"');

        const response = await axios.post('http://localhost:3000/api/family/add', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Success! Family member added:');
        console.log('Response:', response.data);

        // Test getting family members
        console.log('\n🧪 Testing get family members...');
        const getResponse = await axios.get(`http://localhost:3000/api/family/user/1`);
        console.log('✅ Family members retrieved:');
        console.log('Count:', getResponse.data.count);
        console.log('Members:', getResponse.data.data.map(m => `${m.firstName} ${m.lastName} (${m.relationship})`));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
};

// Wait a moment for server to start, then run test
setTimeout(testAddFamilyMember, 3000); 