const Consultation = require('../models/consultation.model');
const {
  DoctorPersonal,
  DoctorProfessional,
} = require('../models/doctor.model');
const { PatientIN, PatientINDetails } = require('../models/patientIN.model');
const { Op } = require('sequelize');
const {
  getDoctorSocketId,
  getPatientSocketId,
  // doctorSocketMap,
  // patientSocketMap,
} = require('../socket/socketHandlers');
const { io } = require('../socket/socket');
const PatientQueue = require('../models/patientQueue.model');

// start consultation from doctor side
const startConsultation = async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;

    // Validate input
    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId is required' });
    }
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }

    // Check if there's already an ongoing consultation
    const existingConsultation = await Consultation.findOne({
      where: {
        doctorId,
        patientId,
        status: 'ongoing',
      },
    });

    if (existingConsultation) {
      return res.status(200).json({
        message: 'Consultation already exists',
        action: 'rejoin',
        consultationId: existingConsultation.id,
        roomName: existingConsultation.roomName,
      });
    }

    // Find active patient in waiting queue
    const activePatient = await PatientQueue.findOne({
      where: { patientId, doctorId, status: 'waiting' },
    });

    if (!activePatient) {
      return res.status(404).json({
        error: 'No active patient found in waiting status for this doctor',
      });
    }

    // Create new consultation
    const consultation = await Consultation.create({
      patientId: activePatient.patientId,
      doctorId,
      scheduledDate: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 15 * 60000), // 15 minutes from now
      status: 'ongoing',
      consultationType: 'video',
      roomName: activePatient.roomName,
    });

    // Update patient queue status with position 0 for ongoing consultation
    await activePatient.update({
      status: 'in_consultation',
      consultationId: consultation.id,
      position: 0, // Set position to 0 for ongoing consultation
    });

    const payload = {
      consultationId: consultation.id,
      roomName: activePatient.roomName,
      doctorId,
      patientId: activePatient.patientId,
    };

    // Emit socket events if socket IDs available
    const patientSocketId = await getPatientSocketId(patientId);
    if (patientSocketId) {
      io.to(patientSocketId).emit('CONSULTATION_STARTED', payload);
    }

    const doctorSocketId = await getDoctorSocketId(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('CONSULTATION_STARTED', payload);
    }

    // Send success response
    return res.status(200).json({
      message: 'Consultation started successfully',
      consultationId: consultation.id,
      roomName: activePatient.roomName,
    });
  } catch (error) {
    console.error('Error in startConsultation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Start Next Consultation from doctor side
const NextConsultation = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: 'doctorId is required' });
    }

    const doctorSocketId = getDoctorSocketId(doctorId);
    if (!doctorSocketId) {
      return res.status(404).json({ message: 'Doctor socket not found' });
    }

    // Find next waiting patient
    const nextPatient = await PatientQueue.findOne({
      where: {
        doctorId,
        status: 'waiting',
      },
      order: [['position', 'ASC']],
    });

    if (!nextPatient) {
      return res.status(200).json({ message: 'No waiting patients' });
    }

    // Create consultation
    const consultation = await Consultation.create({
      patientId: nextPatient.patientId,
      doctorId,
      scheduledDate: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 15 * 60000),
      status: 'ongoing',
      consultationType: 'video',
      roomName: nextPatient.roomName,
    });

    // Update patient queue entry
    await nextPatient.update({
      status: 'in_consultation',
      consultationId: consultation.id,
    });

    // Notify the invited patient (optional, no INVITE_PATIENT used as per instruction)
    const patientSocketId = getPatientSocketId(nextPatient.patientId);
    if (patientSocketId) {
      io.to(patientSocketId).emit('CONSULTATION_STARTED', {
        consultationId: consultation.id,
        roomName: nextPatient.roomName,
      });
    }

    // Update positions for remaining patients
    await PatientQueue.increment('position', {
      where: {
        doctorId,
        status: 'waiting',
        position: { [Op.gt]: nextPatient.position },
      },
    });

    // Fetch updated queue
    const updatedQueue = await PatientQueue.findAll({
      where: {
        doctorId,
        status: 'waiting',
      },
    });

    // Notify remaining patients
    updatedQueue.forEach((patientEntry) => {
      const patientId =
        patientEntry.patientId ||
        (patientEntry.dataValues && patientEntry.dataValues.patientId);
      if (!patientId) return;

      const socketId = getPatientSocketId(patientId);
      if (socketId) {
        io.to(socketId).emit('POSITION_UPDATE', {
          position: patientEntry.position,
          estimatedWait: `${(patientEntry.position - 1) * 10} mins`,
        });
      }
    });

    return res.status(200).json({
      message: 'Consultation started successfully',
      consultationId: consultation.id,
      roomName: nextPatient.roomName,
    });
  } catch (error) {
    console.error('Error in startConsultation:', error);
    return res.status(500).json({ message: 'Failed to start consultation' });
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
        status: 'scheduled',
      },
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found or cannot be cancelled',
      });
    }

    // Update consultation status
    await consultation.update({
      status: 'cancelled',
      cancelReason,
      cancelledBy: 'patient',
    });

    res.status(200).json({
      success: true,
      message: 'Consultation cancelled successfully',
      data: consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling consultation',
      error: error.message,
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
        status: 'in-progress',
      },
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Active consultation not found',
      });
    }

    // Update consultation status
    await consultation.update({
      status: 'completed',
      notes: notes || consultation.notes,
      actualEndTime: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Consultation ended successfully',
      data: consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error ending consultation',
      error: error.message,
    });
  }
};

