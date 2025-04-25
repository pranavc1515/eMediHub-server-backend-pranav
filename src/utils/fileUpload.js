const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { s3, s3BucketName } = require('../config/aws');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
    },
    fileFilter: (req, file, callback) => {
        // Accept only pdf, jpg, jpeg, png files
        const allowedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedFileTypes.includes(ext)) {
            return callback(null, true);
        }

        callback(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
});

// Function to upload file to S3
const uploadToS3 = async (file, consultationId, doctorId, patientId) => {
    // Generate unique file name with appropriate path
    const fileExtension = path.extname(file.originalname);
    const key = `prescriptions/${consultationId}/${uuidv4()}${fileExtension}`;

    const params = {
        Bucket: s3BucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
            'consultation-id': consultationId,
            'doctor-id': doctorId,
            'patient-id': patientId
        }
    };

    try {
        const result = await s3.upload(params).promise();
        return {
            success: true,
            fileUrl: result.Location,
            key: result.Key,
            filename: file.originalname,
            fileType: file.mimetype
        };
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to generate PDF from custom prescription data
const generatePrescriptionPDF = async (prescriptionData, consultationId, doctorId, patientId) => {
    // This would be implemented with a PDF generation library like PDFKit
    // For now, we'll just mock the functionality
    try {
        // Mock a PDF buffer (in real implementation, this would be the actual PDF)
        const mockPdfBuffer = Buffer.from('Mock PDF content');

        const key = `prescriptions/${consultationId}/${uuidv4()}.pdf`;

        const params = {
            Bucket: s3BucketName,
            Key: key,
            Body: mockPdfBuffer,
            ContentType: 'application/pdf',
            Metadata: {
                'consultation-id': consultationId,
                'doctor-id': doctorId,
                'patient-id': patientId
            }
        };

        const result = await s3.upload(params).promise();
        return {
            success: true,
            fileUrl: result.Location,
            key: result.Key,
            filename: 'prescription.pdf',
            fileType: 'application/pdf'
        };
    } catch (error) {
        console.error('Error generating and uploading PDF:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to delete file from S3
const deleteFromS3 = async (key) => {
    try {
        await s3.deleteObject({
            Bucket: s3BucketName,
            Key: key
        }).promise();

        return {
            success: true
        };
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    upload,
    uploadToS3,
    generatePrescriptionPDF,
    deleteFromS3
}; 