/**
 * Comprehensive Test Script for Updated Family APIs
 * Tests all family member management endpoints with validation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '1';

// Sample test data
const sampleFamilyMember = {
    userId: TEST_USER_ID,
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
};

const bulkFamilyMembers = [
    {
        firstName: 'Jane',
        lastName: 'Doe',
        relationship: 'Mother',
        dateOfBirth: '1975-08-22',
        gender: 'Female',
        phone: '0987654321',
        email: 'jane.doe@example.com',
        bloodGroup: 'A+',
        emergencyContact: true
    },
    {
        firstName: 'Mike',
        lastName: 'Doe',
        relationship: 'Son',
        dateOfBirth: '2000-12-10',
        gender: 'Male',
        phone: '5555555555',
        email: 'mike.doe@example.com',
        bloodGroup: 'B+'
    }
];

// Helper function for API calls
const apiCall = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: { 'Content-Type': 'application/json' }
        };
        if (data) config.data = data;

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
};

// Test functions
const testGetFamilyOptions = async () => {
    console.log('🧪 Testing: Get Family Options');
    const result = await apiCall('GET', '/api/family/options');
    if (result.success) {
        console.log('✅ Family options retrieved successfully');
        console.log('   - Relationships:', result.data.data.relationships.join(', '));
        console.log('   - Blood Groups:', result.data.data.bloodGroups.join(', '));
        console.log('   - Genders:', result.data.data.genders.join(', '));
    } else {
        console.log('❌ Failed to get family options:', result.error);
    }
    return result;
};

const testAddFamilyMember = async () => {
    console.log('🧪 Testing: Add Single Family Member');
    const result = await apiCall('POST', '/api/family/add', sampleFamilyMember);
    if (result.success) {
        console.log('✅ Family member added successfully');
        console.log(`   - ${result.data.data.firstName} ${result.data.data.lastName} (${result.data.data.relationship})`);
        return result.data.data.id;
    } else {
        console.log('❌ Failed to add family member:', result.error);
    }
    return null;
};

const testBulkAddFamilyMembers = async () => {
    console.log('🧪 Testing: Bulk Add Family Members');
    const result = await apiCall('POST', '/api/family/bulk-add', {
        userId: TEST_USER_ID,
        familyMembers: bulkFamilyMembers
    });
    if (result.success) {
        console.log('✅ Bulk family members added successfully');
        console.log(`   - Added ${result.data.count} members`);
        result.data.data.forEach(member => {
            console.log(`     * ${member.firstName} ${member.lastName} (${member.relationship})`);
        });
    } else {
        console.log('❌ Failed to bulk add family members:', result.error);
    }
    return result;
};

const testGetFamilyMembers = async () => {
    console.log('🧪 Testing: Get All Family Members');
    const result = await apiCall('GET', `/api/family/user/${TEST_USER_ID}`);
    if (result.success) {
        console.log(`✅ Retrieved ${result.data.count} family members`);
        result.data.data.forEach(member => {
            console.log(`   - ${member.firstName} ${member.lastName} (${member.relationship})`);
        });
        return result.data.data;
    } else {
        console.log('❌ Failed to get family members:', result.error);
    }
    return [];
};

const testGetFamilyMemberById = async (familyId) => {
    console.log('🧪 Testing: Get Family Member by ID');
    const result = await apiCall('GET', `/api/family/${familyId}`);
    if (result.success) {
        console.log('✅ Family member retrieved by ID');
        const member = result.data.data;
        console.log(`   - ${member.firstName} ${member.lastName} (${member.relationship})`);
    } else {
        console.log('❌ Failed to get family member by ID:', result.error);
    }
    return result;
};

const testUpdateFamilyMember = async (familyId) => {
    console.log('🧪 Testing: Update Family Member');
    const updateData = {
        phone: '1111111111',
        notes: 'Updated via comprehensive test script',
        emergencyContact: false
    };
    const result = await apiCall('PUT', `/api/family/${familyId}`, updateData);
    if (result.success) {
        console.log('✅ Family member updated successfully');
    } else {
        console.log('❌ Failed to update family member:', result.error);
    }
    return result;
};

const testGetFamilyMembersByRelationship = async (relationship) => {
    console.log(`🧪 Testing: Get Family Members by Relationship (${relationship})`);
    const result = await apiCall('GET', `/api/family/user/${TEST_USER_ID}/relationship/${relationship}`);
    if (result.success) {
        console.log(`✅ Retrieved ${result.data.count} ${relationship} family members`);
        result.data.data.forEach(member => {
            console.log(`   - ${member.firstName} ${member.lastName}`);
        });
    } else {
        console.log(`❌ Failed to get ${relationship} family members:`, result.error);
    }
    return result;
};

const testGetEmergencyContacts = async () => {
    console.log('🧪 Testing: Get Emergency Contacts');
    const result = await apiCall('GET', `/api/family/user/${TEST_USER_ID}/emergency-contacts`);
    if (result.success) {
        console.log(`✅ Retrieved ${result.data.count} emergency contacts`);
        result.data.data.forEach(contact => {
            console.log(`   - ${contact.firstName} ${contact.lastName} (${contact.relationship})`);
        });
    } else {
        console.log('❌ Failed to get emergency contacts:', result.error);
    }
    return result;
};

const testSearchFamilyMembers = async (query) => {
    console.log(`🧪 Testing: Search Family Members ("${query}")`);
    const result = await apiCall('GET', `/api/family/user/${TEST_USER_ID}/search?query=${encodeURIComponent(query)}`);
    if (result.success) {
        console.log(`✅ Search returned ${result.data.count} results`);
        result.data.data.forEach(member => {
            console.log(`   - ${member.firstName} ${member.lastName} (${member.relationship})`);
        });
    } else {
        console.log('❌ Failed to search family members:', result.error);
    }
    return result;
};

const testGetFamilyStatistics = async () => {
    console.log('🧪 Testing: Get Family Statistics');
    const result = await apiCall('GET', `/api/family/user/${TEST_USER_ID}/statistics`);
    if (result.success) {
        console.log('✅ Family statistics retrieved');
        const stats = result.data.data;
        console.log(`   - Total Members: ${stats.totalMembers}`);
        console.log(`   - Emergency Contacts: ${stats.emergencyContactsCount}`);
        console.log('   - Relationship Breakdown:');
        stats.relationshipBreakdown.forEach(item => {
            console.log(`     * ${item.relationship}: ${item.count}`);
        });
        if (stats.genderBreakdown.length > 0) {
            console.log('   - Gender Breakdown:');
            stats.genderBreakdown.forEach(item => {
                console.log(`     * ${item.gender}: ${item.count}`);
            });
        }
    } else {
        console.log('❌ Failed to get family statistics:', result.error);
    }
    return result;
};

const testValidationErrors = async () => {
    console.log('🧪 Testing: Validation Errors');

    // Test invalid relationship
    console.log('   Testing invalid relationship...');
    const invalidRelationship = await apiCall('POST', '/api/family/add', {
        ...sampleFamilyMember,
        relationship: 'InvalidRelation'
    });
    if (!invalidRelationship.success && invalidRelationship.status === 400) {
        console.log('   ✅ Correctly rejected invalid relationship');
    } else {
        console.log('   ❌ Failed to reject invalid relationship');
    }

    // Test missing required fields
    console.log('   Testing missing required fields...');
    const missingFields = await apiCall('POST', '/api/family/add', {
        userId: TEST_USER_ID,
        firstName: 'Test'
        // Missing lastName and relationship
    });
    if (!missingFields.success && missingFields.status === 400) {
        console.log('   ✅ Correctly rejected missing required fields');
    } else {
        console.log('   ❌ Failed to reject missing required fields');
    }

    // Test invalid email
    console.log('   Testing invalid email format...');
    const invalidEmail = await apiCall('POST', '/api/family/add', {
        ...sampleFamilyMember,
        email: 'invalid-email'
    });
    if (!invalidEmail.success && invalidEmail.status === 400) {
        console.log('   ✅ Correctly rejected invalid email format');
    } else {
        console.log('   ❌ Failed to reject invalid email format');
    }
};

const testSoftDelete = async (familyId) => {
    console.log('🧪 Testing: Soft Delete Family Member');
    const result = await apiCall('DELETE', `/api/family/${familyId}`);
    if (result.success) {
        console.log('✅ Family member soft deleted successfully');
    } else {
        console.log('❌ Failed to soft delete family member:', result.error);
    }
    return result;
};

// Main test runner
const runAllTests = async () => {
    console.log('🚀 Starting Comprehensive Family API Tests');
    console.log('='.repeat(60));

    let familyMemberId = null;

    try {
        // Test getting options
        await testGetFamilyOptions();
        console.log('');

        // Test validation errors first
        await testValidationErrors();
        console.log('');

        // Test adding single family member
        familyMemberId = await testAddFamilyMember();
        console.log('');

        // Test bulk adding family members
        await testBulkAddFamilyMembers();
        console.log('');

        // Test getting all family members
        const allMembers = await testGetFamilyMembers();
        console.log('');

        if (familyMemberId) {
            // Test getting family member by ID
            await testGetFamilyMemberById(familyMemberId);
            console.log('');

            // Test updating family member
            await testUpdateFamilyMember(familyMemberId);
            console.log('');
        }

        // Test getting family members by relationship
        await testGetFamilyMembersByRelationship('Father');
        console.log('');

        // Test getting emergency contacts
        await testGetEmergencyContacts();
        console.log('');

        // Test searching family members
        await testSearchFamilyMembers('Doe');
        console.log('');

        // Test getting family statistics
        await testGetFamilyStatistics();
        console.log('');

        // Test soft delete (optional)
        if (familyMemberId) {
            await testSoftDelete(familyMemberId);
            console.log('');
        }

        console.log('✅ All comprehensive tests completed successfully!');

    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }

    console.log('='.repeat(60));
    console.log('🏁 Comprehensive Family API Tests Completed');
};

// Run tests if this file is executed directly
if (require.main === module) {
    console.log('⚠️  Make sure your server is running on port 3000!');
    console.log(`📍 Testing against: ${BASE_URL}`);
    console.log(`👤 Using Test User ID: ${TEST_USER_ID}`);
    console.log('');

    // Wait a moment for server to be ready
    setTimeout(runAllTests, 2000);
}

module.exports = { runAllTests, apiCall }; 