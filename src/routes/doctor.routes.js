const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth.middleware");
const doctorController = require("../controllers/doctor.controller");

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
 *                 pattern: '^[0-9]{10}$'
 *                 description: 10-digit phone number
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid input data
 *       429:
 *         description: Too many requests
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
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP validated successfully
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: Doctor not found
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
 *     responses:
 *       200:
 *         description: Check successful
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
 * /api/doctors/personal-details:
 *   put:
 *     summary: Update doctor's personal details
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               dob:
 *                 type: string
 *                 format: date
 *               profilePhoto:
 *                 type: string
 *     responses:
 *       200:
 *         description: Personal details updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/personal-details", auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const personalData = req.body;

    const updatedDoctor = await doctorController.updatePersonalDetails(doctorId, personalData);

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
 * /api/doctors/professional-details:
 *   post:
 *     summary: Update doctor's professional details
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 */
router.post("/professional-details", auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const professionalData = req.body;

    const professional = await doctorController.updateProfessionalDetails(doctorId, professionalData);

    res.json({
      success: true,
      message: "Professional details updated successfully",
      data: professional,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update professional details",
      error: error.message,
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
 *     summary: Get all verified doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of doctors retrieved successfully
 */
router.get("/", async (req, res) => {
  try {
    const { specialization } = req.query;
    const whereProf = { status: "Verified" };

    if (specialization) {
      whereProf.specialization = specialization;
    }

    // Find all verified doctors
    const doctors = await DoctorPersonal.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: DoctorProfessional,
          where: whereProf,
          attributes: { exclude: ["id"] },
        },
      ],
    });

    res.json({
      success: true,
      count: doctors.length,
      data: doctors,
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

module.exports = router;

module.exports = router;
