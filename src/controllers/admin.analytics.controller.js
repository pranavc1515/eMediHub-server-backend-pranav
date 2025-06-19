const { PatientIN } = require('../models/patientIN.model');
const { DoctorPersonal, DoctorProfessional } = require('../models/doctor.model');
const Consultation = require('../models/consultation.model');
const Prescription = require('../models/prescription.model');
const { Op, Sequelize } = require('sequelize');

// Get patient demographics
exports.getPatientDemographics = async (req, res) => {
    try {
        // Get total patients count
        const totalPatients = await PatientIN.count();

        // Get gender distribution
        const genderDistribution = await PatientIN.findAll({
            attributes: [
                'gender',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: {
                gender: {
                    [Op.not]: null
                }
            },
            group: ['gender']
        });

        // Get age distribution
        const patientAges = await PatientIN.findAll({
            attributes: ['id', 'dob'],
            where: {
                dob: {
                    [Op.not]: null
                }
            }
        });

        // Calculate age groups
        const ageGroups = {
            'Under 18': 0,
            '18-30': 0,
            '31-45': 0,
            '46-60': 0,
            'Over 60': 0
        };

        patientAges.forEach(patient => {
            const birthDate = new Date(patient.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) ageGroups['Under 18']++;
            else if (age <= 30) ageGroups['18-30']++;
            else if (age <= 45) ageGroups['31-45']++;
            else if (age <= 60) ageGroups['46-60']++;
            else ageGroups['Over 60']++;
        });

        // Get registration trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const registrationTrend = await PatientIN.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'month'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: {
                createdAt: {
                    [Op.gte]: sixMonthsAgo
                }
            },
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'ASC']]
        });

        res.json({
            success: true,
            data: {
                totalPatients,
                genderDistribution,
                ageDistribution: Object.entries(ageGroups).map(([group, count]) => ({ group, count })),
                registrationTrend
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching patient demographics',
            error: error.message
        });
    }
};

