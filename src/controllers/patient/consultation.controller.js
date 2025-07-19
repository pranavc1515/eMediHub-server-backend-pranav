const Consultation = require('../../models/consultation.model');
const { DoctorPersonal } = require('../../models/doctor.model');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Book a consultation with a doctor
const bookConsultation = async (req, res) => {
  try {
    const { doctorId, scheduledDate, startTime, endTime, notes } = req.body;
    const patientId = req.user.id;

    // Validate required fields
    if (!doctorId || !scheduledDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorId, scheduledDate, startTime, and endTime are required'
      });
    }

    // Check if doctor exists
    const doctor = await DoctorPersonal.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Generate a unique room name for the video consultation
    const roomName = `consultation-${uuidv4()}`;

    // Create consultation
    const consultation = await Consultation.create({
      patientId,
      doctorId,
      scheduledDate,
      startTime,
      endTime,
      status: 'scheduled',
      consultationType: 'video',
      roomName,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully',
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error booking consultation',
      error: error.message
    });
  }
};

// Get upcoming consultations for a patient
const getUpcomingConsultations = async (req, res) => {
  try {
    const patientId = req.user.id;
    const currentDate = new Date();
    
    const consultations = await Consultation.findAll({
      where: {
        patientId,
        status: {
          [Op.in]: ['scheduled', 'in-progress']
        },
        [Op.or]: [
          {
            scheduledDate: {
              [Op.gt]: currentDate.toISOString().split('T')[0]
            }
          },
          {
            scheduledDate: currentDate.toISOString().split('T')[0],
            startTime: {
              [Op.gte]: currentDate.toTimeString().split(' ')[0]
            }
          }
        ]
      },
      include: [
        {
          model: DoctorPersonal,
          as: 'doctor',
          attributes: ['id', 'fullName', 'specialization', 'profilePhoto']
        }
      ],
      order: [
        ['scheduledDate', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming consultations',
      error: error.message
    });
  }
};

// Get consultation history for a patient and their family members
const getConsultationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get authorization token for family API calls
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Get all patient IDs (user + family members)
    let patientIds = [userId]; // Start with the user themselves
    
    try {
      // Import family controller functions
      const { getFamilyTreeData } = require('../family.controller');
      
      // Get family tree data
      const familyData = await getFamilyTreeData(userId, token);
      
      if (familyData && familyData.data && familyData.data.familyTree) {
        // Extract all family member IDs recursively
        const extractFamilyMemberIds = (familyTree) => {
          const ids = [];
          for (const member of familyTree) {
            // Add member ID if it's different from the main user
            if (parseInt(member.id) !== parseInt(userId)) {
              ids.push(parseInt(member.id));
            }
            
            // Check children recursively if they exist
            if (member.children && member.children.length > 0) {
              ids.push(...extractFamilyMemberIds(member.children));
            }
            
            // Check relatives if they exist
            if (member.relatives && member.relatives.length > 0) {
              ids.push(...extractFamilyMemberIds(member.relatives));
            }
          }
          return ids;
        };
        
        const familyMemberIds = extractFamilyMemberIds(familyData.data.familyTree);
        patientIds = [...patientIds, ...familyMemberIds];
        
        console.log(`Found ${familyMemberIds.length} family members for user ${userId}`);
      }
    } catch (familyError) {
      console.warn(`Failed to fetch family members for user ${userId}:`, familyError.message);
      // Continue with just the user's own consultations
    }
    
    // Remove duplicates and ensure all IDs are numbers
    patientIds = [...new Set(patientIds.map(id => parseInt(id)))];
    
    console.log(`Fetching consultation history for patient IDs: ${patientIds.join(', ')}`);
    
    const { count, rows: consultations } = await Consultation.findAndCountAll({
      where: {
        patientId: {
          [Op.in]: patientIds
        },
        status: {
          [Op.in]: ['completed', 'cancelled']
        }
      },
      include: [
        {
          model: DoctorPersonal,
          as: 'doctor',
          attributes: ['id', 'fullName', 'specialization', 'profilePhoto']
        }
      ],
      order: [
        ['updatedAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add patient info to each consultation to indicate who the consultation was for
    const consultationsWithPatientInfo = consultations.map(consultation => {
      const isOwnConsultation = parseInt(consultation.patientId) === parseInt(userId);
      return {
        ...consultation.toJSON(),
        isOwnConsultation,
        patientType: isOwnConsultation ? 'self' : 'family_member'
      };
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      includedPatientIds: patientIds,
      data: consultationsWithPatientInfo
    });
  } catch (error) {
    console.error('Error fetching consultation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation history',
      error: error.message
    });
  }
};

// Get details of a specific consultation
const getConsultationDetails = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    
    const consultation = await Consultation.findOne({
      where: {
        id,
        patientId
      },
      include: [
        {
          model: DoctorPersonal,
          as: 'doctor',
          attributes: ['id', 'fullName', 'specialization', 'profilePhoto', 'email', 'phoneNumber']
        }
      ]
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation details',
      error: error.message
    });
  }
};

// Cancel an upcoming consultation
const cancelConsultation = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { cancelReason } = req.body;
    
    const consultation = await Consultation.findOne({
      where: {
        id,
        patientId,
        status: 'scheduled'
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found or cannot be cancelled'
      });
    }

    // Update consultation status
    await consultation.update({
      status: 'cancelled',
      cancelReason,
      cancelledBy: 'patient'
    });

    res.status(200).json({
      success: true,
      message: 'Consultation cancelled successfully',
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling consultation',
      error: error.message
    });
  }
};

module.exports = {
  bookConsultation,
  getUpcomingConsultations,
  getConsultationHistory,
  getConsultationDetails,
  cancelConsultation
}; 