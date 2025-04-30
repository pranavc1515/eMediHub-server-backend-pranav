const jwt = require('jsonwebtoken');
const Patient = require('../models/patient.model');

// Register a new patient
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const patient = await Patient.create({
      email,
      password,
      firstName,
      lastName,
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        id: patient.id,
        email: patient.email,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// Login patient
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ where: { email } });

    if (!patient || !(await patient.validatePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = jwt.sign(
      { id: patient.id, email: patient.email, role: patient.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        patient: {
          id: patient.id,
          email: patient.email,
          firstName: patient.firstName,
          lastName: patient.lastName,
          role: patient.role,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
}; 