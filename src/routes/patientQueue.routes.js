const express = require('express');
const router = express.Router();
const { getPatientQueue, leavePatientQueue } = require('../controllers/patientQueue.controller');

// Get patient queue for a specific doctor
router.get('/doctor/:doctorId', getPatientQueue);

// Leave patient queue
router.post('/leave', leavePatientQueue);

module.exports = router; 