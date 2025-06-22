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

    console.log(`Doctor ${doctorId} attempting to start consultation with patient ${patientId}`);

    // Check if there's already an ongoing consultation
    const existingConsultation = await Consultation.findOne({
      where: {
        doctorId,
        patientId,
        status: 'ongoing',
      },
    });

    if (existingConsultation) {
      console.log(`Existing consultation found: ${existingConsultation.id}`);
      return res.status(200).json({
        success: true,
        message: 'Consultation already exists',
        action: 'rejoin',
        consultationId: existingConsultation.id,
        roomName: existingConsultation.roomName,
      });
    }

    // Find the patient in waiting queue
    const queueEntry = await PatientQueue.findOne({
      where: { 
        patientId, 
        doctorId, 
        status: 'waiting' 
      },
    });

    if (!queueEntry) {
      console.log(`No waiting queue entry found for patient ${patientId} with doctor ${doctorId}`);
      return res.status(404).json({
        success: false,
        error: 'No active patient found in waiting status for this doctor',
      });
    }

    console.log(`Found queue entry for patient ${patientId} at position ${queueEntry.position}`);

    // Create new consultation
    const consultation = await Consultation.create({
      patientId: queueEntry.patientId,
      doctorId,
      scheduledDate: new Date(),
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
      status: 'ongoing',
      consultationType: 'video',
      roomName: queueEntry.roomName,
      actualStartTime: new Date(),
    });

    console.log(`Created consultation ${consultation.id} for patient ${patientId} and doctor ${doctorId}`);

    // Update queue entry to position 0 (in consultation) and link to consultation
    await queueEntry.update({
      status: 'in_consultation',
      consultationId: consultation.id,
      position: 0, // Set position to 0 for ongoing consultation
    });

    // Import socket utilities
    const {
      getDoctorSocketId,
      getPatientSocketId,
    } = require('../socket/socketHandlers');
    const { io } = require('../socket/socket');

    // Recalculate positions for remaining waiting patients
    const waitingPatients = await PatientQueue.findAll({
      where: {
        doctorId,
        status: 'waiting',
      },
      order: [['createdAt', 'ASC']], // Order by creation time to maintain FIFO
    });

    // Update positions sequentially
    for (let i = 0; i < waitingPatients.length; i++) {
      await waitingPatients[i].update({ position: i + 1 });
    }

    console.log(`Queue positions recalculated for doctor ${doctorId}`);

    // Get updated queue for broadcasting
    const updatedQueue = await PatientQueue.findAll({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
      order: [['position', 'ASC']],
      include: [
        {
          model: PatientIN,
          as: 'patient',
          attributes: ['name', 'phone', 'email'],
        },
      ],
    });

    // Notify patient that consultation has started
    const patientSocketId = getPatientSocketId(patientId);
    if (patientSocketId) {
      const payload = {
        roomName: queueEntry.roomName,
        consultationId: consultation.id,
        doctorId,
        patientId,
      };
      io.to(patientSocketId).emit('CONSULTATION_STARTED', payload);
      console.log(`Consultation start notification sent to patient ${patientId}`);
    }

    // Notify doctor about queue changes
    const doctorSocketId = getDoctorSocketId(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
      console.log(`Queue change notification sent to doctor ${doctorId}`);
    }

    // Notify all patients in queue about position updates
    updatedQueue.forEach((entry) => {
      const patientSocketId = getPatientSocketId(entry.patientId);
      if (patientSocketId) {
        const positionData = {
          position: entry.position,
          estimatedWait: entry.status === 'in_consultation' 
            ? '0 mins' 
            : `${Math.max(0, (entry.position - 1) * 10)} mins`,
          status: entry.status,
          queueLength: updatedQueue.filter(e => e.status === 'waiting').length,
          totalInQueue: updatedQueue.length,
        };
        
        io.to(patientSocketId).emit('POSITION_UPDATE', positionData);
        console.log(`Position update sent to patient ${entry.patientId}:`, positionData);
      }
    });

    console.log(`Consultation started successfully - ID: ${consultation.id}`);

    // Send success response
    return res.status(200).json({
      success: true,
      message: 'Consultation started successfully',
      consultationId: consultation.id,
      roomName: queueEntry.roomName,
      doctorId,
      patientId: queueEntry.patientId,
    });
  } catch (error) {
    console.error('Error in startConsultation:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
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

    console.log(`Checking consultation status for doctor ${doctorId} and patient ${patientId}`);

    // Check for ongoing consultation first
    const ongoingConsultation = await Consultation.findOne({
      where: {
        doctorId,
        patientId,
        status: 'ongoing',
      },
    });

    if (ongoingConsultation) {
      console.log(`Found ongoing consultation ${ongoingConsultation.id}`);
      return res.status(200).json({
        success: true,
        status: 'ongoing',
        action: 'rejoin',
        consultationId: ongoingConsultation.id,
        roomName: ongoingConsultation.roomName,
        message: 'Ongoing consultation found - ready to rejoin',
      });
    }

    // Check for completed consultation (recent)
    const completedConsultation = await Consultation.findOne({
      where: {
        doctorId,
        patientId,
        status: 'completed',
        updatedAt: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
      order: [['updatedAt', 'DESC']],
    });

    if (completedConsultation) {
      console.log(`Found recently completed consultation ${completedConsultation.id}`);
      return res.status(200).json({
        success: true,
        status: 'completed',
        action: 'ended',
        consultationId: completedConsultation.id,
        message: 'Consultation has ended recently',
      });
    }

    // Check existing queue status
    const existingQueueEntry = await PatientQueue.findOne({
      where: {
        doctorId,
        patientId,
        status: ['waiting', 'in_consultation'],
      },
    });

    if (existingQueueEntry) {
      console.log(`Found existing queue entry with status: ${existingQueueEntry.status}`);
      return res.status(200).json({
        success: true,
        status: existingQueueEntry.status,
        action: existingQueueEntry.status === 'waiting' ? 'wait' : 'rejoin',
        position: existingQueueEntry.position,
        roomName: existingQueueEntry.roomName,
        consultationId: existingQueueEntry.consultationId,
        estimatedWait:
          existingQueueEntry.status === 'waiting'
            ? `${Math.max(0, (existingQueueEntry.position - 1) * 10)} mins`
            : null,
        message:
          existingQueueEntry.status === 'waiting'
            ? 'Patient is already in queue'
            : 'Patient is in consultation',
      });
    }

    // For patients calling from UserHomePage - automatically join queue
    // For doctors calling from DoctorHomePage - don't auto-join, just return status
    const userAgent = req.headers['user-agent'] || '';
    const isPatientRequest = req.body.autoJoin !== false; // Default to true for patient requests

    if (isPatientRequest) {
      // Auto-join logic for patients (existing code)
      const { v4: uuidv4 } = require('uuid');
      
      // Check if patient is already in queue with another doctor
      const existingQueueWithOtherDoctor = await PatientQueue.findOne({
        where: {
          patientId,
          doctorId: { [Op.ne]: doctorId },
          status: ['waiting', 'in_consultation'],
        },
      });

      if (existingQueueWithOtherDoctor) {
        return res.status(400).json({
          success: false,
          message: 'Patient is already in queue or consultation with another doctor',
          action: 'conflict',
        });
      }
      
      // Get the next available position for waiting patients
      const maxWaitingPosition = await PatientQueue.max('position', {
        where: {
          doctorId,
          status: 'waiting',
        },
      });

      const nextPosition = (maxWaitingPosition || 0) + 1;
      const roomName = `room-${uuidv4()}`;

      // Create new queue entry
      const queueEntry = await PatientQueue.create({
        doctorId,
        patientId,
        position: nextPosition,
        roomName,
        status: 'waiting',
      });

      console.log(`Patient ${patientId} automatically joined queue at position ${nextPosition}`);

      // Broadcast queue updates
      const { 
        getDoctorSocketId, 
        getPatientSocketId 
      } = require('../socket/socketHandlers');
      const { io } = require('../socket/socket');

      // Get updated queue for broadcasting
      const updatedQueue = await PatientQueue.findAll({
        where: {
          doctorId,
          status: ['waiting', 'in_consultation'],
        },
        order: [['position', 'ASC']],
        include: [
          {
            model: require('../models/patientIN.model').PatientIN,
            as: 'patient',
            attributes: ['name', 'phone', 'email'],
          },
        ],
      });

      // Notify doctor about queue change
      const doctorSocketId = getDoctorSocketId(doctorId);
      if (doctorSocketId) {
        io.to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
      }

      // Notify all patients in queue about position updates
      updatedQueue.forEach((entry) => {
        const patientSocketId = getPatientSocketId(entry.patientId);
        if (patientSocketId) {
          const positionData = {
            position: entry.position,
            estimatedWait: entry.status === 'in_consultation' 
              ? '0 mins' 
              : `${Math.max(0, (entry.position - 1) * 10)} mins`,
            status: entry.status,
            queueLength: updatedQueue.filter(e => e.status === 'waiting').length,
          };
          
          io.to(patientSocketId).emit('POSITION_UPDATE', positionData);
        }
      });

      return res.status(200).json({
        success: true,
        status: 'waiting',
        action: 'wait',
        position: queueEntry.position,
        roomName: queueEntry.roomName,
        estimatedWait: `${Math.max(0, (queueEntry.position - 1) * 10)} mins`,
        queueLength: updatedQueue.filter(e => e.status === 'waiting').length,
        message: 'Patient automatically joined queue',
      });
    } else {
      // Doctor request - just return status without auto-joining
      console.log(`No active consultation or queue entry found for doctor ${doctorId} and patient ${patientId}`);
      return res.status(200).json({
        success: true,
        status: 'none',
        action: 'none',
        message: 'No active consultation or queue entry found',
      });
    }
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
