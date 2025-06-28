const Prescription = require('../models/prescription.model');
const Consultation = require('../models/consultation.model');
const { DoctorPersonal } = require('../models/doctor.model');
const { Op } = require('sequelize');
const patientController = require('./patient.controller');

const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;

// Helper function to get patient data for display
const getPatientDataForDisplay = async (patientId, authToken = null) => {
  if (!ENABLE_PATIENT_MICROSERVICE) {
    const { PatientIN } = require('../models/patientIN.model');
    const patient = await PatientIN.findByPk(patientId);
    return patient ? {
      id: patient.id,
      name: patient.name,
      email: patient.email,
    } : {
      id: patientId,
      name: 'Unknown Patient',
      email: '',
    };
  }

  // For microservice mode, get data from external API
  try {
    const result = await patientController.getUserById(patientId, authToken);
    
    if (result.status && result.data) {
      const numericId = typeof result.data.id === 'string' 
        ? parseInt(result.data.id.replace('US', '')) 
        : parseInt(result.data.id);
      
      return {
        id: numericId,
        name: result.data.name,
        email: result.data.email,
      };
    }
    
    return {
      id: patientId,
      name: 'Unknown Patient',
      email: '',
    };
  } catch (error) {
    console.warn(`Failed to fetch patient data for ${patientId}:`, error.message);
    return {
      id: patientId,
      name: 'Unknown Patient',
      email: '',
    };
  }
};

// Get all prescriptions with filtering
exports.getAllPrescriptions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            doctorId,
            patientId,
            startDate,
            endDate,
            prescriptionType
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { isDeleted: false };

        // Apply filters if provided
        if (doctorId) where.doctorId = doctorId;
        if (patientId) where.patientId = patientId;
        if (prescriptionType) where.prescriptionType = prescriptionType;

        // Date range filter using consultation date
        const dateFilter = {};
        if (startDate || endDate) {
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
        }

        const { count, rows: prescriptionsData } = await Prescription.findAndCountAll({
            where,
            include: [
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: ['id', 'fullName', 'email']
                },
                {
                    model: Consultation,
                    as: 'consultation',
                    attributes: ['id', 'scheduledDate', 'status'],
                    where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        // Fetch patient data for each prescription
        const prescriptions = await Promise.all(
            prescriptionsData.map(async (prescription) => {
                const patientData = await getPatientDataForDisplay(prescription.patientId);
                return {
                    ...prescription.toJSON(),
                    patient: patientData,
                };
            })
        );

        res.json({
            success: true,
            data: {
                prescriptions,
                total: count,
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error fetching prescriptions',
            error: error.message
        });
    }
};

// Audit prescription patterns
exports.auditPrescriptionPatterns = async (req, res) => {
    try {
        const { startDate, endDate, doctorId } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
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
        }

        const where = { ...dateFilter, isDeleted: false };
        if (doctorId) where.doctorId = doctorId;

        // Get all prescriptions with custom prescriptions or medicines
        const prescriptions = await Prescription.findAll({
            where,
            attributes: ['id', 'doctorId', 'customPrescription', 'medicines', 'createdAt'],
            include: [
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: ['id', 'fullName']
                }
            ]
        });

        // Analyze medicine patterns
        const medicineFrequency = {};
        const doctorPrescriptionCounts = {};
        const doctorMedicineCounts = {};

        prescriptions.forEach(prescription => {
            const doctorId = prescription.doctorId;
            const doctorName = prescription.doctor ? prescription.doctor.fullName : `Doctor ${doctorId}`;

            // Initialize doctor counts if not exists
            if (!doctorPrescriptionCounts[doctorId]) {
                doctorPrescriptionCounts[doctorId] = {
                    name: doctorName,
                    count: 0
                };
            }

            if (!doctorMedicineCounts[doctorId]) {
                doctorMedicineCounts[doctorId] = {};
            }

            // Increment prescription count
            doctorPrescriptionCounts[doctorId].count++;

            // Process medicines if available
            if (prescription.medicines && Array.isArray(prescription.medicines)) {
                prescription.medicines.forEach(medicine => {
                    const medicineName = medicine.name;

                    // Update global medicine frequency
                    if (!medicineFrequency[medicineName]) {
                        medicineFrequency[medicineName] = 0;
                    }
                    medicineFrequency[medicineName]++;

                    // Update doctor-specific medicine count
                    if (!doctorMedicineCounts[doctorId][medicineName]) {
                        doctorMedicineCounts[doctorId][medicineName] = 0;
                    }
                    doctorMedicineCounts[doctorId][medicineName]++;
                });
            }
        });

        // Convert to sorted arrays for output
        const topMedicines = Object.entries(medicineFrequency)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const doctorStats = Object.values(doctorPrescriptionCounts)
            .sort((a, b) => b.count - a.count);

        // Process doctor medicine patterns
        const doctorMedicinePatterns = Object.entries(doctorMedicineCounts).map(([doctorId, medicines]) => {
            const doctorName = doctorPrescriptionCounts[doctorId].name;
            const topMedicines = Object.entries(medicines)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            return {
                doctorId,
                doctorName,
                topMedicines
            };
        });

        res.json({
            success: true,
            data: {
                totalPrescriptions: prescriptions.length,
                topMedicinesPrescribed: topMedicines,
                doctorPrescriptionCounts: doctorStats,
                doctorMedicinePatterns
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error analyzing prescription patterns',
            error: error.message
        });
    }
};

// Flag suspicious prescriptions
exports.flagSuspiciousPrescriptions = async (req, res) => {
    try {
        // This would typically involve complex logic to identify suspicious patterns
        // For demonstration, we'll use a simple approach based on frequency and combinations

        // Get all prescriptions from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const prescriptions = await Prescription.findAll({
            where: {
                createdAt: { [Op.gte]: thirtyDaysAgo },
                isDeleted: false
            },
            attributes: ['id', 'doctorId', 'patientId', 'medicines', 'createdAt'],
            include: [
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: ['id', 'fullName']
                },
                {
                    model: PatientIN,
                    as: 'patient',
                    attributes: ['id', 'name']
                }
            ]
        });

        // Define suspicious patterns (simplified example)
        const highRiskMedicines = ['oxycodone', 'fentanyl', 'morphine', 'hydrocodone'];
        const suspiciousCombinations = [
            ['alprazolam', 'oxycodone'],
            ['diazepam', 'oxycodone']
        ];

        // Check for suspicious patterns
        const flaggedPrescriptions = [];

        prescriptions.forEach(prescription => {
            if (!prescription.medicines || !Array.isArray(prescription.medicines)) {
                return;
            }

            const medicineNames = prescription.medicines.map(m => m.name.toLowerCase());
            let reason = '';

            // Check for high-risk medicines
            const highRiskFound = medicineNames.filter(med =>
                highRiskMedicines.includes(med)
            );

            if (highRiskFound.length > 0) {
                reason += `Contains high-risk medicines: ${highRiskFound.join(', ')}. `;
            }

            // Check for suspicious combinations
            for (const combo of suspiciousCombinations) {
                if (combo.every(med => medicineNames.includes(med.toLowerCase()))) {
                    reason += `Contains suspicious combination: ${combo.join(' + ')}. `;
                    break;
                }
            }

            // Check for high quantity
            const highQuantity = prescription.medicines.find(med =>
                med.quantity && parseInt(med.quantity) > 60
            );

            if (highQuantity) {
                reason += `High quantity prescribed: ${highQuantity.name} (${highQuantity.quantity}). `;
            }

            if (reason) {
                flaggedPrescriptions.push({
                    id: prescription.id,
                    doctor: prescription.doctor ? {
                        id: prescription.doctor.id,
                        name: prescription.doctor.fullName
                    } : 'Unknown',
                    patient: prescription.patient ? {
                        id: prescription.patient.id,
                        name: prescription.patient.name
                    } : 'Unknown',
                    date: prescription.createdAt,
                    medicines: prescription.medicines,
                    flagReason: reason.trim()
                });
            }
        });

        res.json({
            success: true,
            data: {
                totalFlagged: flaggedPrescriptions.length,
                flaggedPrescriptions
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error flagging suspicious prescriptions',
            error: error.message
        });
    }
};

