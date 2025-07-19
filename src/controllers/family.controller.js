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
        const axiosInstance = createAxiosInstance(authToken);
        const response = await axiosInstance.get('/family/view-family-tree');
        
        if (response.data && response.data.status) {
            return response.data;
        } else {
            throw new Error('Failed to fetch family tree data');
        }
    } catch (error) {
        console.error('Error fetching family tree data:', error);
        throw new Error('Failed to fetch family tree data');
    }
};

// Helper function to validate if patientId belongs to user's family tree
const validateFamilyMembership = async (userId, patientId, authToken) => {
    try {
        // If userId and patientId are the same, it's the user themselves
        if (parseInt(userId) === parseInt(patientId)) {
            return true;
        }

        // Get family tree data
        const familyData = await getFamilyTreeData(userId, authToken);
        
        if (!familyData || !familyData.data || !familyData.data.familyTree) {
            return false;
        }

        // Check if patientId exists in the family tree
        const isValidFamilyMember = checkPatientInFamilyTree(familyData.data.familyTree, patientId);
        
        return isValidFamilyMember;
    } catch (error) {
        console.error('Error validating family membership:', error);
        return false;
    }
};

// Recursive function to check if patientId exists in family tree
const checkPatientInFamilyTree = (familyTree, patientId) => {
    for (const member of familyTree) {
        // Check if current member matches
        if (parseInt(member.id) === parseInt(patientId)) {
            return true;
        }
        
        // Check children recursively if they exist
        if (member.children && member.children.length > 0) {
            if (checkPatientInFamilyTree(member.children, patientId)) {
                return true;
            }
        }
        
        // Check relatives if they exist
        if (member.relatives && member.relatives.length > 0) {
            if (checkPatientInFamilyTree(member.relatives, patientId)) {
                return true;
            }
        }
    }
    
    return false;
};

// Export the helper functions for use in other controllers
module.exports = {
    viewFamilyTree: exports.viewFamilyTree,
    addFamilyConnection: exports.addFamilyConnection,
    updateFamilyDetails: exports.updateFamilyDetails,
    removeFamilyMember: exports.removeFamilyMember,
    validateFamilyMembership,
    getFamilyTreeData
};