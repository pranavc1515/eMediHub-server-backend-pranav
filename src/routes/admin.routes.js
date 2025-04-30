const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');

/**
 * @swagger
 * /api/admin/doctors:
 *   get:
 *     summary: Get all doctors (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of doctors retrieved successfully
 */
router.get('/doctors', auth, authorize('admin'), async (req, res) => {
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
});

/**
 * @swagger
 * /api/admin/doctors/{id}:
 *   put:
 *     summary: Update doctor's profile (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Doctor profile updated successfully
 */
router.put('/doctors/:id', auth, authorize('admin'), async (req, res) => {
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
});

/**
 * @swagger
 * /api/admin/doctors/{id}/verify:
 *   put:
 *     summary: Verify/Unverify a doctor (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Doctor verification status updated successfully
 */
router.put('/doctors/:id/verify', auth, authorize('admin'), async (req, res) => {
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
});

/**
 * @swagger
 * /api/admin/patients:
 *   get:
 *     summary: Get all patients (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of patients retrieved successfully
 */
router.get('/patients', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: patients } = await Patient.findAndCountAll({
      attributes: { exclude: ['password'] },
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
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all patients (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of patients retrieved successfully
 */
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: patients } = await Patient.findAndCountAll({
      attributes: { exclude: ['password'] },
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
});

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Update patient active status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Patient status updated successfully
 */
router.put('/users/:id/status', auth, authorize('admin'), async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    if (patient.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin patient status',
      });
    }

    await patient.update({ isActive: req.body.isActive });

    res.json({
      success: true,
      message: `Patient ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: patient.id,
        isActive: patient.isActive,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating patient status',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const totalDoctors = await Doctor.count();
    const verifiedDoctors = await Doctor.count({ where: { isVerified: true } });
    const totalPatients = await Patient.count();

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
});

module.exports = router; 