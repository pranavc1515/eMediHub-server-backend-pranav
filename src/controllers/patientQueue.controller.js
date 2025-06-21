const PatientQueue = require('../models/patientQueue.model');
const { PatientIN, PatientINDetails } = require('../models/patientIN.model');
const Consultation = require('../models/consultation.model');
const { Op } = require('sequelize');
const {
  getDoctorSocketId,
  getPatientSocketId,
  doctorSocketMap,
  patientSocketMap,
} = require('../socket/socketHandlers');
const { io } = require('../socket/socket');
const { v4: uuidv4 } = require('uuid');

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

    const queue = await PatientQueue.findAll({
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
          include: [
            {
              model: PatientINDetails,
              as: 'details',
              attributes: ['height', 'weight', 'diet', 'blood_group'],
            },
          ],
        },
      ],
      offset,
      limit,
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
    const { doctorId, patientId } = req.body;
    console.log('Doctor_MAP', doctorSocketMap);
    console.log('Patient_MAP', patientSocketMap);

    if (!doctorId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Missing doctorId or patientId',
      });
    }

    // Get patient data
    const patient = await PatientIN.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Check if patient is already in an ongoing consultation with this doctor
    const ongoingConsultation = await Consultation.findOne({
      where: {
        patientId,
        doctorId,
        status: 'ongoing',
      },
      include: [
        {
          model: PatientQueue,
          as: 'queue',
          required: false,
        },
      ],
    });

    if (ongoingConsultation) {
      // Patient is already in consultation - redirect to rejoin
      return res.status(200).json({
        success: true,
        message: 'Already in consultation',
        action: 'rejoin',
        consultationId: ongoingConsultation.id,
        roomName: ongoingConsultation.roomName,
        position: 0, // Position 0 for ongoing consultation
      });
    }

    // Check if patient is already in queue with status 'in_consultation'
    const existingInConsultation = await PatientQueue.findOne({
      where: {
        doctorId,
        patientId,
        status: 'in_consultation',
      },
    });

    if (existingInConsultation) {
      // Patient is in consultation - cannot join queue again
      return res.status(400).json({
        success: false,
        message: 'Patient is currently in consultation and cannot join queue',
        action: 'in_consultation',
        consultationId: existingInConsultation.consultationId,
        roomName: existingInConsultation.roomName,
        position: 0,
      });
    }

    // Check if patient is already in queue with status 'waiting'
    const existingWaiting = await PatientQueue.findOne({
      where: {
        doctorId,
        patientId,
        status: 'waiting',
      },
    });

    if (existingWaiting) {
      return res.status(200).json({
        success: true,
        message: 'Already in queue',
        action: 'waiting',
        position: existingWaiting.position,
        roomName: existingWaiting.roomName,
        estimatedWait: `${
          existingWaiting.estimatedWaitTime ||
          (existingWaiting.position - 1) * 15
        } mins`,
      });
    }

    const queueCount = await PatientQueue.count({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
    });

    const roomName = `room-${uuidv4()}`;

    // Create new queue entry
    const queueEntry = await PatientQueue.create({
      doctorId,
      patientId,
      position: queueCount + 1,
      roomName,
      socketId: null,
      status: 'waiting',
    });

    const updatedQueue = await PatientQueue.findAll({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
      order: [['position', 'ASC']],
      attributes: ['id', 'position', 'status', 'patientId', 'roomName'],
      include: [
        {
          model: PatientIN,
          as: 'patient',
          attributes: ['name'],
        },
      ],
    });
    
    // Notify doctor through socket
    const doctorSocketId = getDoctorSocketId(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
    }

    return res.status(200).json({
      success: true,
      message: 'Patient joined the queue',
      action: 'joined',
      position: queueEntry.position,
      roomName,
      estimatedWait: `${queueEntry.position * 10} mins`,
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

// Leave patient queue
const leavePatientQueue = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;

    const queueEntry = await PatientQueue.findOne({
      where: {
        patientId,
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
    const updatedQueue = await PatientQueue.findAll({
      where: {
        doctorId,
        status: ['waiting', 'in_consultation'],
      },
      include: [
        {
          model: PatientIN, // Use model reference, not string
          as: 'patient', // Alias must match your association
          attributes: ['name', 'phone', 'email'], // Adjust attributes as needed
          include: [
            {
              model: PatientINDetails,
              as: 'details',
              attributes: ['height', 'weight', 'diet', 'blood_group'], // Optional
            },
          ],
        },
      ],
      order: [['position', 'ASC']],
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
