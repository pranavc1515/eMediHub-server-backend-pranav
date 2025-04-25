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
        const doctorId = req.user.id;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Validate consultation exists and belongs to the doctor
        const consultation = await Consultation.findOne({
            where: { id: consultationId, doctorId },
            include: [{ model: Patient, as: 'patient' }]
        });

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found or you do not have permission'
            });
        }

        // Upload file to S3
        const uploadResult = await uploadToS3(
            file,
            consultationId,
            doctorId,
            consultation.patientId
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
            patientId: consultation.patientId,
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
        const { medicines, instructions } = req.body;
        const doctorId = req.user.id;

        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Medicines list is required'
            });
        }

        // Validate consultation exists and belongs to the doctor
        const consultation = await Consultation.findOne({
            where: { id: consultationId, doctorId },
            include: [{ model: Patient, as: 'patient' }]
        });

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found or you do not have permission'
            });
        }

        // Format the custom prescription
        const customPrescription = {
            patientName: `${consultation.patient.firstName} ${consultation.patient.lastName}`,
            doctorName: '', // Will be populated from doctor record
            date: new Date().toISOString().split('T')[0],
            medicines,
            instructions: instructions || ''
        };

        // Get doctor details
        const doctor = await DoctorPersonal.findByPk(doctorId);
        if (doctor) {
            customPrescription.doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
        }

        // Generate PDF from custom prescription and upload to S3
        const pdfResult = await generatePrescriptionPDF(
            customPrescription,
            consultationId,
            doctorId,
            consultation.patientId
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
            patientId: consultation.patientId,
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
            where: { id, isDeleted: false },
            include: [
                { model: Consultation, as: 'consultation' },
                { model: Patient, as: 'patient' },
                { model: DoctorPersonal, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'specialization'] }
            ]
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
        const patientId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: prescriptions } = await Prescription.findAndCountAll({
            where: { patientId, isDeleted: false },
            include: [
                {
                    model: Consultation,
                    as: 'consultation',
                    attributes: ['id', 'scheduledDate', 'actualStartTime', 'actualEndTime', 'status']
                },
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: ['id', 'firstName', 'lastName', 'specialization']
                }
            ],
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
        const doctorId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: prescriptions } = await Prescription.findAndCountAll({
            where: { doctorId, isDeleted: false },
            include: [
                {
                    model: Consultation,
                    as: 'consultation',
                    attributes: ['id', 'scheduledDate', 'actualStartTime', 'actualEndTime', 'status']
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender']
                }
            ],
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
        const userId = req.user.id;

        // Determine if user is doctor or patient
        const consultation = await Consultation.findByPk(consultationId);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        // Verify user has access to this consultation
        if (consultation.doctorId !== userId && consultation.patientId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access these prescriptions'
            });
        }

        const prescriptions = await Prescription.findAll({
            where: { consultationId, isDeleted: false },
            include: [
                { model: DoctorPersonal, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'specialization'] },
                { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender'] }
            ],
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
        const doctorId = req.user.id;

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

        // Optionally, delete from S3 as well
        // await deleteFromS3(prescription.s3Key);

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