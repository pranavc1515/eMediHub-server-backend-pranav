const PatientQueue = require('../models/patientQueue.model');
const { Op } = require('sequelize');
const { getDoctorSocketId } = require('../socket/videoQueue.socket');

// Get patient queue for a specific doctor
const getPatientQueue = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const queue = await PatientQueue.findAll({
            where: {
                doctorId,
                status: ['waiting', 'in_consultation']
            },
            order: [['position', 'ASC']],
            include: [
                {
                    model: 'PatientIN',
                    as: 'patient',
                    attributes: ['firstName', 'lastName']
                }
            ]
        });

        res.status(200).json({
            success: true,
            data: queue
        });
    } catch (error) {
        console.error('Error in getPatientQueue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient queue',
            error: error.message
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
                status: 'waiting'
            }
        });

        if (!queueEntry) {
            return res.status(404).json({
                success: false,
                message: 'Queue entry not found'
            });
        }

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

        // Get updated queue to notify doctor
        const updatedQueue = await PatientQueue.findAll({
            where: {
                doctorId,
                status: ['waiting', 'in_consultation']
            },
            include: [
                {
                    model: 'PatientIN',
                    as: 'patient',
                    attributes: ['firstName', 'lastName']
                }
            ],
            order: [['position', 'ASC']]
        });

        // Notify doctor through socket
        const doctorSocketId = getDoctorSocketId(doctorId);
        if (doctorSocketId) {
            req.app.get('io').to(doctorSocketId).emit('QUEUE_CHANGED', updatedQueue);
        }

        res.status(200).json({
            success: true,
            message: 'Successfully left the queue',
            data: updatedQueue
        });
    } catch (error) {
        console.error('Error in leavePatientQueue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave queue',
            error: error.message
        });
    }
};

module.exports = {
    getPatientQueue,
    leavePatientQueue
}; 