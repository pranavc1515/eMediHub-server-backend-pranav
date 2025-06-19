const Consultation = require('../models/consultation.model');
const { PatientIN } = require('../models/patientIN.model');
const { DoctorPersonal } = require('../models/doctor.model');
const { Op } = require('sequelize');

// Get all consultations with filtering options
exports.getAllConsultations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            doctorId,
            patientId,
            startDate,
            endDate,
            consultationType
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        // Apply filters if provided
        if (status) where.status = status;
        if (doctorId) where.doctorId = doctorId;
        if (patientId) where.patientId = patientId;
        if (consultationType) where.consultationType = consultationType;

        // Date range filter
        if (startDate && endDate) {
            where.scheduledDate = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            where.scheduledDate = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            where.scheduledDate = {
                [Op.lte]: endDate
            };
        }

        const { count, rows: consultations } = await Consultation.findAndCountAll({
            where,
            include: [
                {
                    model: PatientIN,
                    as: 'patient',
                    attributes: ['id', 'name', 'email', 'phone']
                },
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: ['id', 'fullName', 'email', 'phoneNumber']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['scheduledDate', 'DESC'], ['startTime', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                consultations,
                total: count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching consultations',
            error: error.message
        });
    }
};

// Get consultation statistics
exports.getConsultationStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.scheduledDate = {
                [Op.between]: [startDate, endDate]
            };
        }

        // Total consultations by status
        const totalConsultations = await Consultation.count({ where: dateFilter });
        const pendingConsultations = await Consultation.count({
            where: { ...dateFilter, status: 'pending' }
        });
        const ongoingConsultations = await Consultation.count({
            where: { ...dateFilter, status: 'ongoing' }
        });
        const completedConsultations = await Consultation.count({
            where: { ...dateFilter, status: 'completed' }
        });
        const cancelledConsultations = await Consultation.count({
            where: { ...dateFilter, status: 'cancelled' }
        });

        // Consultations by type
        const videoConsultations = await Consultation.count({
            where: { ...dateFilter, consultationType: 'video' }
        });
        const inPersonConsultations = await Consultation.count({
            where: { ...dateFilter, consultationType: 'in-person' }
        });

        // Average consultation duration (for completed consultations)
        const completedConsultationsData = await Consultation.findAll({
            where: {
                ...dateFilter,
                status: 'completed',
                actualStartTime: { [Op.not]: null },
                actualEndTime: { [Op.not]: null }
            },
            attributes: ['actualStartTime', 'actualEndTime']
        });

        let totalDuration = 0;
        completedConsultationsData.forEach(consultation => {
            const start = new Date(consultation.actualStartTime);
            const end = new Date(consultation.actualEndTime);
            const durationMinutes = (end - start) / (1000 * 60);
            totalDuration += durationMinutes;
        });

        const averageDuration = completedConsultationsData.length > 0
            ? totalDuration / completedConsultationsData.length
            : 0;

        res.json({
            success: true,
            data: {
                totalConsultations,
                byStatus: {
                    pending: pendingConsultations,
                    ongoing: ongoingConsultations,
                    completed: completedConsultations,
                    cancelled: cancelledConsultations
                },
                byType: {
                    video: videoConsultations,
                    inPerson: inPersonConsultations
                },
                averageDurationMinutes: parseFloat(averageDuration.toFixed(2))
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching consultation statistics',
            error: error.message
        });
    }
};

// Update consultation status (cancel or reschedule)
exports.updateConsultationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelReason, scheduledDate, startTime, endTime } = req.body;

        const consultation = await Consultation.findByPk(id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }

        const updateData = { status };

        // If cancelling, add cancel reason and set cancelled by admin
        if (status === 'cancelled') {
            updateData.cancelReason = cancelReason || 'Cancelled by admin';
            updateData.cancelledBy = 'admin';
        }

        // If rescheduling, update date and time
        if (scheduledDate) updateData.scheduledDate = scheduledDate;
        if (startTime) updateData.startTime = startTime;
        if (endTime) updateData.endTime = endTime;

        await consultation.update(updateData);

        res.json({
            success: true,
            message: `Consultation ${status === 'cancelled' ? 'cancelled' : 'updated'} successfully`,
            data: consultation
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating consultation',
            error: error.message
        });
    }
};

// Generate consultation report
exports.generateConsultationReport = async (req, res) => {
    try {
        const { startDate, endDate, doctorId, format = 'json' } = req.query;

        const where = {};
        if (startDate && endDate) {
            where.scheduledDate = {
                [Op.between]: [startDate, endDate]
            };
        }
        if (doctorId) where.doctorId = doctorId;

        const consultations = await Consultation.findAll({
            where,
            include: [
                {
                    model: PatientIN,
                    as: 'patient',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: ['id', 'fullName', 'email']
                }
            ],
            order: [['scheduledDate', 'DESC']]
        });

        // Process data for report
        const reportData = consultations.map(consultation => {
            const data = consultation.toJSON();
            return {
                id: data.id,
                patientName: data.patient ? data.patient.name : 'N/A',
                doctorName: data.doctor ? data.doctor.fullName : 'N/A',
                date: data.scheduledDate,
                time: `${data.startTime} - ${data.endTime}`,
                status: data.status,
                type: data.consultationType,
                duration: data.actualStartTime && data.actualEndTime
                    ? ((new Date(data.actualEndTime) - new Date(data.actualStartTime)) / (1000 * 60)).toFixed(1) + ' mins'
                    : 'N/A'
            };
        });

        // If CSV format is requested, we would generate CSV here
        // For now, returning JSON
        res.json({
            success: true,
            data: {
                reportTitle: 'Consultation Report',
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
                generatedAt: new Date().toISOString(),
                totalConsultations: reportData.length,
                consultations: reportData
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error generating consultation report',
            error: error.message
        });
    }
};