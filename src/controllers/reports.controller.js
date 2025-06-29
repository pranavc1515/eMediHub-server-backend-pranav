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

        // Validate required fields
        if (!req.body.doctor_name || !req.body.report_date) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'doctor_name and report_date are required'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: false,
                status_code: 400,
                message: 'At least one PDF file is required'
            });
        }

        // Create FormData for file upload
        const formData = new FormData();

        // Add required fields
        formData.append('doctor_name', req.body.doctor_name);
        formData.append('report_date', req.body.report_date);

        // Add optional fields
        if (req.body.target_user_id) {
            formData.append('target_user_id', req.body.target_user_id);
        }
        if (req.body.doctor_id) {
            formData.append('doctor_id', req.body.doctor_id);
        }

        // Add files (supports multiple files)
        req.files.forEach(file => {
            formData.append('report_pdf', file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype
            });
        });

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

        // Simple GET request without request body as per new API
        const response = await axiosInstance.get('/reports/view');

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

        // Add all form fields to FormData (all fields are optional for edit)
        const fields = [
            'report_title', 'report_type', 'report_date', 'doctor_name',
            'target_user_id', 'doctor_id'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
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

        // Note: The API uses GET with request body (unusual but per API documentation)
        const requestData = {
            related_user: req.body.related_user || '',
            start_date: req.body.start_date || '',
            end_date: req.body.end_date || ''
        };

        const response = await axios.get(`${REPORTS_API_BASE_URL}/reports/download`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: requestData,
            timeout: 60000 // 60 second timeout for file processing
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