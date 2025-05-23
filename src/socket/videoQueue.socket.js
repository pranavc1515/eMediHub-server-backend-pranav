const PatientQueue = require('../models/patientQueue.model');
const Consultation = require('../models/consultation.model');
const { DoctorPersonal } = require('../models/doctor.model');
const { PatientIN } = require('../models/patientIN.model');
const { Op } = require('sequelize');

const doctorSocketMap = new Map();
const patientSocketMap = new Map();

const getDoctorSocketId = (doctorId) => doctorSocketMap.get(doctorId);
const getPatientSocketId = (patientId) => patientSocketMap.get(patientId);

const setupVideoQueueSocket = (io) => {
  io.on('connection', (socket) => {
    const { userType, userId } = socket.handshake.query;

    if (userType === 'doctor' && userId) {
      doctorSocketMap.set(userId, socket.id);
      console.log(`Doctor connected: ${userId}, socket: ${socket.id}`);
    }

    if (userType === 'patient' && userId) {
      patientSocketMap.set(userId, socket.id);
      console.log(`Patient connected: ${userId}, socket: ${socket.id}`);
    }

    // Patient joins queue
    socket.on('PATIENT_JOIN_QUEUE', async (data) => {
      try {
        console.log('Doctor_MAP', doctorSocketMap);
        console.log('Patient_MAP', patientSocketMap);
        console.log('Patient has entered the queue, PLEASE CHECK', data);
        const { doctorId, patientId, roomName } = data;

        if (!doctorId || !patientId) {
          console.error('Missing required data', { doctorId, patientId });
          socket.emit('ERROR', { message: 'Missing doctor or patient ID' });
          return;
        }

        // Get patient data
        const patient = await PatientIN.findByPk(patientId);
        if (!patient) {
          console.error('Patient not found:', patientId);
          socket.emit('ERROR', { message: 'Patient not found' });
          return;
        }

        // Check if patient is already in queue (status waiting or in consultation)
        const existingEntry = await PatientQueue.findOne({
          where: {
            doctorId,
            patientId,
            status: ['waiting', 'in_consultation'],
          },
        });

        if (existingEntry) {
          // Patient already in queue — emit their current position
          socket.emit('QUEUE_POSITION_UPDATE', {
            position: existingEntry.position,
            estimatedWait: `${
              existingEntry.estimatedWaitTime ||
              (existingEntry.position - 1) * 15
            } mins`,
            message: 'You are already in the queue',
          });
          return;
        }

        // Get current queue count (for position assignment)
        const queueCount = await PatientQueue.count({
          where: {
            doctorId,
            status: ['waiting', 'in_consultation'],
          },
        });

        // Create queue entry
        const queueEntry = await PatientQueue.create(
          {
            doctorId,
            patientId,
            position: queueCount + 1,
            roomName,
            socketId: socket.id,
            // estimatedWaitTime: queueCount * 15, // 15 minutes per consultation
          },
          {
            hooks: true,
          }
        );

        // Notify patient of their position
        socket.emit('QUEUE_POSITION_UPDATE', {
          position: queueEntry.position,
          estimatedWait: `${queueEntry.position * 15} mins`,
        });

        // Send updated queue to doctor
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

        console.log(
          'Sending queue update to doctor:',
          `doctor-${doctorId}`,
          JSON.stringify(updatedQueue)
        );

        const doctorSocketId = getDoctorSocketId(doctorId);
        if (doctorSocketId) {
          io.to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
        }
      } catch (error) {
        console.error('Error in PATIENT_JOIN_QUEUE:', error);
        socket.emit('ERROR', { message: 'Failed to join queue' });
      }
    });

    // Doctor invites next patient
    socket.on('INVITE_NEXT_PATIENT', async (data) => {
      try {
        const { doctorId } = data;

        // Find next waiting patient
        const nextPatient = await PatientQueue.findOne({
          where: {
            doctorId,
            status: 'waiting',
          },
          order: [['position', 'ASC']],
        });

        if (!nextPatient) {
          return socket.emit('NO_WAITING_PATIENTS');
        }

        // Create consultation
        const consultation = await Consultation.create({
          patientId: nextPatient.patientId,
          doctorId,
          scheduledDate: new Date(),
          startTime: new Date(),
          endTime: new Date(Date.now() + 15 * 60000), // 15 minutes from now
          status: 'ongoing',
          consultationType: 'video',
          roomName: nextPatient.roomName,
          patientSocketId: nextPatient.socketId,
          doctorSocketId: socket.id,
          actualStartTime: new Date(),
        });

        // Update queue entry
        await nextPatient.update({
          status: 'in_consultation',
          consultationId: consultation.id,
        });

        // Notify patient to join call
        io.to(nextPatient.socketId).emit('INVITE_PATIENT', {
          roomName: nextPatient.roomName,
          consultationId: consultation.id,
        });

        // Update queue positions for remaining patients
        await PatientQueue.increment('position', {
          where: {
            doctorId,
            status: 'waiting',
            position: { [Op.gt]: nextPatient.position },
          },
        });

        // Notify other patients of updated positions
        const remainingQueue = await PatientQueue.findAll({
          where: {
            doctorId,
            status: 'waiting',
          },
        });

        remainingQueue.forEach((patient) => {
          io.to(patient.socketId).emit('QUEUE_POSITION_UPDATE', {
            position: patient.position,
            estimatedWait: `${(patient.position - 1) * 15} mins`,
          });
        });
      } catch (error) {
        console.error('Error in INVITE_NEXT_PATIENT:', error);
        socket.emit('ERROR', { message: 'Failed to invite next patient' });
      }
    });

    // Handle consultation end
    socket.on('END_CONSULTATION', async (data) => {
      try {
        const { consultationId } = data;

        const consultation = await Consultation.findByPk(consultationId);
        if (!consultation) return;

        // Update consultation
        await consultation.update({
          status: 'completed',
          actualEndTime: new Date(),
        });

        // Update queue entry
        await PatientQueue.update(
          { status: 'done' },
          { where: { consultationId } }
        );

        // Notify patient that consultation has ended
        io.to(consultation.patientSocketId).emit('CONSULTATION_ENDED');
      } catch (error) {
        console.error('Error in END_CONSULTATION:', error);
        socket.emit('ERROR', { message: 'Failed to end consultation' });
      }
    });

    // Handle patient leaving queue
    socket.on('LEAVE_QUEUE', async (data) => {
      try {
        const { patientId, doctorId } = data;

        const queueEntry = await PatientQueue.findOne({
          where: {
            patientId,
            doctorId,
            status: 'waiting',
          },
        });

        if (!queueEntry) return;

        // Update status to left
        await queueEntry.update({ status: 'left' });

        // Update positions for remaining patients
        await PatientQueue.increment('position', {
          where: {
            doctorId,
            status: 'waiting',
            position: { [Op.gt]: queueEntry.position },
          },
        });

        // Notify doctor of queue change
        const updatedQueue = await PatientQueue.findAll({
          where: {
            doctorId,
            status: ['waiting', 'in_consultation'],
          },
          include: [
            {
              model: 'Patient',
              as: 'patient',
              attributes: ['firstName', 'lastName'],
            },
          ],
          order: [['position', 'ASC']],
        });

        const doctorSocketId = getDoctorSocketId(doctorId);
        if (doctorSocketId) {
          io.to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
        }
      } catch (error) {
        console.error('Error in LEAVE_QUEUE:', error);
        socket.emit('ERROR', { message: 'Failed to leave queue' });
      }
    });

    // Join doctor's room for updates
    socket.on('JOIN_DOCTOR_ROOM', (data) => {
      const { doctorId } = data;
      console.log(`Doctor ${doctorId} joined room: doctor-${doctorId}`);
      socket.join(`doctor-${doctorId}`);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        for (const [doctorId, id] of doctorSocketMap.entries()) {
          if (id === socket.id) {
            doctorSocketMap.delete(doctorId);
            break;
          }
        }

        for (const [patientId, id] of patientSocketMap.entries()) {
          if (id === socket.id) {
            patientSocketMap.delete(patientId);
            break;
          }
        }
        // Update any active consultations
        await Consultation.update(
          { status: 'completed', actualEndTime: new Date() },
          {
            where: {
              [Op.or]: [
                { patientSocketId: socket.id },
                { doctorSocketId: socket.id },
              ],
              status: 'ongoing',
            },
          }
        );

        // Update queue if patient disconnects while waiting
        const queueEntry = await PatientQueue.findOne({
          where: {
            socketId: socket.id,
            status: ['waiting', 'in_consultation'],
          },
        });

        if (queueEntry) {
          await queueEntry.update({ status: 'left' });

          // Update remaining queue positions
          await PatientQueue.increment('position', {
            where: {
              doctorId: queueEntry.doctorId,
              status: 'waiting',
              position: { [Op.gt]: queueEntry.position },
            },
          });

          // Notify doctor of queue change
          const updatedQueue = await PatientQueue.findAll({
            where: {
              doctorId: queueEntry.doctorId,
              status: ['waiting', 'in_consultation'],
            },
            include: [
              {
                model: 'Patient',
                as: 'patient',
                attributes: ['firstName', 'lastName'],
              },
            ],
            order: [['position', 'ASC']],
          });

          io.to(`doctor-${queueEntry.doctorId}`).emit(
            'QUEUE_CHANGED',
            updatedQueue
          );
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
};

module.exports = setupVideoQueueSocket;
