const express = require('express');
const router = express.Router();
const {
  getPatientQueue,
  leavePatientQueue,
  joinPatientQueue,
} = require('../controllers/patientQueue.controller');

// Get patient queue for a specific doctor
router.get('/:doctorId', getPatientQueue);

// Join patient queue
router.post('/join', joinPatientQueue);

// Leave patient queue
router.post('/leave', leavePatientQueue);

module.exports = router;
