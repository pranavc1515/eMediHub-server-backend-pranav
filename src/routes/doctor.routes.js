const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth.middleware");
const doctorController = require("../controllers/doctor.controller");
const { DoctorPersonal, DoctorProfessional } = require("../models/doctor.model");

/**
 * @swagger
 * /api/doctors/register:
 *   post:
 *     summary: Register a new doctor with phone number
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\+91[0-9]{10}$'
 *                 description: Phone number with country code +91 followed by 10 digits
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                       example: "+919876543210"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Registration failed"
 *                 error:
 *                   type: string
 *                   example: "Invalid phone number format"
 */
router.post("/register", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const result = await doctorController.registerDoctor(phoneNumber);

    res.json({
      success: true,
      message: "OTP sent successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/login:
 *   post:
 *     summary: Login for existing doctor with phone number
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\+91[0-9]{10}$'
 *                 description: Phone number with country code +91 followed by 10 digits
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     phoneNumber:
 *                       type: string
 *                       example: "+919876543210"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Login failed"
 *                 error:
 *                   type: string
 *                   example: "Invalid phone number format"
 *       404:
 *         description: Doctor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Doctor not found with this phone number"
 */
router.post("/login", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const result = await doctorController.loginDoctor(phoneNumber);

    res.json({
      success: true,
      message: "OTP sent successfully",
      data: result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    res.status(400).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/validate-otp:
 *   post:
 *     summary: Validate OTP and authenticate doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\+91[0-9]{10}$'
 *                 description: Phone number with country code +91 followed by 10 digits
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP sent to the phone number
 *     responses:
 *       200:
 *         description: OTP validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP validated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     doctor:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         phoneNumber:
 *                           type: string
 *                           example: "+919876543210"
 *                         isProfileComplete:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid OTP"
 *       404:
 *         description: Doctor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Doctor not found"
 */
router.post("/validate-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const result = await doctorController.validateOTP(phoneNumber, otp);

    res.json({
      success: true,
      message: "OTP validated successfully",
      data: result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Invalid OTP')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      message: "OTP validation failed",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/check-exists:
 *   post:
 *     summary: Check if doctor exists by phone number
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^\+91[0-9]{10}$'
 *                 description: Phone number with country code +91 followed by 10 digits
 *     responses:
 *       200:
 *         description: Check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 exists:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     phoneNumber:
 *                       type: string
 *                       example: "+919876543210"
 *                     isProfileComplete:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid input or check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Check failed"
 *                 error:
 *                   type: string
 *                   example: "Invalid phone number format"
 */
router.post("/check-exists", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const result = await doctorController.checkDoctorExists(phoneNumber);

    res.json({
      success: true,
      exists: result.exists,
      data: result.data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Check failed",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/personal-details/{id}:
 *   put:
 *     summary: Update doctor's personal details
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor's ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the doctor
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the doctor
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 description: Gender of the doctor
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (YYYY-MM-DD)
 *               profilePhoto:
 *                 type: string
 *                 description: URL of the profile photo
 *     responses:
 *       200:
 *         description: Personal details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Personal details updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     fullName:
 *                       type: string
 *                       example: "Dr. John Doe"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+919876543210"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     gender:
 *                       type: string
 *                       example: "Male"
 *                     dob:
 *                       type: string
 *                       example: "1980-01-01"
 *                     profilePhoto:
 *                       type: string
 *                       example: "https://example.com/photos/doctor.jpg"
 *                     status:
 *                       type: string
 *                       example: "Active"
 *                     emailVerified:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User not authorized to update this doctor's profile
 *       404:
 *         description: Doctor not found
 */
router.put("/personal-details/:id", auth, async (req, res) => {
  try {
    const { fullName, email, gender, dob, profilePhoto } = req.body;
    const doctorId = parseInt(req.params.id);

    // Check if the authenticated user is a doctor
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Doctors can only update their own profile
    if (req.user.id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Find doctor
    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Update doctor personal details
    const updatedDoctor = await doctor.update({
      fullName: fullName || doctor.fullName,
      email: email || doctor.email,
      gender: gender || doctor.gender,
      dob: dob || doctor.dob,
      profilePhoto: profilePhoto || doctor.profilePhoto,
    });

    res.json({
      success: true,
      message: "Personal details updated successfully",
      data: updatedDoctor,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      message: "Failed to update personal details",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/professional-details/{id}:
 *   put:
 *     summary: Update doctor's professional details
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor's ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qualification:
 *                 type: string
 *               specialization:
 *                 type: string
 *               registrationNumber:
 *                 type: string
 *               registrationState:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *               clinicName:
 *                 type: string
 *               yearsOfExperience:
 *                 type: integer
 *               communicationLanguages:
 *                 type: array
 *                 items:
 *                   type: string
 *               consultationFees:
 *                 type: number
 *     responses:
 *       200:
 *         description: Professional details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Professional details updated successfully"
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to update this doctor's profile
 *       404:
 *         description: Doctor not found
 */
router.put("/professional-details/:id", auth, async (req, res) => {
  try {
    const {
      qualification,
      specialization,
      registrationNumber,
      registrationState,
      expiryDate,
      certificates,
      clinicName,
      yearsOfExperience,
      communicationLanguages,
      consultationFees,
    } = req.body;

    const doctorId = parseInt(req.params.id);

    // Check if the authenticated user is a doctor
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Doctors can only update their own profile
    if (req.user.id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Find or create professional details
    let professional = await DoctorProfessional.findOne({ where: { doctorId } });

    if (!professional) {
      professional = await DoctorProfessional.create({
        doctorId,
        status: 'Pending Verification'
      });
    }

    // Update professional details
    await professional.update({
      qualification: qualification || professional.qualification,
      specialization: specialization || professional.specialization,
      registrationNumber: registrationNumber || professional.registrationNumber,
      registrationState: registrationState || professional.registrationState,
      expiryDate: expiryDate || professional.expiryDate,
      certificates: certificates || professional.certificates,
      clinicName: clinicName || professional.clinicName,
      yearsOfExperience: yearsOfExperience || professional.yearsOfExperience,
      communicationLanguages: communicationLanguages || professional.communicationLanguages,
      consultationFees: consultationFees || professional.consultationFees,
      status: 'Pending Verification'
    });

    res.json({
      success: true,
      message: 'Professional details updated successfully',
      data: professional
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update professional details',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/doctors/profile:
 *   get:
 *     summary: Get doctor's complete profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *         description: Optional doctor ID. If not provided, returns the authenticated doctor's profile
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot access other doctor's private information
 *       404:
 *         description: Doctor not found
 */
router.get("/profile", auth, async (req, res) => {
  try {
    const requestedDoctorId = req.query.doctorId ? parseInt(req.query.doctorId) : req.user.id;
    const isOwnProfile = requestedDoctorId === req.user.id;

    // Find doctor with professional details
    const doctor = await DoctorPersonal.findByPk(requestedDoctorId, {
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: DoctorProfessional,
          attributes: { exclude: ["id", "doctorId"] },
          where: isOwnProfile ? {} : { status: "Verified" }
        },
      ],
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // If requesting other doctor's profile, only return public information
    if (!isOwnProfile) {
      const publicProfile = {
        id: doctor.id,
        fullName: doctor.fullName,
        gender: doctor.gender,
        profilePhoto: doctor.profilePhoto,
        DoctorProfessional: doctor.DoctorProfessional
      };

      return res.json({
        success: true,
        data: publicProfile,
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/verify-email:
 *   put:
 *     summary: Verify doctor's email
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verification email sent
 *       401:
 *         description: Unauthorized
 */
router.put("/verify-email", auth, async (req, res) => {
  try {
    const { email } = req.body;
    const doctorId = req.user.id;

    // Find doctor
    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Update email (in a real app, you would send a verification email)
    await doctor.update({
      email: email || doctor.email,
    });

    // For demo purposes, just mark it as verified
    // In a real app, this would be done through a verification link
    await doctor.update({
      emailVerified: true,
    });

    res.json({
      success: true,
      message: "Email verified successfully",
      data: {
        id: doctor.id,
        email: doctor.email,
        emailVerified: doctor.emailVerified,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to verify email",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all verified doctors with pagination and search
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for doctor name
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by doctor specialization
 *     responses:
 *       200:
 *         description: List of doctors retrieved successfully
 *       400:
 *         description: Error fetching doctors
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const specialization = req.query.specialization || '';

    const result = await doctorController.getAllDoctors(page, limit, search, specialization);

    res.json({
      success: true,
      count: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      data: result.doctors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error fetching doctors",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/online-status:
 *   put:
 *     summary: Update doctor's online status
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, offline]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 */
router.put("/online-status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const doctorId = req.user.id;

    if (!status || !['available', 'offline'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Status must be 'available' or 'offline'",
      });
    }

    const result = await doctorController.updateOnlineStatus(doctorId, status);

    res.json({
      success: true,
      message: "Online status updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update online status",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/{id}/online-status:
 *   get:
 *     summary: Get doctor's online status
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *       404:
 *         description: Doctor not found
 */
router.get("/:id/online-status", async (req, res) => {
  try {
    const doctorId = req.params.id;

    const result = await doctorController.getOnlineStatus(doctorId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      message: "Failed to get online status",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/available:
 *   get:
 *     summary: Get all verified doctors who are online and available with pagination and search
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for doctor name
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by doctor specialization
 *     responses:
 *       200:
 *         description: List of available doctors retrieved successfully
 *       400:
 *         description: Error fetching available doctors
 */
router.get("/available", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const specialization = req.query.specialization || '';

    const result = await doctorController.getAvailableDoctors(page, limit, search, specialization);

    res.json({
      success: true,
      count: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      data: result.doctors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error fetching available doctors",
      error: error.message,
    });
  }
});

module.exports = router;
