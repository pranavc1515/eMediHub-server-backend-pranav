const axios = require('axios');

// Base URL for the 3rd party Family API - should be set via environment variable
const FAMILY_API_BASE_URL = process.env.FAMILY_API_BASE_URL || 'http://43.204.91.138:3000';

// Helper function to create axios instance with proper headers
const createAxiosInstance = (token) => {
    return axios.create({
        baseURL: FAMILY_API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
    });
};

// View family tree
exports.viewFamilyTree = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        const axiosInstance = createAxiosInstance(token);
        const response = await axiosInstance.get('/family/view-family-tree');

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Family tree view error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while fetching family tree',
                error: error.message
            });
        }
    }
};

// Add family connection
exports.addFamilyConnection = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        // Validate required fields
        const { nodeUserId, relationName, name } = req.body;
        if (!nodeUserId || !relationName || !name) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'Required fields: nodeUserId, relationName, name'
            });
        }

        const axiosInstance = createAxiosInstance(token);
        const response = await axiosInstance.post('/family/add-family-connection', req.body);

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Family connection add error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while adding family member',
                error: error.message
            });
        }
    }
};

// Update family details
exports.updateFamilyDetails = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        const { familyMemberId } = req.params;

        if (!familyMemberId) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'Family member ID is required'
            });
        }

        const axiosInstance = createAxiosInstance(token);
        const response = await axiosInstance.post(`/family/update-family-details/${familyMemberId}`, req.body);

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Family details update error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while updating family member details',
                error: error.message
            });
        }
    }
};

// Remove family member
exports.removeFamilyMember = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        const { relatedUserId } = req.params;

        if (!relatedUserId) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'Related user ID is required'
            });
        }

        const axiosInstance = createAxiosInstance(token);
        const response = await axiosInstance.delete(`/family/remove-member/${relatedUserId}`, {
            data: req.body // Include request body for any additional data
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Family member remove error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while removing family member',
                error: error.message
            });
        }
    }
};

// Helper function to get family tree data for internal use
const getFamilyTreeData = async (userId, authToken) => {
    try {
        console.log(`📞 Making API call to fetch family tree for user ${userId}`);
        console.log(`🔑 Using auth token: ${authToken ? 'Present' : 'Missing'}`);
        console.log(`🌐 API URL: ${FAMILY_API_BASE_URL}/family/view-family-tree`);
        
        const axiosInstance = createAxiosInstance(authToken);
        const response = await axiosInstance.get('/family/view-family-tree');
        
        console.log(`📡 Family API response status: ${response.status}`);
        console.log(`📊 Family API response data:`, JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.status) {
            console.log(`✅ Successfully fetched family tree data`);
            return response.data;
        } else {
            console.log(`❌ Family API returned unsuccessful status`);
            throw new Error('Failed to fetch family tree data');
        }
    } catch (error) {
        console.error('❌ Error fetching family tree data:', error);
        if (error.response) {
            console.error('📡 API Error Response:', error.response.status, error.response.data);
        }
        throw new Error('Failed to fetch family tree data');
    }
};

// Helper function to validate if patientId belongs to user's family tree
const validateFamilyMembership = async (userId, patientId, authToken) => {
    try {
        console.log(`🔍 Validating family membership: userId=${userId}, patientId=${patientId}`);
        
        // If userId and patientId are the same, it's the user themselves
        if (parseInt(userId) === parseInt(patientId)) {
            console.log(`✅ Same user - userId and patientId are identical`);
            return true;
        }

        // Get family tree data
        console.log(`📞 Fetching family tree data for user ${userId}...`);
        const familyData = await getFamilyTreeData(userId, authToken);
        
        if (!familyData || !familyData.data || !familyData.data.familyTree) {
            console.log(`❌ No family tree data found for user ${userId}`);
            return false;
        }

        console.log(`📊 Family tree structure:`, JSON.stringify(familyData.data, null, 2));
        
        // Check if patientId exists in the family tree
        console.log(`🔍 About to search for patientId ${patientId} in family tree...`);
        
        // Additional check: also search in the user data itself
        if (familyData.data.user && parseInt(familyData.data.user.id) === parseInt(patientId)) {
            console.log(`✅ Found patientId ${patientId} as the main user`);
            return true;
        }
        
        const isValidFamilyMember = checkPatientInFamilyTree(familyData.data.familyTree, patientId);
        
        console.log(`🔍 Family membership check result: ${isValidFamilyMember ? 'VALID' : 'INVALID'}`);
        return isValidFamilyMember;
    } catch (error) {
        console.error('❌ Error validating family membership:', error);
        return false;
    }
};