// Generate prescription reports
exports.generatePrescriptionReport = async (req, res) => {
    try {
        const { startDate, endDate, doctorId, format = 'json' } = req.query;

        const where = { isDeleted: false };
        if (doctorId) where.doctorId = doctorId;

        // Date range filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const prescriptionsData = await Prescription.findAll({
            where,
            include: [
                {
                    model: DoctorPersonal,
                    as: 'doctor',
                    attributes: ['id', 'fullName']
                },
                {
                    model: Consultation,
                    as: 'consultation',
                    attributes: ['id', 'scheduledDate', 'status']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Fetch patient data for each prescription
        const prescriptions = await Promise.all(
            prescriptionsData.map(async (prescription) => {
                const patientData = await getPatientDataForDisplay(prescription.patientId);
                return {
                    ...prescription.toJSON(),
                    patient: patientData,
                };
            })
        );

        // Process data for report
        const reportData = prescriptions.map(prescription => {
            const data = prescription.toJSON();

            // Extract medicine information if available
            let medicinesList = 'No medicines listed';
            if (data.medicines && Array.isArray(data.medicines) && data.medicines.length > 0) {
                medicinesList = data.medicines.map(med => {
                    return `${med.name} ${med.dosage || ''} - ${med.frequency || 'as needed'} ${med.duration ? `for ${med.duration}` : ''}`;
                }).join('; ');
            } else if (data.customPrescription) {
                medicinesList = 'Custom prescription provided';
            }

            return {
                id: data.id,
                patientName: data.patient ? data.patient.name : 'N/A',
                doctorName: data.doctor ? data.doctor.fullName : 'N/A',
                date: new Date(data.createdAt).toISOString().split('T')[0],
                consultationDate: data.consultation ? data.consultation.scheduledDate : 'N/A',
                prescriptionType: data.prescriptionType,
                medicines: medicinesList,
                hasFile: !!data.prescriptionUrl
            };
        });

        // Calculate summary statistics
        const totalByType = {
            file: prescriptions.filter(p => p.prescriptionType === 'file').length,
            custom: prescriptions.filter(p => p.prescriptionType === 'custom').length
        };

        // If CSV format is requested, we would generate CSV here
        // For now, returning JSON
        res.json({
            success: true,
            data: {
                reportTitle: 'Prescription Report',
                dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
                generatedAt: new Date().toISOString(),
                totalPrescriptions: reportData.length,
                prescriptionsByType: totalByType,
                prescriptions: reportData
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error generating prescription report',
            error: error.message
        });
    }
};