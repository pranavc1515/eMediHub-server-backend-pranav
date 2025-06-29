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
    let user;

    if (decoded.type === 'doctor') {
      user = await DoctorPersonal.findOne({ where: { id: decoded.id } });
    } else {
      user = await Patient.findOne({ where: { id: decoded.id } });
    }

    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Please authenticate',
    });
  }
};

// Middleware for proxy endpoints - just pass through the token without any validation
const authProxy = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided',
    });
  }

  // Just pass the token through - external API will handle all validation
  req.token = token;
  next();
};

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

module.exports = { auth, authProxy, authorize };