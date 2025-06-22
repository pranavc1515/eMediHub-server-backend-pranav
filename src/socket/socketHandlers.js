const PatientQueue = require('../models/patientQueue.model');
const Consultation = require('../models/consultation.model');
const { DoctorPersonal } = require('../models/doctor.model');
const { PatientIN } = require('../models/patientIN.model');
// const { startConsultation } = require('../controllers/consultation.controller');
const { Op } = require('sequelize');

const doctorSocketMap = new Map();
const patientSocketMap = new Map();

const getDoctorSocketId = (doctorId) => doctorSocketMap.get(doctorId);
const getPatientSocketId = (patientId) => patientSocketMap.get(patientId);

const setupVideoQueueSocket = (io) => {
  io.on('connection', (socket) => {
    const { userType, userId } = socket.handshake.query;

    if (userType === 'doctor' && userId) {
      doctorSocketMap.set(Number(userId), socket.id);
      console.log(`Doctor connected: ${userId}, socket: ${socket.id}`);
    }

    if (userType === 'patient' && userId) {
      patientSocketMap.set(Number(userId), socket.id);
      console.log(`Patient connected: ${userId}, socket: ${socket.id}`);
    }
    console.log('DoctorMap', doctorSocketMap);
    console.log('PatientMap', patientSocketMap);

    // Function to broadcast queue updates to all patients in queue
    const broadcastQueueUpdates = async (doctorId) => {
      try {
        const queueEntries = await PatientQueue.findAll({
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

        console.log(`Broadcasting queue updates for doctor ${doctorId}, ${queueEntries.length} entries`);

        // Notify each patient about their updated position
        queueEntries.forEach((entry, index) => {
          const patientSocketId = getPatientSocketId(entry.patientId);
          if (patientSocketId) {
            const positionData = {
              position: entry.position,
              estimatedWait: entry.status === 'in_consultation' 
                ? '0 mins' 
                : `${Math.max(0, (entry.position - 1) * 10)} mins`,
              status: entry.status,
              queueLength: queueEntries.filter(e => e.status === 'waiting').length,
              totalInQueue: queueEntries.length,
            };
            
            io.to(patientSocketId).emit('POSITION_UPDATE', positionData);
            console.log(`Position update sent to patient ${entry.patientId}:`, positionData);
          }
        });

        // Notify doctor about queue changes
        const doctorSocketId = getDoctorSocketId(doctorId);
        if (doctorSocketId) {
          io.to(doctorSocketId).emit('QUEUE_CHANGED', queueEntries);
          console.log(`Queue change notification sent to doctor ${doctorId}`);
        }
      } catch (error) {
        console.error('Error broadcasting queue updates:', error);
      }
    };

    // Helper function to recalculate and update queue positions
    const recalculateQueuePositions = async (doctorId) => {
      try {
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
      } catch (error) {
        console.error('Error recalculating queue positions:', error);
      }
    };

    // Doctor starts consultation with specific patient - NOW HANDLED BY REST API
    // socket.on('START_CONSULTATION', async (data) => {
    //   try {
    //     const { doctorId, patientId } = data;
    //     console.log(`Doctor ${doctorId} starting consultation with patient ${patientId}`);

    //     // Find the patient in queue
    //     const queueEntry = await PatientQueue.findOne({
    //       where: {
    //         doctorId,
    //         patientId,
    //         status: 'waiting',
    //       },
    //     });

    //     if (!queueEntry) {
    //       console.log(`Patient ${patientId} not found in waiting queue for doctor ${doctorId}`);
    //       return socket.emit('ERROR', { message: 'Patient not found in queue' });
    //     }

    //     // Create consultation
    //     const consultation = await Consultation.create({
    //       patientId: queueEntry.patientId,
    //       doctorId,
    //       scheduledDate: new Date(),
    //       startTime: new Date(),
    //       endTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
    //       status: 'ongoing',
    //       consultationType: 'video',
    //       roomName: queueEntry.roomName,
    //       actualStartTime: new Date(),
    //     });

    //     console.log(`Consultation ${consultation.id} created for patient ${patientId} and doctor ${doctorId}`);

    //     // Update queue entry to position 0 (in consultation)
    //     await queueEntry.update({
    //       status: 'in_consultation',
    //       position: 0,
    //       consultationId: consultation.id,
    //     });

    //     // Recalculate positions for remaining waiting patients
    //     await recalculateQueuePositions(doctorId);

    //     // Notify patient that consultation has started
    //     const patientSocketId = getPatientSocketId(patientId);
    //     if (patientSocketId) {
    //       const payload = {
    //         roomName: queueEntry.roomName,
    //         consultationId: consultation.id,
    //         doctorId,
    //         patientId,
    //       };
    //       io.to(patientSocketId).emit('CONSULTATION_STARTED', payload);
    //       console.log(`Consultation start notification sent to patient ${patientId}`);
    //     }

    //     // Broadcast queue updates to all patients and doctor
    //     await broadcastQueueUpdates(doctorId);

    //     console.log(`Consultation started successfully - ID: ${consultation.id}`);

    //   } catch (error) {
    //     console.error('Error in START_CONSULTATION:', error);
    //     socket.emit('ERROR', { message: 'Failed to start consultation' });
    //   }
    // });

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

        // Find and update queue entry
        const queueEntry = await PatientQueue.findOne({
          where: { consultationId }
        });

        if (queueEntry) {
          await queueEntry.update({ status: 'completed' });

          // Notify patient that consultation has ended
          const patientSocketId = getPatientSocketId(queueEntry.patientId);
          if (patientSocketId) {
            io.to(patientSocketId).emit('CONSULTATION_ENDED', {
              consultationId,
              message: 'Consultation has ended successfully'
            });
          }

          // Broadcast queue updates to remaining patients
          await broadcastQueueUpdates(queueEntry.doctorId);
        }

      } catch (error) {
        console.error('Error in END_CONSULTATION:', error);
        socket.emit('ERROR', { message: 'Failed to end consultation' });
      }
    });

    // Handle patient leaving queue
    socket.on('LEAVE_QUEUE', async (data) => {
      try {
        const { patientId, doctorId } = data;
        console.log(`Patient ${patientId} leaving queue for doctor ${doctorId}`);

        const queueEntry = await PatientQueue.findOne({
          where: {
            patientId,
            doctorId,
            status: 'waiting',
          },
        });

        if (!queueEntry) {
          console.log(`Queue entry not found for patient ${patientId} and doctor ${doctorId}`);
          return;
        }

        console.log(`Patient ${patientId} was at position ${queueEntry.position}`);

        // Update status to left
        await queueEntry.update({ status: 'left' });

        // Recalculate positions for remaining waiting patients
        await recalculateQueuePositions(doctorId);

        // Broadcast queue updates to all patients and doctor
        await broadcastQueueUpdates(doctorId);

        console.log(`Patient ${patientId} successfully left queue`);

      } catch (error) {
        console.error('Error in LEAVE_QUEUE:', error);
        socket.emit('ERROR', { message: 'Failed to leave queue' });
      }
    });

    // Join doctor's room for updates
    socket.on('SWITCH_DOCTOR_AVAILABILITY', async (data) => {
      const { doctorId, isAvailable } = data;

      try {
        const doctor = await DoctorPersonal.findByPk(doctorId);

        if (doctor) {
          doctor.isOnline = isAvailable ? 'available' : 'offline';
          await doctor.save();

          // Notify all patients linked to this doctor about status change
          // Find patients in queue for this doctor (waiting or in consultation)
          const patients = await PatientQueue.findAll({
            where: {
              doctorId,
              status: ['waiting', 'in_consultation'],
            },
            attributes: ['patientId'],
          });

          // Emit to each patient's socket
          patients.forEach(({ patientId }) => {
            const patientSocketId = getPatientSocketId(patientId);
            if (patientSocketId) {
              io.to(patientSocketId).emit('DOCTOR_STATUS_CHANGED', {
                doctorId,
                isOnline: doctor.isOnline,
              });
            }
          });

          console.log(
            `Doctor ${doctorId} availability updated to ${doctor.isOnline} and patients notified.`
          );
        } else {
          socket.emit('ERROR', { message: 'Doctor not found' });
        }
      } catch (error) {
        console.error('Error updating doctor availability:', error);
        socket.emit('ERROR', { message: 'Failed to update availability' });
      }
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

module.exports = {
  setupVideoQueueSocket,
  getDoctorSocketId,
  getPatientSocketId,
  patientSocketMap,
  doctorSocketMap,
};
