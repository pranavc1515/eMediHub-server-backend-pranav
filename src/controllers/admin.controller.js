const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');

// Get all doctors (Admin only)
exports.getAllDoctors = async (req, res) => {
  try {
    const { verified, specialization, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (verified !== undefined) {
      where.isVerified = verified === 'true';
    }

    if (specialization) {
      where.specialization = specialization;
    }

    const { count, rows: doctors } = await Doctor.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        doctors,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message,
    });
  }
};

// Update doctor's profile (Admin only)
exports.updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Admin can update verification status
    const updatedData = { ...req.body };
    delete updatedData.password; // Admin cannot change password

    await doctor.update(updatedData);

    const doctorData = doctor.toJSON();
    delete doctorData.password;

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: doctorData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating doctor profile',
      error: error.message,
    });
  }
};

// Verify/Unverify a doctor (Admin only)
exports.toggleDoctorVerification = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    await doctor.update({ isVerified: req.body.isVerified });

    res.json({
      success: true,
      message: `Doctor ${req.body.isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        id: doctor.id,
        isVerified: doctor.isVerified,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating doctor verification status',
      error: error.message,
    });
  }
};

// Get all patients (Admin only)
exports.getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: patients } = await Patient.findAndCountAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName'],
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        patients,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message,
    });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        users,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

// Update user active status (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin user status',
      });
    }

    await user.update({ isActive: req.body.isActive });

    res.json({
      success: true,
      message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user.id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating user status',
      error: error.message,
    });
  }
};

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalDoctors = await Doctor.count();
    const verifiedDoctors = await Doctor.count({ where: { isVerified: true } });
    const totalPatients = await Patient.count();
    const totalUsers = await User.count({ where: { role: 'user' } });

    // Get recent registrations
    const recentDoctors = await Doctor.findAll({
      attributes: ['id', 'firstName', 'lastName', 'specialization', 'createdAt'],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    const recentPatients = await Patient.findAll({
      attributes: ['id', 'firstName', 'lastName', 'createdAt'],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        statistics: {
          totalDoctors,
          verifiedDoctors,
          totalPatients,
          totalUsers,
        },
        recentRegistrations: {
          doctors: recentDoctors,
          patients: recentPatients,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
}; 