const axios = require('axios');

// Base URL for the 3rd party Family API - should be set via environment variable
const FAMILY_API_BASE_URL = process.env.FAMILY_API_BASE_URL || 'http://43.204.91.138:3001';

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