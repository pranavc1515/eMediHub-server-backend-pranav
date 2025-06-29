const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const REPORTS_API_BASE_URL = 'http://43.204.91.138:3000';

// Test token (you'll need to replace this with a valid token)
const TEST_TOKEN = 'your-test-token-here';

console.log('🧪 Testing Reports API Integration...\n');

async function testReportsAPIConnection() {
    try {
        console.log('🔗 Testing direct connection to Reports API...');
        const response = await axios.get(`${REPORTS_API_BASE_URL}/health`, {
            timeout: 5000
        });
        console.log('✅ Direct connection successful');
        return true;
    } catch (error) {
        console.log('❌ Direct connection failed:', error.message);
        return false;
    }
}

async function testViewReports() {
    try {
        console.log('📋 Testing view reports endpoint...');
        const response = await axios.get(`${BASE_URL}/api/reports/view`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        });
        console.log('✅ View reports endpoint working');
        return true;
    } catch (error) {
        console.log('❌ View reports failed:', error.response?.status, error.response?.data || error.message);
        return false;
    }
}

async function testDownloadMergedReports() {
    try {
        console.log('⬇️ Testing download merged reports endpoint...');
        const response = await axios.get(`${BASE_URL}/api/reports/download`, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                start_date: '2024-01-01',
                end_date: '2024-12-31'
            }
        });
        console.log('✅ Download merged reports endpoint working');
        return true;
    } catch (error) {
        console.log('❌ Download merged reports failed:', error.response?.status, error.response?.data || error.message);
        return false;
    }
}

async function testServerStatus() {
    try {
        console.log('🔍 Testing server status...');
        const response = await axios.get(`${BASE_URL}/api/auth/register`, {
            timeout: 5000
        });
        console.log('✅ Server is running');
        return true;
    } catch (error) {
        if (error.response?.status === 405 || error.response?.status === 400) {
            console.log('✅ Server is running (expected method error)');
            return true;
        }
        console.log('❌ Server connection failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('='.repeat(50));
    console.log('📊 REPORTS API INTEGRATION TEST RESULTS');
    console.log('='.repeat(50));

    const results = {
        serverStatus: await testServerStatus(),
        apiConnection: await testReportsAPIConnection(),
    };

    if (TEST_TOKEN !== 'your-test-token-here') {
        results.viewReports = await testViewReports();
        results.downloadMerged = await testDownloadMergedReports();
    } else {
        console.log('⚠️ Skipping authenticated tests - please provide a valid TEST_TOKEN');
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY:');
    console.log('='.repeat(50));

    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Reports API integration is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the configuration and try again.');
    }
}

// Instructions for usage
console.log('📝 INSTRUCTIONS:');
console.log('1. Make sure your server is running on port 3000');
console.log('2. Update TEST_TOKEN with a valid authentication token for full testing');
console.log('3. Ensure the Reports API is accessible at http://43.204.91.138:3000');
console.log('');

runTests().catch(console.error); 