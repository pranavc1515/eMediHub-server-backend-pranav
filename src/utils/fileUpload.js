const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { s3, s3BucketName } = require('../config/aws');
const PDFDocument = require('pdfkit');

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

// Configure multer specifically for profile photos (images only)
const uploadProfilePhoto = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB for profile photos
    },
    fileFilter: (req, file, callback) => {
        // Accept only jpg, jpeg, png files for profile photos
        const allowedImageTypes = ['.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedImageTypes.includes(ext)) {
            return callback(null, true);
        }

        callback(new Error('Invalid file type. Only JPG, JPEG, and PNG files are allowed for profile photos.'));
    }
});

// Function to upload file to S3
const uploadToS3 = async (file, consultationId, doctorId, patientId) => {
    // Generate unique file name with appropriate path
    const fileExtension = path.extname(file.originalname);
    const key = `uploads/${consultationId}/${uuidv4()}${fileExtension}`;

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

// Function to upload doctor documents (certificates/documents) to S3
const uploadDoctorDocumentToS3 = async (file, doctorId, documentType) => {
    // Generate unique file name with appropriate path
    const fileExtension = path.extname(file.originalname);
    const key = `doctors/${doctorId}/${documentType}/${uuidv4()}${fileExtension}`;

    const params = {
        Bucket: s3BucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
            'doctor-id': doctorId.toString(),
            'document-type': documentType,
            'original-name': file.originalname
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
        console.error('Error uploading doctor document to S3:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to upload doctor profile photo to S3
const uploadDoctorProfilePhotoToS3 = async (file, doctorId) => {
    // Generate unique file name with appropriate path
    const fileExtension = path.extname(file.originalname);
    const key = `doctors/${doctorId}/profile/${uuidv4()}${fileExtension}`;

    const params = {
        Bucket: s3BucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
            'doctor-id': doctorId.toString(),
            'document-type': 'profile-photo',
            'original-name': file.originalname
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
        console.error('Error uploading doctor profile photo to S3:', error);
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
    uploadProfilePhoto,
    uploadToS3,
    uploadDoctorDocumentToS3,
    uploadDoctorProfilePhotoToS3,
    deleteFromS3
}; 