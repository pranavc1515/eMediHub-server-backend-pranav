const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const FAMILY_API_BASE_URL = 'http://43.204.91.138:3001';

// Test token (you'll need to replace this with a valid token)
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

        if (response.data.data?.familyTree?.length > 0) {
            console.log('👥 Sample family member:', {
                name: response.data.data.familyTree[0].name,
                relation: response.data.data.familyTree[0].relation_type
            });
        }

        return true;
    } catch (error) {
        console.log('❌ Family tree test failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testAddFamilyMember() {
    try {
        console.log('👥 Testing add family member...');

        // Get user ID from family tree first (if available)
        let nodeUserId = 1; // Default fallback
        try {
            const treeResponse = await axios.get(`${BASE_URL}/api/family/view-family-tree`, {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`
                }
            });
            if (treeResponse.data.data?.user?.id) {
                nodeUserId = treeResponse.data.data.user.id;
            }
        } catch (err) {
            console.log('⚠️  Could not get user ID, using default:', nodeUserId);
        }

        const memberData = {
            nodeUserId: nodeUserId,
            relationName: "Brother",
            name: "Test Brother API",
            phone: "+1234567890",
            email: "test.brother@example.com",
            age: "30-year",
            gender: "male",
            marital_status: "Single",
            profession: "Software Engineer",
            height: "175-cm",
            weight: "70-kg",
            diet: "Vegetarian"
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

async function testUpdateFamilyMember(familyMemberId) {
    if (!familyMemberId) {
        console.log('⏭️  Skipping update test - no family member ID available');
        return false;
    }

    try {
        console.log('✏️  Testing update family member...');

        const updateData = {
            name: "Updated Test Brother",
            profession: "Senior Software Engineer",
            age: "31-year",
            marital_status: "Married"
        };

        const response = await axios.post(`${BASE_URL}/api/family/update-family-details/${familyMemberId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Family member updated successfully');
        return true;
    } catch (error) {
        console.log('❌ Update family member test failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testRemoveFamilyMember(familyMemberId) {
    if (!familyMemberId) {
        console.log('⏭️  Skipping remove test - no family member ID available');
        return false;
    }

    try {
        console.log('🗑️  Testing remove family member...');

        const response = await axios.delete(`${BASE_URL}/api/family/remove-member/${familyMemberId}`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Family member removed successfully');
        return true;
    } catch (error) {
        console.log('❌ Remove family member test failed:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testErrorHandling() {
    try {
        console.log('🛡️  Testing error handling...');

        // Test with invalid token
        try {
            await axios.get(`${BASE_URL}/api/family/view-family-tree`, {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });
            console.log('❌ Error handling test failed - should have returned 401');
            return false;
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Authentication error handling working correctly');
            } else {
                console.log('⚠️  Unexpected error status:', error.response?.status);
            }
        }

        // Test missing required fields
        try {
            await axios.post(`${BASE_URL}/api/family/add-family-connection`, {
                name: "Test Name" // Missing required fields
            }, {
                headers: {
                    'Authorization': `Bearer ${TEST_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Validation error handling test failed - should have returned 400');
            return false;
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validation error handling working correctly');
            } else {
                console.log('⚠️  Unexpected validation error status:', error.response?.status);
            }
        }

        return true;
    } catch (error) {
        console.log('❌ Error handling test failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Family API integration tests...\n');

    const results = {
        connection: await testFamilyAPIConnection(),
        viewTree: await testViewFamilyTree(),
        addMember: null,
        updateMember: null,
        removeMember: null,
        errorHandling: await testErrorHandling()
    };

    // Test add, update, remove in sequence
    const familyMemberId = await testAddFamilyMember();
    results.addMember = familyMemberId !== null;

    if (familyMemberId) {
        results.updateMember = await testUpdateFamilyMember(familyMemberId);
        results.removeMember = await testRemoveFamilyMember(familyMemberId);
    }

    console.log('\n📋 Test Results Summary:');
    console.log('✅ Direct API Connection:', results.connection ? 'PASS' : 'FAIL');
    console.log('✅ View Family Tree:', results.viewTree ? 'PASS' : 'FAIL');
    console.log('✅ Add Family Member:', results.addMember ? 'PASS' : 'FAIL');
    console.log('✅ Update Family Member:', results.updateMember ? 'PASS' : 'SKIP');
    console.log('✅ Remove Family Member:', results.removeMember ? 'PASS' : 'SKIP');
    console.log('✅ Error Handling:', results.errorHandling ? 'PASS' : 'FAIL');

    const testResults = Object.values(results).filter(r => r !== null);
    const passedTests = testResults.filter(Boolean).length;
    console.log(`\n🎯 Overall: ${passedTests}/${testResults.length} tests passed`);

    if (passedTests === testResults.length) {
        console.log('🎉 All tests passed! Family API integration is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the configuration and try again.');
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Ensure the Family API is accessible at', FAMILY_API_BASE_URL);
        console.log('2. Verify your test token is valid and not expired');
        console.log('3. Check if the local server is running on', BASE_URL);
        console.log('4. Review the error messages above for specific issues');
    }
}

// Helper function to check if server is running
async function checkLocalServer() {
    try {
        await axios.get(`${BASE_URL}/api-docs`, { timeout: 3000 });
        return true;
    } catch (error) {
        return false;
    }
}

// Main execution
async function main() {
    console.log('🔍 Pre-flight checks...');

    const serverRunning = await checkLocalServer();
    if (!serverRunning) {
        console.log('❌ Local server is not running at', BASE_URL);
        console.log('💡 Please start your server with: npm start');
        return;
    }
    console.log('✅ Local server is running');

    if (TEST_TOKEN === 'your-test-token-here') {
        console.log('⚠️  Warning: Using placeholder test token');
        console.log('💡 Please update TEST_TOKEN with a valid JWT token');
        console.log('🚀 Running tests anyway...\n');
    }

    await runTests();
}

main().catch(console.error); 