// Recursive function to check if patientId exists in family tree
const checkPatientInFamilyTree = (familyTree, patientId) => {
    console.log(`🔍 Searching for patientId ${patientId} in family tree with ${familyTree.length} members`);
    
    for (const member of familyTree) {
        console.log(`👤 Checking member: ID=${member.id}, Name=${member.name}`);
        
        // Check if current member matches
        if (parseInt(member.id) === parseInt(patientId)) {
            console.log(`✅ Found matching family member: ${member.name} (ID: ${member.id})`);
            return true;
        }
        
        // Check children recursively if they exist
        if (member.children && member.children.length > 0) {
            console.log(`👶 Checking ${member.children.length} children of ${member.name}`);
            if (checkPatientInFamilyTree(member.children, patientId)) {
                return true;
            }
        }
        
        // Check relatives if they exist
        if (member.relatives && member.relatives.length > 0) {
            console.log(`👥 Checking ${member.relatives.length} relatives of ${member.name}`);
            if (checkPatientInFamilyTree(member.relatives, patientId)) {
                return true;
            }
        }
    }
    
    console.log(`❌ PatientId ${patientId} not found in this family tree branch`);
    return false;
};

// Function to get family member data by patientId
const getFamilyMemberData = async (userId, patientId, authToken) => {
    try {
        // First check if it's the user themselves
        if (parseInt(userId) === parseInt(patientId)) {
            // Return null so the calling function can use direct patient validation
            return null;
        }

        // Get family tree data
        const familyData = await getFamilyTreeData(userId, authToken);
        
        if (!familyData || !familyData.data || !familyData.data.familyTree) {
            throw new Error('Family tree data not found');
        }

        // Find the specific family member data
        const memberData = findMemberInFamilyTree(familyData.data.familyTree, patientId);
        
        if (!memberData) {
            throw new Error(`Family member with ID ${patientId} not found in user ${userId}'s family tree`);
        }

        return memberData;
    } catch (error) {
        console.error('Error getting family member data:', error);
        throw error;
    }
};

// Recursive function to find specific member data in family tree
const findMemberInFamilyTree = (familyTree, patientId) => {
    for (const member of familyTree) {
        // Check if current member matches
        if (parseInt(member.id) === parseInt(patientId)) {
            return {
                id: member.id,
                name: member.name,
                phone: member.phone,
                email: member.email,
                age: member.age,
                dob: member.dob,
                gender: member.gender,
                height: member.height,
                weight: member.weight,
                diet: member.diet,
                relation_type: member.relation_type,
                marital_status: member.marital_status,
                profession: member.profession,
            };
        }
        
        // Check children recursively if they exist
        if (member.children && member.children.length > 0) {
            const childData = findMemberInFamilyTree(member.children, patientId);
            if (childData) {
                return childData;
            }
        }
        
        // Check relatives if they exist
        if (member.relatives && member.relatives.length > 0) {
            const relativeData = findMemberInFamilyTree(member.relatives, patientId);
            if (relativeData) {
                return relativeData;
            }
        }
    }
    
    return null;
};

// Export the helper functions for use in other controllers
module.exports = {
    viewFamilyTree: exports.viewFamilyTree,
    addFamilyConnection: exports.addFamilyConnection,
    updateFamilyDetails: exports.updateFamilyDetails,
    removeFamilyMember: exports.removeFamilyMember,
    validateFamilyMembership,
    getFamilyTreeData,
    getFamilyMemberData
};