const PatientQueue = require('../models/patientQueue.model');
const Consultation = require('../models/consultation.model');
const { Op } = require('sequelize');
const {
  getDoctorSocketId,
  getUserSocketId,
  getPatientSocketId, // Deprecated - use getUserSocketId
  doctorSocketMap,
  userSocketMap,
} = require('../socket/socketHandlers');
const { io } = require('../socket/socket');
const { v4: uuidv4 } = require('uuid');
const patientController = require('./patient.controller');

const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;

// Helper function to validate patient using external API and get patient data
const validatePatientAndGetData = async (
  patientId,
  userId = null,
  authToken = null
) => {
  if (!ENABLE_PATIENT_MICROSERVICE) {
    // For internal mode, check local database
    const { PatientIN } = require('../models/patientIN.model');
    const patient = await PatientIN.findByPk(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }
    return {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      status: 'Active', // Assume active for internal patients
    };
  }

  // For microservice mode, validate using external API or family API
  try {
    // If userId is provided and different from patientId, try family API first
    if (userId && parseInt(userId) !== parseInt(patientId)) {
      try {
        const {
          validateFamilyMembership,
          getFamilyMemberData,
        } = require('./family.controller');

        // Validate family relationship
        const isValidFamily = await validateFamilyMembership(
          userId,
          patientId,
          authToken
        );
        if (isValidFamily) {
          // Get family member data
          const familyData = await getFamilyMemberData(
            userId,
            patientId,
            authToken
          );
          if (familyData) {
            return {
              id: parseInt(patientId),
              name: familyData.name,
              phone: familyData.phone,
              email: familyData.email,
              status: 'Active', // Family members are considered active if in family tree
              gender: familyData.gender,
              dob: familyData.dob,
              isFamilyMember: true,
              relatedUserId: userId,
            };
          }
        }
      } catch (familyError) {
        console.warn(
          `Family validation failed for patient ${patientId} under user ${userId}:`,
          familyError.message
        );
        // Fall through to direct patient validation
      }
    }

    // Try direct patient validation
    const result = await patientController.getUserById(patientId, authToken);

    if (!result.status || result.status_code !== 200) {
      throw new Error('Patient not found in external service');
    }

    const patientData = result.data;

    // Check if patient status is Active
    if (patientData.status !== 'Active') {
      throw new Error(`Patient status is ${patientData.status}, not Active`);
    }

    // Convert US243 to 243 for internal use
    const numericId =
      typeof patientData.id === 'string'
        ? parseInt(patientData.id.replace('US', ''))
        : parseInt(patientData.id);

    return {
      id: numericId,
      originalId: patientData.id, // Keep original format for reference
      name: patientData.name,
      phone: patientData.phone,
      email: patientData.email,
      status: patientData.status,
      gender: patientData.gender,
      dob: patientData.dob,
      isPhoneVerify: patientData.isPhoneVerify,
      isEmailVerify: patientData.isEmailVerify,
      isFamilyMember: false,
    };
  } catch (error) {
    console.error(
      `Patient validation failed for ID ${patientId}:`,
      error.message
    );
    throw new Error(
      `Patient ${patientId} not found or not active in external service`
    );
  }
};

// Get patient queue for a specific doctor
const getPatientQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await PatientQueue.count({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
    });

    const queueData = await PatientQueue.findAll({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
      order: [['position', 'ASC']],
      offset,
      limit,
    });

    // Use patient data from table instead of external fetching
    const queue = queueData.map((entry) => {
      return {
        ...entry.toJSON(),
        patient: {
          name: entry.patientName,
          phone: entry.patientPhone,
        },
      };
    });

    const totalPages = Math.ceil(totalCount / limit);
    const validatedPage = page > totalPages ? 1 : page;

    res.status(200).json({
      success: true,
      data: {
        queue,
        totalCount,
        totalPages,
        currentPage: validatedPage,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error('Error in getPatientQueue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient queue',
      error: error.message,
    });
  }
};

