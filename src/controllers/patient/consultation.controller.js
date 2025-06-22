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

// Get consultation history for a patient
const getConsultationHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: consultations } = await Consultation.findAndCountAll({
      where: {
        patientId,
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

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: consultations
    });
  } catch (error) {
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