// Get consultation history for a doctor
const getDoctorConsultationHistory = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
      });
    }

    // Get total count for pagination
    const totalCount = await Consultation.count({
      where: {
        doctorId,
        status: {
          [Op.in]: ['completed', 'ongoing'],
        },
      },
    });

    // Get consultations with pagination
    const consultations = await Consultation.findAll({
      where: {
        doctorId,
        status: {
          [Op.in]: ['completed', 'ongoing'],
        },
      },
      include: [
        {
          model: PatientIN,
          as: 'patient',
          attributes: ['id', 'name', 'email', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    res.status(200).json({
      success: true,
      consultations,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      pageSize: limit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation history',
      error: error.message,
    });
  }
};

// Get consultation history for a patient
const getPatientConsultationHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    // Total count
    const totalCount = await Consultation.count({
      where: { patientId },
    });

    // Fetch consultations with doctor info
    const consultations = await Consultation.findAll({
      where: { patientId },
      include: [
        {
          model: DoctorPersonal,
          as: 'doctor', // Only if you aliased it like that, otherwise remove `as`
          attributes: ['id', 'fullName', 'email', 'profilePhoto', 'isOnline'],
          include: [
            {
              model: DoctorProfessional,
              attributes: ['specialization', 'yearsOfExperience'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
    });

    res.status(200).json({
      success: true,
      consultations,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      pageSize: limit,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient consultation history',
      error: error.message,
    });
  }
};

// Check consultation status and handle reconnection
const checkConsultationStatus = async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;

    if (!doctorId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Both doctorId and patientId are required',
      });
    }

    // Check for ongoing consultation
    const ongoingConsultation = await Consultation.findOne({
      where: {
        doctorId,
        patientId,
        status: 'ongoing',
      },
    });

    if (ongoingConsultation) {
      return res.status(200).json({
        success: true,
        status: 'ongoing',
        action: 'rejoin',
        consultationId: ongoingConsultation.id,
        roomName: ongoingConsultation.roomName,
        message: 'Ongoing consultation found - ready to rejoin',
      });
    }

    // Check for completed consultation
    const completedConsultation = await Consultation.findOne({
      where: {
        doctorId,
        patientId,
        status: 'completed',
      },
      order: [['updatedAt', 'DESC']],
    });

    if (completedConsultation) {
      return res.status(200).json({
        success: true,
        status: 'completed',
        action: 'ended',
        consultationId: completedConsultation.id,
        message: 'Consultation has ended',
      });
    }

    // Check queue status
    const queueEntry = await PatientQueue.findOne({
      where: {
        doctorId,
        patientId,
        status: ['waiting', 'in_consultation'],
      },
    });

    if (queueEntry) {
      return res.status(200).json({
        success: true,
        status: queueEntry.status,
        action: queueEntry.status === 'waiting' ? 'wait' : 'rejoin',
        position: queueEntry.position,
        roomName: queueEntry.roomName,
        consultationId: queueEntry.consultationId,
        estimatedWait:
          queueEntry.status === 'waiting'
            ? `${(queueEntry.position - 1) * 10} mins`
            : null,
        message:
          queueEntry.status === 'waiting'
            ? 'Patient is in queue'
            : 'Patient is in consultation',
      });
    }

    return res.status(200).json({
      success: true,
      status: 'none',
      action: 'none',
      message: 'No active consultation or queue entry found',
    });
  } catch (error) {
    console.error('Error in checkConsultationStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking consultation status',
      error: error.message,
    });
  }
};

// Rejoin consultation endpoint
const rejoinConsultation = async (req, res) => {
  try {
    const { consultationId, userId, userType } = req.body;

    if (!consultationId || !userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'consultationId, userId, and userType are required',
      });
    }

    const consultation = await Consultation.findOne({
      where: {
        id: consultationId,
        status: 'ongoing',
      },
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Active consultation not found or has ended',
        action: 'ended',
      });
    }

    // Verify user is part of this consultation
    if (
      (userType === 'doctor' && consultation.doctorId !== parseInt(userId)) ||
      (userType === 'patient' && consultation.patientId !== parseInt(userId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this consultation',
      });
    }

    // Emit socket events to notify other participant about reconnection
    const payload = {
      consultationId: consultation.id,
      roomName: consultation.roomName,
      doctorId: consultation.doctorId,
      patientId: consultation.patientId,
      action: 'participant_rejoined',
      rejoiner: userType,
    };

    if (userType === 'patient') {
      const doctorSocketId = getDoctorSocketId(consultation.doctorId);
      if (doctorSocketId) {
        io.to(doctorSocketId).emit('PARTICIPANT_REJOINED', payload);
      }
    } else {
      const patientSocketId = getPatientSocketId(consultation.patientId);
      if (patientSocketId) {
        io.to(patientSocketId).emit('PARTICIPANT_REJOINED', payload);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully rejoined consultation',
      consultationId: consultation.id,
      roomName: consultation.roomName,
      doctorId: consultation.doctorId,
      patientId: consultation.patientId,
    });
  } catch (error) {
    console.error('Error in rejoinConsultation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rejoining consultation',
      error: error.message,
    });
  }
};

module.exports = {
  startConsultation,
  NextConsultation,
  getDoctorConsultationHistory,
  getPatientConsultationHistory,
  cancelConsultation,
  endConsultation,
  checkConsultationStatus,
  rejoinConsultation,
};
