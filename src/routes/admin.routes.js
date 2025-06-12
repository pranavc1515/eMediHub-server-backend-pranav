/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin panel & management APIs
 */

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
 *         description: Dashboard statistics
 */

/**
 * @swagger
 * /api/admin/doctors:
 *   get:
 *     summary: List doctors (filterable)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated doctor list
 */

/**
 * @swagger
 * /api/admin/doctors/{id}:
 *   put:
 *     summary: Update doctor's profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Doctor updated
 */

/**
 * @swagger
 * /api/admin/doctors/{id}/verify:
 *   patch:
 *     summary: Verify or unverify a doctor
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Verification toggled
 */

/**
 * @swagger
 * /api/admin/patients:
 *   get:
 *     summary: List patients
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated patient list
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated user list
 */

/**
 * @swagger
 * /api/admin/patients/{id}/status:
 *   patch:
 *     summary: Update patient active status
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
 *         description: Patient status updated
 */

const express = require('express');
const router = express.Router();

// Controllers
const adminController = require('../controllers/admin.controller');

// Middleware
const { auth, authorize } = require('../middleware/auth.middleware');

// All admin routes require authentication and admin role
router.use(auth, authorize('admin'));

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStatistics);

// Doctor management
router.get('/doctors', adminController.getAllDoctors);
router.put('/doctors/:id', adminController.updateDoctorProfile);
router.patch('/doctors/:id/verify', adminController.toggleDoctorVerification);

// Patient/User management
router.get('/patients', adminController.getAllPatients);
router.get('/users', adminController.getAllUsers);
router.patch('/patients/:id/status', adminController.updateUserStatus);

module.exports = router; 