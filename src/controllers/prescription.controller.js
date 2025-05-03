const Prescription = require('../models/prescription.model');
const Consultation = require('../models/consultation.model');
const Patient = require('../models/patient.model');
const { DoctorPersonal } = require('../models/doctor.model');
const { uploadToS3, generatePrescriptionPDF, deleteFromS3 } = require('../utils/fileUpload');

/**
 * Upload a prescription file (PDF, image) for a consultation
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const uploadPrescriptionFile = async (req, res) => {
    try {
        const { consultationId } = req.params;
        const file = req.file;
        // Get doctorId from req.user or from query parameters
        const doctorId = req.user?.id || req.query.doctorId || req.headers['x-doctor-id'];
        // Try to get patientId from multiple sources or generate one
        let patientId = req.query.userId || req.headers['x-user-id'];

        // If no patientId is provided, create a synthetic one (based on consultationId)
        if (!patientId) {
            patientId = `patient-${consultationId.substring(0, 8)}`;
            console.log(`No patient ID provided, using synthetic ID: ${patientId}`);
        }

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        // Upload file to S3 - no consultation validation for now
        const uploadResult = await uploadToS3(
            file,
            consultationId,
            doctorId,
            patientId
        );

        if (!uploadResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload prescription',
                error: uploadResult.error
            });
        }

        // Create prescription record
        const prescription = await Prescription.create({
            consultationId,
            patientId,
            doctorId,
            prescriptionUrl: uploadResult.fileUrl,
            prescriptionType: 'file',
            s3Key: uploadResult.key,
            filename: uploadResult.filename,
            fileType: uploadResult.fileType
        });

        return res.status(201).json({
            success: true,
            message: 'Prescription uploaded successfully',
            data: prescription
        });
    } catch (error) {
        console.error('Error uploading prescription:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Create a custom prescription 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createCustomPrescription = async (req, res) => {
    try {
        const { consultationId } = req.params;
        const { medicines, instructions, patientName = 'Patient', patientId: bodyPatientId } = req.body;
        // Get doctorId from req.user or from query parameters
        const doctorId = req.user?.id || req.query.doctorId || req.headers['x-doctor-id'];
        // Try to get patientId from multiple sources or generate one based on other parameters
        let patientId = req.query.userId || req.headers['x-user-id'] || bodyPatientId;

        // If no patientId is provided, create a synthetic one (based on consultationId)
        if (!patientId) {
            patientId = `patient-${consultationId.substring(0, 8)}`;
            console.log(`No patient ID provided, using synthetic ID: ${patientId}`);
        }

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Medicines list is required'
            });
        }

        // Format the custom prescription without consultation lookup
        const customPrescription = {
            patientName: patientName,
            doctorName: 'Doctor', // Default value
            date: new Date().toISOString().split('T')[0],
            medicines,
            instructions: instructions || ''
        };

        // Get doctor details if possible (won't block if table doesn't exist)
        try {
            const doctor = await DoctorPersonal.findByPk(doctorId);
            if (doctor) {
                customPrescription.doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
            }
        } catch (error) {
            console.log('Could not fetch doctor details, using default name');
        }

        // Generate PDF from custom prescription and upload to S3
        const pdfResult = await generatePrescriptionPDF(
            customPrescription,
            consultationId,
            doctorId,
            patientId
        );

        if (!pdfResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate prescription PDF',
                error: pdfResult.error
            });
        }

        // Create prescription record
        const prescription = await Prescription.create({
            consultationId,
            patientId,
            doctorId,
            prescriptionUrl: pdfResult.fileUrl,
            prescriptionType: 'custom',
            s3Key: pdfResult.key,
            filename: pdfResult.filename,
            fileType: pdfResult.fileType,
            customPrescription: JSON.stringify(customPrescription),
            medicines,
            instructions
        });

        return res.status(201).json({
            success: true,
            message: 'Custom prescription created successfully',
            data: prescription
        });
    } catch (error) {
        console.error('Error creating custom prescription:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get prescription by ID 
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPrescriptionById = async (req, res) => {
    try {
        const { id } = req.params;

        const prescription = await Prescription.findOne({
            where: { id, isDeleted: false }
            // No includes to avoid dependencies on other tables
        });

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('Error fetching prescription:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all prescriptions for a patient
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPatientPrescriptions = async (req, res) => {
    try {
        // For backward compatibility, still check x-user-id but prefer query param
        const patientId = req.user?.id || req.query.userId || req.headers['x-user-id'];

        if (!patientId) {
            return res.status(400).json({
                success: false,
                message: 'Patient ID is required'
            });
        }

        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: prescriptions } = await Prescription.findAndCountAll({
            where: { patientId, isDeleted: false },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return res.status(200).json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: prescriptions
        });
    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all prescriptions created by a doctor
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDoctorPrescriptions = async (req, res) => {
    try {
        // For backward compatibility, still check x-doctor-id but prefer query param
        const doctorId = req.user?.id || req.query.doctorId || req.headers['x-doctor-id'];

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: prescriptions } = await Prescription.findAndCountAll({
            where: { doctorId, isDeleted: false },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return res.status(200).json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: prescriptions
        });
    } catch (error) {
        console.error('Error fetching doctor prescriptions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all prescriptions for a consultation
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getConsultationPrescriptions = async (req, res) => {
    try {
        const { consultationId } = req.params;
        // No consultation validation needed

        const prescriptions = await Prescription.findAll({
            where: { consultationId, isDeleted: false },
            // No includes to avoid dependencies on other tables
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            count: prescriptions.length,
            data: prescriptions
        });
    } catch (error) {
        console.error('Error fetching consultation prescriptions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Delete a prescription
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        // For backward compatibility, still check x-doctor-id but prefer query param
        const doctorId = req.user?.id || req.query.doctorId || req.headers['x-doctor-id'];

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required'
            });
        }

        const prescription = await Prescription.findOne({
            where: { id, doctorId }
        });

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found or you do not have permission to delete it'
            });
        }

        // Soft delete by updating the isDeleted flag
        await prescription.update({ isDeleted: true });

        return res.status(200).json({
            success: true,
            message: 'Prescription deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting prescription:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    uploadPrescriptionFile,
    createCustomPrescription,
    getPrescriptionById,
    getPatientPrescriptions,
    getDoctorPrescriptions,
    getConsultationPrescriptions,
    deletePrescription
}; 