// Get doctor performance metrics
exports.getDoctorPerformanceMetrics = async (req, res) => {
    try {
        const { doctorId, startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.scheduledDate = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            dateFilter.scheduledDate = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            dateFilter.scheduledDate = {
                [Op.lte]: endDate
            };
        }

        // Base doctor filter
        const doctorFilter = doctorId ? { id: doctorId } : {};

        // Get doctors with their consultation counts
        const doctors = await DoctorPersonal.findAll({
            where: doctorFilter,
            attributes: ['id', 'fullName', 'email'],
            include: [
                {
                    model: DoctorProfessional,
                    attributes: ['specialization']
                }
            ]
        });

        // Get performance metrics for each doctor
        const doctorMetrics = await Promise.all(doctors.map(async (doctor) => {
            // Total consultations
            const totalConsultations = await Consultation.count({
                where: {
                    doctorId: doctor.id,
                    ...dateFilter
                }
            });

            // Completed consultations
            const completedConsultations = await Consultation.count({
                where: {
                    doctorId: doctor.id,
                    status: 'completed',
                    ...dateFilter
                }
            });

            // Cancelled consultations
            const cancelledConsultations = await Consultation.count({
                where: {
                    doctorId: doctor.id,
                    status: 'cancelled',
                    ...dateFilter
                }
            });

            // Average consultation duration
            const consultationsWithDuration = await Consultation.findAll({
                where: {
                    doctorId: doctor.id,
                    status: 'completed',
                    actualStartTime: { [Op.not]: null },
                    actualEndTime: { [Op.not]: null },
                    ...dateFilter
                },
                attributes: ['actualStartTime', 'actualEndTime']
            });

            let totalDuration = 0;
            consultationsWithDuration.forEach(consultation => {
                const start = new Date(consultation.actualStartTime);
                const end = new Date(consultation.actualEndTime);
                const durationMinutes = (end - start) / (1000 * 60);
                totalDuration += durationMinutes;
            });

            const averageDuration = consultationsWithDuration.length > 0
                ? totalDuration / consultationsWithDuration.length
                : 0;

            // Prescriptions issued
            const prescriptionsIssued = await Prescription.count({
                where: {
                    doctorId: doctor.id,
                    createdAt: dateFilter.scheduledDate ? {
                        [Op.between]: [
                            new Date(dateFilter.scheduledDate[Op.gte] || dateFilter.scheduledDate[Op.between][0]),
                            new Date(dateFilter.scheduledDate[Op.lte] || dateFilter.scheduledDate[Op.between][1])
                        ]
                    } : undefined
                }
            });

            return {
                doctorId: doctor.id,
                doctorName: doctor.fullName,
                email: doctor.email,
                specialization: doctor.DoctorProfessional ? doctor.DoctorProfessional.specialization : 'Not specified',
                metrics: {
                    totalConsultations,
                    completedConsultations,
                    cancelledConsultations,
                    completionRate: totalConsultations > 0
                        ? parseFloat(((completedConsultations / totalConsultations) * 100).toFixed(1))
                        : 0,
                    averageDurationMinutes: parseFloat(averageDuration.toFixed(1)),
                    prescriptionsIssued
                }
            };
        }));

        res.json({
            success: true,
            data: {
                totalDoctors: doctors.length,
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
                doctorMetrics
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching doctor performance metrics',
            error: error.message
        });
    }
};

// Get system usage statistics
exports.getSystemUsageStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            dateFilter.createdAt = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            dateFilter.createdAt = {
                [Op.lte]: new Date(endDate)
            };
        }

        // Get daily active users (estimate based on consultations)
        const consultationDates = await Consultation.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('scheduledDate')), 'date'],
                [Sequelize.fn('COUNT', Sequelize.literal('DISTINCT patientId')), 'uniquePatients'],
                [Sequelize.fn('COUNT', Sequelize.literal('DISTINCT doctorId')), 'uniqueDoctors'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalConsultations']
            ],
            where: dateFilter.createdAt ? {
                scheduledDate: dateFilter.createdAt
            } : {},
            group: [Sequelize.fn('DATE', Sequelize.col('scheduledDate'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('scheduledDate')), 'ASC']]
        });

        // Calculate averages
        let totalDays = consultationDates.length;
        let totalPatients = 0;
        let totalDoctors = 0;
        let totalConsultations = 0;

        consultationDates.forEach(day => {
            totalPatients += parseInt(day.dataValues.uniquePatients);
            totalDoctors += parseInt(day.dataValues.uniqueDoctors);
            totalConsultations += parseInt(day.dataValues.totalConsultations);
        });

        const averageDailyPatients = totalDays > 0 ? (totalPatients / totalDays) : 0;
        const averageDailyDoctors = totalDays > 0 ? (totalDoctors / totalDays) : 0;
        const averageDailyConsultations = totalDays > 0 ? (totalConsultations / totalDays) : 0;

        // Get peak usage times
        const peakUsageTimes = await Consultation.findAll({
            attributes: [
                [Sequelize.fn('HOUR', Sequelize.col('startTime')), 'hour'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: dateFilter.createdAt ? {
                scheduledDate: dateFilter.createdAt
            } : {},
            group: [Sequelize.fn('HOUR', Sequelize.col('startTime'))],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 5
        });

        // Get consultation type distribution
        const consultationTypes = await Consultation.findAll({
            attributes: [
                'consultationType',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: dateFilter.createdAt ? {
                scheduledDate: dateFilter.createdAt
            } : {},
            group: ['consultationType']
        });

        res.json({
            success: true,
            data: {
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
                totalDays,
                averages: {
                    dailyActivePatients: parseFloat(averageDailyPatients.toFixed(1)),
                    dailyActiveDoctors: parseFloat(averageDailyDoctors.toFixed(1)),
                    dailyConsultations: parseFloat(averageDailyConsultations.toFixed(1))
                },
                peakUsageTimes: peakUsageTimes.map(time => ({
                    hour: time.dataValues.hour,
                    count: parseInt(time.dataValues.count)
                })),
                consultationTypeDistribution: consultationTypes.map(type => ({
                    type: type.consultationType,
                    count: parseInt(type.dataValues.count)
                })),
                dailyUsageTrend: consultationDates.map(day => ({
                    date: day.dataValues.date,
                    patients: parseInt(day.dataValues.uniquePatients),
                    doctors: parseInt(day.dataValues.uniqueDoctors),
                    consultations: parseInt(day.dataValues.totalConsultations)
                }))
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching system usage statistics',
            error: error.message
        });
    }
};

// Generate revenue reports
exports.generateRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        // Date filter
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.scheduledDate = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            dateFilter.scheduledDate = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            dateFilter.scheduledDate = {
                [Op.lte]: endDate
            };
        }

        // Determine grouping format
        let groupFormat;
        let orderField;

        switch (groupBy) {
            case 'month':
                groupFormat = '%Y-%m';
                orderField = 'month';
                break;
            case 'week':
                groupFormat = '%Y-%u';
                orderField = 'week';
                break;
            case 'day':
            default:
                groupFormat = '%Y-%m-%d';
                orderField = 'date';
        }

        // Get completed consultations with doctor fee information
        const completedConsultations = await Consultation.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('scheduledDate'), groupFormat), orderField],
                [Sequelize.fn('COUNT', Sequelize.col('Consultation.id')), 'consultationCount'],
                [Sequelize.fn('SUM', Sequelize.literal('IFNULL(DoctorProfessional.consultationFees, 0)')), 'totalFees']
            ],
            where: {
                ...dateFilter,
                status: 'completed'
            },
            include: [
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: [],
                    include: [
                        {
                            model: DoctorProfessional,
                            attributes: []
                        }
                    ]
                }
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('scheduledDate'), groupFormat)],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('scheduledDate'), groupFormat), 'ASC']]
        });

        // Calculate totals
        let totalConsultations = 0;
        let totalRevenue = 0;

        completedConsultations.forEach(item => {
            totalConsultations += parseInt(item.dataValues.consultationCount);
            totalRevenue += parseFloat(item.dataValues.totalFees);
        });

        // Get revenue by doctor specialization
        const revenueBySpecialization = await Consultation.findAll({
            attributes: [
                [Sequelize.col('doctor.DoctorProfessional.specialization'), 'specialization'],
                [Sequelize.fn('COUNT', Sequelize.col('Consultation.id')), 'consultationCount'],
                [Sequelize.fn('SUM', Sequelize.literal('IFNULL(doctor.DoctorProfessional.consultationFees, 0)')), 'totalFees']
            ],
            where: {
                ...dateFilter,
                status: 'completed'
            },
            include: [
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: [],
                    include: [
                        {
                            model: DoctorProfessional,
                            attributes: []
                        }
                    ]
                }
            ],
            group: ['doctor.DoctorProfessional.specialization'],
            order: [[Sequelize.literal('totalFees'), 'DESC']]
        });

        res.json({
            success: true,
            data: {
                reportTitle: 'Revenue Report',
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
                groupedBy: groupBy,
                summary: {
                    totalConsultations,
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    averageRevenuePerConsultation: totalConsultations > 0
                        ? parseFloat((totalRevenue / totalConsultations).toFixed(2))
                        : 0
                },
                revenueByPeriod: completedConsultations.map(item => ({
                    period: item.dataValues[orderField],
                    consultations: parseInt(item.dataValues.consultationCount),
                    revenue: parseFloat(item.dataValues.totalFees)
                })),
                revenueBySpecialization: revenueBySpecialization.map(item => ({
                    specialization: item.dataValues.specialization || 'Not Specified',
                    consultations: parseInt(item.dataValues.consultationCount),
                    revenue: parseFloat(item.dataValues.totalFees)
                }))
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error generating revenue report',
            error: error.message
        });
    }
}; 