const joinPatientQueue = async (req, res) => {
  try {
    const { doctorId, patientId, userId } = req.body;
    console.log(
      'Joining queue - Doctor:',
      doctorId,
      'Patient:',
      patientId,
      'User:',
      userId
    );

    if (!doctorId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing doctorId or patientId',
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId - required to identify platform user',
      });
    }

    // Validate patient and get patient data using external API (if microservice) or local DB
    const authToken = req.header('Authorization')?.replace('Bearer ', '');
    let patientData;
    try {
      patientData = await validatePatientAndGetData(
        patientId,
        userId,
        authToken
      );
      console.log(
        `Patient ${patientId} validated successfully for user ${userId}`
      );
    } catch (error) {
      console.error(`Patient validation failed: ${error.message}`);
      return res.status(404).json({
        success: false,
        message: 'Patient not found or not active',
        error: error.message,
      });
    }

    // Check if patient is already in an ongoing consultation with this doctor
    const ongoingConsultation = await Consultation.findOne({
      where: {
        patientId,
        doctorId,
        status: 'ongoing',
      },
    });

    if (ongoingConsultation) {
      // Patient is already in consultation - redirect to rejoin
      console.log(
        `Patient ${patientId} is already in ongoing consultation ${ongoingConsultation.id} with doctor ${doctorId}`
      );
      return res.status(200).json({
        success: true,
        message: 'Already in ongoing consultation',
        action: 'rejoin',
        consultationId: ongoingConsultation.id,
        roomName: ongoingConsultation.roomName,
        position: 0, // Position 0 for ongoing consultation
        status: 'ongoing',
      });
    }

    // Check if user is already in queue with ANY status (waiting or in_consultation) for this doctor
    const existingQueueEntry = await PatientQueue.findOne({
      where: {
        doctorId,
        userId, // Check by userId, not patientId, since one user might book for different patients
        status: ['waiting', 'in_consultation'],
      },
    });

    if (existingQueueEntry) {
      console.log(
        `User ${userId} already has queue entry for patient ${existingQueueEntry.patientId} with status: ${existingQueueEntry.status}`
      );

      // User already has an active queue entry
      if (existingQueueEntry.status === 'in_consultation') {
        return res.status(200).json({
          success: true,
          message: 'User is currently in consultation',
          action: 'in_consultation',
          consultationId: existingQueueEntry.consultationId,
          roomName: existingQueueEntry.roomName,
          position: 0,
          status: 'in_consultation',
          patientId: existingQueueEntry.patientId,
          userId: existingQueueEntry.userId,
        });
      } else {
        // User is waiting - return existing position
        const waitingCount = await PatientQueue.count({
          where: {
            doctorId,
            status: 'waiting',
          },
        });

        return res.status(200).json({
          success: true,
          message: 'Already in queue',
          action: 'wait',
          position: existingQueueEntry.position,
          roomName: existingQueueEntry.roomName,
          estimatedWait: `${Math.max(
            0,
            (existingQueueEntry.position - 1) * 10
          )} mins`,
          status: 'waiting',
          queueLength: waitingCount,
          patientId: existingQueueEntry.patientId,
          userId: existingQueueEntry.userId,
        });
      }
    }

    // Additional check: Prevent user from being in queue with multiple doctors simultaneously
    const existingQueueWithOtherDoctor = await PatientQueue.findOne({
      where: {
        userId, // Check by userId, not patientId
        doctorId: { [Op.ne]: doctorId }, // Different doctor
        status: ['waiting', 'in_consultation'],
      },
    });

    if (existingQueueWithOtherDoctor) {
      console.log(
        `User ${userId} is already in queue with doctor ${existingQueueWithOtherDoctor.doctorId} for patient ${existingQueueWithOtherDoctor.patientId}`
      );
      return res.status(400).json({
        success: false,
        message: 'User is already in queue or consultation with another doctor',
        action: 'conflict',
        conflictingDoctorId: existingQueueWithOtherDoctor.doctorId,
        conflictingPatientId: existingQueueWithOtherDoctor.patientId,
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

    // Create new queue entry with patient name and phone
    const queueEntry = await PatientQueue.create({
      doctorId,
      userId,
      patientId,
      patientName: patientData.name,
      patientPhone: patientData.phone,
      position: nextPosition,
      roomName,
      status: 'waiting',
    });

    console.log(
      `User ${userId} joined queue for patient ${patientId} at position ${nextPosition} for doctor ${doctorId}`
    );

    // Get updated queue count
    const queueLength = await PatientQueue.count({
      where: {
        doctorId,
        status: 'waiting',
      },
    });

    // Broadcast queue updates to all patients and doctor
    await broadcastQueueUpdates(doctorId);

    return res.status(200).json({
      success: true,
      message: 'User joined the queue successfully',
      action: 'joined',
      position: queueEntry.position,
      roomName,
      estimatedWait: `${Math.max(0, (queueEntry.position - 1) * 10)} mins`,
      status: 'waiting',
      queueLength,
      patientId,
      userId,
    });
  } catch (error) {
    console.error('Error in joinPatientQueue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join queue',
      error: error.message,
    });
  }
};

