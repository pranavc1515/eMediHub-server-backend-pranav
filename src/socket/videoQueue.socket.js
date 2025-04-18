const PatientQueue = require('../models/patientQueue.model');
const Consultation = require('../models/consultation.model');
const { DoctorPersonal } = require('../models/doctor.model');
const { Op } = require('sequelize');

const setupVideoQueueSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Patient joins queue
    socket.on('PATIENT_JOIN_QUEUE', async (data) => {
      try {
        const { doctorId, patientId, roomName } = data;

        // Get current queue position
        const queueCount = await PatientQueue.count({
          where: {
            doctorId,
            status: ['waiting', 'in_consultation']
          }
        });

        // Create queue entry
        const queueEntry = await PatientQueue.create({
          doctorId,
          patientId,
          position: queueCount + 1,
          roomName,
          socketId: socket.id,
          estimatedWaitTime: queueCount * 15 // 15 minutes per consultation
        });

        // Notify patient of their position
        socket.emit('QUEUE_POSITION_UPDATE', {
          position: queueEntry.position,
          estimatedWait: `${queueEntry.estimatedWaitTime} mins`
        });

        // Notify doctor of queue change
        const updatedQueue = await PatientQueue.findAll({
          where: {
            doctorId,
            status: ['waiting', 'in_consultation']
          },
          include: [
            {
              model: 'Patient',
              as: 'patient',
              attributes: ['firstName', 'lastName']
            }
          ],
          order: [['position', 'ASC']]
        });

        io.to(`doctor-${doctorId}`).emit('QUEUE_CHANGED', updatedQueue);
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
            status: 'waiting'
          },
          order: [['position', 'ASC']]
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
          actualStartTime: new Date()
        });

        // Update queue entry
        await nextPatient.update({
          status: 'in_consultation',
          consultationId: consultation.id
        });

        // Notify patient to join call
        io.to(nextPatient.socketId).emit('INVITE_PATIENT', {
          roomName: nextPatient.roomName,
          consultationId: consultation.id
        });

        // Update queue positions for remaining patients
        await PatientQueue.increment('position', {
          where: {
            doctorId,
            status: 'waiting',
            position: { [Op.gt]: nextPatient.position }
          }
        });

        // Notify other patients of updated positions
        const remainingQueue = await PatientQueue.findAll({
          where: {
            doctorId,
            status: 'waiting'
          }
        });

        remainingQueue.forEach(patient => {
          io.to(patient.socketId).emit('QUEUE_POSITION_UPDATE', {
            position: patient.position,
            estimatedWait: `${(patient.position - 1) * 15} mins`
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
          actualEndTime: new Date()
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
            status: 'waiting'
          }
        });

        if (!queueEntry) return;

        // Update status to left
        await queueEntry.update({ status: 'left' });

        // Update positions for remaining patients
        await PatientQueue.increment('position', {
          where: {
            doctorId,
            status: 'waiting',
            position: { [Op.gt]: queueEntry.position }
          }
        });

        // Notify doctor of queue change
        const updatedQueue = await PatientQueue.findAll({
          where: {
            doctorId,
            status: ['waiting', 'in_consultation']
          },
          include: [
            {
              model: 'Patient',
              as: 'patient',
              attributes: ['firstName', 'lastName']
            }
          ],
          order: [['position', 'ASC']]
        });

        io.to(`doctor-${doctorId}`).emit('QUEUE_CHANGED', updatedQueue);

      } catch (error) {
        console.error('Error in LEAVE_QUEUE:', error);
        socket.emit('ERROR', { message: 'Failed to leave queue' });
      }
    });

    // Join doctor's room for updates
    socket.on('JOIN_DOCTOR_ROOM', (data) => {
      const { doctorId } = data;
      socket.join(`doctor-${doctorId}`);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Update any active consultations
        await Consultation.update(
          { status: 'completed', actualEndTime: new Date() },
          {
            where: {
              [Op.or]: [
                { patientSocketId: socket.id },
                { doctorSocketId: socket.id }
              ],
              status: 'ongoing'
            }
          }
        );

        // Update queue if patient disconnects while waiting
        const queueEntry = await PatientQueue.findOne({
          where: {
            socketId: socket.id,
            status: ['waiting', 'in_consultation']
          }
        });

        if (queueEntry) {
          await queueEntry.update({ status: 'left' });
          
          // Update remaining queue positions
          await PatientQueue.increment('position', {
            where: {
              doctorId: queueEntry.doctorId,
              status: 'waiting',
              position: { [Op.gt]: queueEntry.position }
            }
          });

          // Notify doctor of queue change
          const updatedQueue = await PatientQueue.findAll({
            where: {
              doctorId: queueEntry.doctorId,
              status: ['waiting', 'in_consultation']
            },
            include: [
              {
                model: 'Patient',
                as: 'patient',
                attributes: ['firstName', 'lastName']
              }
            ],
            order: [['position', 'ASC']]
          });

          io.to(`doctor-${queueEntry.doctorId}`).emit('QUEUE_CHANGED', updatedQueue);
        }

      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
};

module.exports = setupVideoQueueSocket; 