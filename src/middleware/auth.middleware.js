const jwt = require('jsonwebtoken');
const Patient = require('../models/patient.model');
const { DoctorPersonal } = require('../models/doctor.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);

    // Trust decoded token (from external admin system or internal login)
    req.token = token;
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Please authenticate',
    });
  }
};

// Authorization middleware to check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    }
    next();
  };
};

module.exports = { auth, authorize };