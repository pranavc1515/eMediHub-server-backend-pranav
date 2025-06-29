const axios = require('axios');
const FormData = require('form-data');

// Base URL for the 3rd party Reports API - should be set via environment variable
const REPORTS_API_BASE_URL = process.env.REPORTS_API_BASE_URL || 'http://43.204.91.138:3000';

// Helper function to create axios instance with proper headers
const createAxiosInstance = (token) => {
    return axios.create({
        baseURL: REPORTS_API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
    });
};

// Upload a medical report PDF
exports.uploadReport = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        // Create FormData for file upload
        const formData = new FormData();

        // Add all form fields to FormData
        const fields = [
            'report_title', 'report_type', 'doctor_name', 'doctor_id',
            'target_user_id', 'related_user', 'report_date', 'report_reason',
            'report_analysis', 'report_pdf', 'food_allergies', 'drug_allergies',
            'blood_group', 'implants', 'surgeries', 'family_medical_history'
        ];

        fields.forEach(field => {
            if (req.body[field]) {
                formData.append(field, req.body[field]);
            }
        });

        // Add files if present (supports multiple files)
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                formData.append('report_pdf', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
            });
        }

        // Make request to 3rd party API
        const response = await axios.post(`${REPORTS_API_BASE_URL}/reports/upload`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            },
            timeout: 60000 // 60 second timeout for file uploads
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Reports upload error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error during report upload',
                error: error.message
            });
        }
    }
};

// View user and family medical reports
exports.viewReports = async (req, res) => {
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

        // Handle both query parameters and request body filters
        const requestData = req.body || {};

        const response = await axiosInstance.get('/reports/view', {
            data: requestData
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Reports view error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while fetching reports',
                error: error.message
            });
        }
    }
};

// Delete a report
exports.deleteReport = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        const { report_id } = req.params;

        if (!report_id) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'Report ID is required'
            });
        }

        const axiosInstance = createAxiosInstance(token);
        const response = await axiosInstance.delete(`/reports/delete/${report_id}`);

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Reports delete error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while deleting report',
                error: error.message
            });
        }
    }
};

// Download merged reports
exports.downloadMergedReports = async (req, res) => {
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

        // Send request body if provided
        const requestData = req.body || {};

        const response = await axiosInstance.get('/reports/download', {
            data: requestData
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Reports download merged error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while downloading merged reports',
                error: error.message
            });
        }
    }
};

// Download a single report with summary page
exports.downloadSingleReport = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        const { report_id } = req.params;

        if (!report_id) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'Report ID is required'
            });
        }

        const axiosInstance = createAxiosInstance(token);
        const response = await axiosInstance.get(`/reports/download/${report_id}`);

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Reports download single error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while downloading report',
                error: error.message
            });
        }
    }
};

// Edit an existing medical report
exports.editReport = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                status_code: 401,
                message: 'Authentication token required'
            });
        }

        const { report_id } = req.params;

        if (!report_id) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'Report ID is required'
            });
        }

        // Create FormData for file upload
        const formData = new FormData();

        // Add all form fields to FormData
        const fields = [
            'related_user', 'doctor_name', 'report_date', 'report_reason',
            'report_analysis', 'food_allergies', 'drug_allergies',
            'blood_group', 'implants', 'surgeries', 'family_medical_history',
            'medical_condition', 'allergies', 'medications', 'deletePages[]', 'addAfterPage'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                formData.append(field, req.body[field]);
            }
        });

        // Add files if present (supports multiple files)
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                formData.append('report_pdf', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
            });
        }

        // Make request to 3rd party API
        const response = await axios.put(`${REPORTS_API_BASE_URL}/reports/edit/${report_id}`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            },
            timeout: 60000 // 60 second timeout for file uploads
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Reports edit error:', error);

        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({
                status: false,
                message: 'Internal server error while updating report',
                error: error.message
            });
        }
    }
}; 