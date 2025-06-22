/**
 * Test script for Family Member API
 * This script demonstrates how to use the family member management APIs
 * 
 * Run this script after starting your server to test the functionality
 * Make sure to update the BASE_URL and USER_ID constants below
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Update with your server URL
const USER_ID = '123e4567-e89b-12d3-a456-426614174000'; // Update with a real user ID

// Sample family data
const sampleFamilyMembers = [
    {
        userId: USER_ID,
        firstName: 'John',
        lastName: 'Doe',
        relationship: 'Father',
        dateOfBirth: '1970-05-15',
        gender: 'Male',
        phone: '1234567890',
        email: 'john.doe@example.com',
        bloodGroup: 'O+',
        medicalConditions: 'Hypertension',
        emergencyContact: true,
        notes: 'Primary emergency contact'
    },
    {
        userId: USER_ID,
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'Mother',
        dateOfBirth: '1975-08-22',
        gender: 'Female',
        phone: '0987654321',
        email: 'jane.doe@example.com',
        bloodGroup: 'A+',
        medicalConditions: 'Diabetes Type 2',
        emergencyContact: true,
        notes: 'Secondary emergency contact'
    },
    {
        userId: USER_ID,
        firstName: 'Mike',
        lastName: 'Doe',
        relationship: 'Brother',
        dateOfBirth: '1995-12-10',
        gender: 'Male',
        phone: '5555555555',
        email: 'mike.doe@example.com',
        bloodGroup: 'B+',
        emergencyContact: false,
        notes: 'Lives in another city'
    }
];

// Helper function to make API calls
const apiCall = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`❌ Error in ${method} ${endpoint}:`, error.response?.data || error.message);
        return null;
    }
};

// Test functions
const testAddFamilyMember = async (familyData) => {
    console.log('🧪 Testing: Add Family Member');
    const result = await apiCall('POST', '/api/family/add', familyData);
    if (result && result.success) {
        console.log('✅ Family member added successfully:', result.data.firstName, result.data.lastName);
        return result.data.id;
    }
    return null;
};

const testGetFamilyMembers = async (userId) => {
    console.log('🧪 Testing: Get Family Members');
    const result = await apiCall('GET', `/api/family/user/${userId}`);
    if (result && result.success) {
        console.log(`✅ Retrieved ${result.count} family members`);
        result.data.forEach(member => {
            console.log(`   - ${member.firstName} ${member.lastName} (${member.relationship})`);
        });
        return result.data;
    }
    return [];
};

const testGetFamilyMemberById = async (familyId) => {
    console.log('🧪 Testing: Get Family Member by ID');
    const result = await apiCall('GET', `/api/family/${familyId}`);
    if (result && result.success) {
        console.log('✅ Family member retrieved:', result.data.firstName, result.data.lastName);
        return result.data;
    }
    return null;
};

const testUpdateFamilyMember = async (familyId) => {
    console.log('🧪 Testing: Update Family Member');
    const updateData = {
        phone: '1111111111',
        notes: 'Updated via test script'
    };
    const result = await apiCall('PUT', `/api/family/${familyId}`, updateData);
    if (result && result.success) {
        console.log('✅ Family member updated successfully');
        return result.data;
    }
    return null;
};

const testGetEmergencyContacts = async (userId) => {
    console.log('🧪 Testing: Get Emergency Contacts');
    const result = await apiCall('GET', `/api/family/user/${userId}/emergency-contacts`);
    if (result && result.success) {
        console.log(`✅ Retrieved ${result.count} emergency contacts`);
        result.data.forEach(contact => {
            console.log(`   - ${contact.firstName} ${contact.lastName} (${contact.relationship})`);
        });
        return result.data;
    }
    return [];
};

const testSearchFamilyMembers = async (userId, query) => {
    console.log('🧪 Testing: Search Family Members');
    const result = await apiCall('GET', `/api/family/user/${userId}/search?query=${encodeURIComponent(query)}`);
    if (result && result.success) {
        console.log(`✅ Search for "${query}" returned ${result.count} results`);
        result.data.forEach(member => {
            console.log(`   - ${member.firstName} ${member.lastName} (${member.relationship})`);
        });
        return result.data;
    }
    return [];
};

const testGetFamilyStatistics = async (userId) => {
    console.log('🧪 Testing: Get Family Statistics');
    const result = await apiCall('GET', `/api/family/user/${userId}/statistics`);
    if (result && result.success) {
        console.log('✅ Family statistics retrieved:');
        console.log(`   - Total Members: ${result.data.totalMembers}`);
        console.log(`   - Emergency Contacts: ${result.data.emergencyContactsCount}`);
        console.log('   - Relationship Breakdown:');
        result.data.relationshipBreakdown.forEach(item => {
            console.log(`     * ${item.relationship}: ${item.count}`);
        });
        return result.data;
    }
    return null;
};

const testSoftDeleteFamilyMember = async (familyId) => {
    console.log('🧪 Testing: Soft Delete Family Member');
    const result = await apiCall('DELETE', `/api/family/${familyId}`);
    if (result && result.success) {
        console.log('✅ Family member soft deleted successfully');
        return true;
    }
    return false;
};

// Main test function
const runAllTests = async () => {
    console.log('🚀 Starting Family API Tests');
    console.log('='.repeat(50));

    try {
        // Test adding family members
        const addedMemberIds = [];
        for (const memberData of sampleFamilyMembers) {
            const memberId = await testAddFamilyMember(memberData);
            if (memberId) {
                addedMemberIds.push(memberId);
            }
            console.log(''); // Add spacing
        }

        if (addedMemberIds.length === 0) {
            console.log('❌ No family members were added. Stopping tests.');
            return;
        }

        // Test getting all family members
        await testGetFamilyMembers(USER_ID);
        console.log('');

        // Test getting specific family member
        if (addedMemberIds.length > 0) {
            await testGetFamilyMemberById(addedMemberIds[0]);
            console.log('');
        }

        // Test updating family member
        if (addedMemberIds.length > 0) {
            await testUpdateFamilyMember(addedMemberIds[0]);
            console.log('');
        }

        // Test getting emergency contacts
        await testGetEmergencyContacts(USER_ID);
        console.log('');

        // Test searching family members
        await testSearchFamilyMembers(USER_ID, 'John');
        console.log('');

        // Test getting family statistics
        await testGetFamilyStatistics(USER_ID);
        console.log('');

        // Test soft delete (optional - comment out if you want to keep test data)
        // if (addedMemberIds.length > 0) {
        //   await testSoftDeleteFamilyMember(addedMemberIds[addedMemberIds.length - 1]);
        //   console.log('');
        // }

        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }

    console.log('='.repeat(50));
    console.log('🏁 Family API Tests Completed');
};

// Run tests if this file is executed directly
if (require.main === module) {
    console.log('⚠️  Make sure your server is running before executing these tests!');
    console.log(`📍 Testing against: ${BASE_URL}`);
    console.log(`👤 Using User ID: ${USER_ID}`);
    console.log('');

    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    apiCall,
    sampleFamilyMembers,
    BASE_URL,
    USER_ID
}; 