// Helper function to broadcast queue updates
const broadcastQueueUpdates = async (doctorId) => {
  try {
    const updatedQueueData = await PatientQueue.findAll({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
      order: [['position', 'ASC']],
    });

    // Use patient data from table instead of external fetching
    const updatedQueue = updatedQueueData.map((entry) => {
      return {
        ...entry.toJSON(),
        patient: {
          name: entry.patientName,
          phone: entry.patientPhone,
        },
      };
    });

    // Notify doctor through socket
    const doctorSocketId = getDoctorSocketId(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
      console.log(`Queue update sent to doctor ${doctorId}`);
    }

    // Notify all users about their position
    updatedQueue.forEach((entry) => {
      const userSocketId = getUserSocketId(entry.userId);
      if (userSocketId) {
        const positionData = {
          position: entry.position,
          estimatedWait:
            entry.status === 'in_consultation'
              ? '0 mins'
              : `${Math.max(0, (entry.position - 1) * 10)} mins`,
          status: entry.status,
          queueLength: updatedQueue.filter((e) => e.status === 'waiting')
            .length,
          patientId: entry.patientId,
          userId: entry.userId,
        };

        io.to(userSocketId).emit('POSITION_UPDATE', positionData);
        console.log(
          `Position update sent to user ${entry.userId} for patient ${entry.patientId}:`,
          positionData
        );
      }
    });
  } catch (error) {
    console.error('Error broadcasting queue updates:', error);
  }
};

// Leave patient queue
const leavePatientQueue = async (req, res) => {
  try {
    const { patientId, doctorId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId - required to identify platform user',
      });
    }

    const queueEntry = await PatientQueue.findOne({
      where: {
        userId, // Use userId to find the queue entry
        doctorId,
        status: 'waiting',
      },
    });

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found',
      });
    }

    // Update status to left
    await queueEntry.update({ status: 'left' });

    // Update positions for remaining patients
    await PatientQueue.decrement('position', {
      where: {
        doctorId,
        status: 'waiting',
        position: { [Op.gt]: queueEntry.position },
      },
    });

    // Get updated queue to notify doctor
    const updatedQueueData = await PatientQueue.findAll({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
      order: [['position', 'ASC']],
    });

    // Use patient data from table instead of external fetching
    const updatedQueue = updatedQueueData.map((entry) => {
      return {
        ...entry.toJSON(),
        patient: {
          name: entry.patientName,
          phone: entry.patientPhone,
        },
      };
    });

    // Notify doctor through socket
    const doctorSocketId = getDoctorSocketId(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
    }

    // Notify patients
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
    res.status(200).json({
      success: true,
      message: 'Successfully left the queue',
      data: updatedQueue,
    });
  } catch (error) {
    console.error('Error in leavePatientQueue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave queue',
      error: error.message,
    });
  }
};

module.exports = {
  getPatientQueue,
  leavePatientQueue,
  joinPatientQueue,
};
