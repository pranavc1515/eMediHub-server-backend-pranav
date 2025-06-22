const Consultation = require('../../models/consultation.model');
const Patient = require('../../models/patient.model');
const { Op } = require('sequelize');

// Fetch all patients in current queue
const getConsultationQueue = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const currentDate = new Date();
    
    const consultations = await Consultation.findAll({
      where: {
        doctorId,
        status: 'scheduled',
        scheduledDate: currentDate.toISOString().split('T')[0],
        startTime: {
          [Op.lte]: currentDate.toTimeString().split(' ')[0]
        },
        endTime: {
          [Op.gte]: currentDate.toTimeString().split(' ')[0]
        }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'profilePicture']
        }
      ],
      order: [
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
      message: 'Error fetching consultation queue',
      error: error.message
    });
  }
};

// Start consultation for patient
const startConsultation = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    
    // Find the consultation
    const consultation = await Consultation.findOne({
      where: {
        id,
        doctorId,
        status: 'scheduled'
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'profilePicture']
        }
      ]
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found or cannot be started'
      });
    }

    // Check if there's already an active consultation
    const activeConsultation = await Consultation.findOne({
      where: {
        doctorId,
        status: 'in-progress'
      }
    });

    if (activeConsultation) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a new consultation while another one is in progress',
        activeConsultation
      });
    }

    // Update consultation status
    await consultation.update({
      status: 'in-progress',
      actualStartTime: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Consultation started successfully',
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting consultation',
      error: error.message
    });
  }
};

// End consultation
const endConsultation = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const { notes } = req.body;
    
    // Find the consultation
    const consultation = await Consultation.findOne({
      where: {
        id,
        doctorId,
        status: 'in-progress'
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Active consultation not found'
      });
    }

    // Update consultation status
    await consultation.update({
      status: 'completed',
      notes: notes || consultation.notes,
      actualEndTime: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Consultation ended successfully',
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error ending consultation',
      error: error.message
    });
  }
};

// Get currently active consultation
const getCurrentConsultation = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    const consultation = await Consultation.findOne({
      where: {
        doctorId,
        status: 'in-progress'
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'profilePicture', 'email', 'phoneNumber']
        }
      ]
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'No active consultation found'
      });
    }

    res.status(200).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching current consultation',
      error: error.message
    });
  }
};

// Get consultation history for a doctor
const getConsultationHistory = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: consultations } = await Consultation.findAndCountAll({
      where: {
        doctorId,
        status: {
          [Op.in]: ['completed', 'cancelled']
        }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'profilePicture']
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

module.exports = {
  getConsultationQueue,
  startConsultation,
  endConsultation,
  getCurrentConsultation,
  getConsultationHistory
}; 