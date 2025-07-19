const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const doctorController = require('../controllers/doctor.controller');
const vdcController = require('../controllers/doctor.vdc.controller');
const {
  DoctorPersonal,
  DoctorProfessional,
} = require('../models/doctor.model');
const {
  upload,
  uploadToS3,
  uploadDoctorDocumentToS3,
  uploadDoctorProfilePhotoToS3,
  uploadProfilePhoto,
  deleteFromS3,
} = require('../utils/fileUpload');

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
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const result = await doctorController.registerDoctor(phoneNumber);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
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
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const result = await doctorController.loginDoctor(phoneNumber);

    res.json({
      success: true,
      message: 'OTP sent successfully',
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
      message: 'Login failed',
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
router.post('/validate-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    const result = await doctorController.validateOTP(phoneNumber, otp);

    res.json({
      success: true,
      message: 'OTP validated successfully',
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
      message: 'OTP validation failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/checkDoctorExists:
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
router.post('/checkDoctorExists', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
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
      message: 'Check failed',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/personal-details/{id}:
 *   put:
 *     summary: Update doctor's personal details (supports profile photo upload)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Doctor's full name
 *                 example: "Dr. John Smith"
 *               email:
 *                 type: string
 *                 description: Doctor's email address
 *                 example: "doctor@example.com"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 description: Doctor's gender
 *                 example: "Male"
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Doctor's date of birth (YYYY-MM-DD)
 *                 example: "1980-01-15"
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo file (JPG, JPEG, PNG only, max 5MB)
 *           encoding:
 *             profilePhoto:
 *               contentType: image/png, image/jpeg, image/jpg
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Doctor's full name
 *                 example: "Dr. John Smith"
 *               email:
 *                 type: string
 *                 description: Doctor's email address
 *                 example: "doctor@example.com"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 description: Doctor's gender
 *                 example: "Male"
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Doctor's date of birth (YYYY-MM-DD)
 *                 example: "1980-01-15"
 *             description: Use this for text-only updates (no file upload)
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
 *                       example: "Dr. John Smith"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+918805047968"
 *                     email:
 *                       type: string
 *                       example: "doctor@example.com"
 *                     gender:
 *                       type: string
 *                       example: "Male"
 *                     dob:
 *                       type: string
 *                       format: date
 *                       example: "1980-01-15"
 *                     profilePhoto:
 *                       type: string
 *                       nullable: true
 *                       description: URL of the uploaded profile photo
 *                       example: "https://s3.amazonaws.com/emedihub-prescriptions/doctors/1/profile/uuid.jpg"
 *                     status:
 *                       type: string
 *                       example: "Active"
 *                     emailVerified:
 *                       type: boolean
 *                       example: true
 *                     isOnline:
 *                       type: string
 *                       example: "available"
 *                     lastSeen:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-20T10:30:00Z"
 *       400:
 *         description: Bad request - Invalid data or file upload error
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
 *                   example: "Failed to upload profile photo"
 *                 error:
 *                   type: string
 *                   example: "Invalid file type. Only JPG, JPEG, and PNG files are allowed for profile photos."
 *       401:
 *         description: Unauthorized - Missing or invalid token
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
 *                   example: "Authentication required"
 *       403:
 *         description: Forbidden - Cannot update other doctor's profile
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
 *                   example: "You can only update your own profile"
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
router.put('/personal-details/:id', auth, uploadProfilePhoto.single('profilePhoto'), async (req, res) => {
  try {
    const { fullName, email, gender, dob } = req.body;
    const doctorId = parseInt(req.params.id);
    const file = req.file;

    // Check if the authenticated user is a doctor
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Doctors can only update their own profile
    if (req.user.id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile',
      });
    }

    // Find doctor
    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    let profilePhotoUrl = doctor.profilePhoto;

    // Handle profile photo upload if file is provided
    if (file) {
      // Delete old profile photo from S3 if it exists
      if (doctor.profilePhoto) {
        try {
          // Extract key from URL to delete from S3
          const oldPhotoKey = doctor.profilePhoto.split('/').slice(-3).join('/');
          await deleteFromS3(oldPhotoKey);
        } catch (deleteError) {
          console.warn('Could not delete old profile photo:', deleteError.message);
        }
      }

      // Upload new profile photo to S3
      const uploadResult = await uploadDoctorProfilePhotoToS3(file, doctorId);

      if (!uploadResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to upload profile photo',
          error: uploadResult.error,
        });
      }

      profilePhotoUrl = uploadResult.fileUrl;
    }

    // Update doctor personal details
    const updatedDoctor = await doctor.update({
      fullName: fullName || doctor.fullName,
      email: email || doctor.email,
      gender: gender || doctor.gender,
      dob: dob || doctor.dob,
      profilePhoto: profilePhotoUrl,
    });

    res.json({
      success: true,
      message: 'Personal details updated successfully',
      data: {
        id: updatedDoctor.id,
        fullName: updatedDoctor.fullName,
        phoneNumber: updatedDoctor.phoneNumber,
        email: updatedDoctor.email,
        gender: updatedDoctor.gender,
        dob: updatedDoctor.dob,
        profilePhoto: updatedDoctor.profilePhoto,
        status: updatedDoctor.status,
        emailVerified: updatedDoctor.emailVerified,
        isOnline: updatedDoctor.isOnline,
        lastSeen: updatedDoctor.lastSeen,
      },
    });
  } catch (error) {
    console.error('Error updating personal details:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(400).json({
      success: false,
      message: 'Failed to update personal details',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/professional-details/{id}:
 *   put:
 *     summary: Update doctor's professional details including certificates and documents
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
 *         multipart/form-data:
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
 *               clinicName:
 *                 type: string
 *               yearsOfExperience:
 *                 type: integer
 *               communicationLanguages:
 *                 type: string
 *                 description: JSON string of array
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Certificate files (PDF, JPG, JPEG, PNG)
 *               certificatesToRemove:
 *                 type: string
 *                 description: JSON string array of certificate keys/URLs/indices to remove
 *     responses:
 *       200:
 *         description: Professional details updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to update this doctor's profile
 *       404:
 *         description: Doctor not found
 */
// Helper function to get current certificates
const getCurrentCertificates = async (doctorId) => {
  try {
    const professional = await DoctorProfessional.findOne({
      where: { doctorId },
    });
    return professional ? professional.certificates || [] : [];
  } catch (error) {
    console.error('Error getting current certificates:', error);
    return [];
  }
};

// Helper function to remove certificates
const removeCertificates = async (
  certificatesToRemove,
  existingCertificates
) => {
  const certificatesToDelete = [];
  const remainingCertificates = [];

  // Parse certificatesToRemove if it's a string
  let parsedCertificatesToRemove = [];
  if (typeof certificatesToRemove === 'string') {
    try {
      parsedCertificatesToRemove = JSON.parse(certificatesToRemove);
    } catch (e) {
      console.error('Error parsing certificatesToRemove:', e);
      parsedCertificatesToRemove = [];
    }
  } else if (Array.isArray(certificatesToRemove)) {
    parsedCertificatesToRemove = certificatesToRemove;
  }

  // Separate certificates to keep and to delete
  existingCertificates.forEach((cert, index) => {
    if (
      parsedCertificatesToRemove.includes(index) ||
      parsedCertificatesToRemove.includes(cert.key) ||
      parsedCertificatesToRemove.includes(cert.url)
    ) {
      certificatesToDelete.push(cert);
    } else {
      remainingCertificates.push(cert);
    }
  });

  // Delete certificates from S3
  const s3DeletionPromises = certificatesToDelete.map(async (cert) => {
    if (cert.key) {
      try {
        await deleteFromS3(cert.key);
        console.log(`Successfully deleted certificate from S3: ${cert.key}`);
        return { success: true, cert };
      } catch (error) {
        console.error(
          `Failed to delete certificate from S3: ${cert.key}`,
          error
        );
        // Continue anyway - remove from database even if S3 deletion fails
        return { success: false, cert, error: error.message };
      }
    }
    return { success: true, cert };
  });

  await Promise.all(s3DeletionPromises);

  return {
    remainingCertificates,
    deletedCertificates: certificatesToDelete,
  };
};

router.put(
  '/professional-details/:id',
  auth,
  upload.array('certificates', 10),
  async (req, res) => {
    try {
      const {
        qualification,
        specialization,
        registrationNumber,
        registrationState,
        expiryDate,
        clinicName,
        yearsOfExperience,
        communicationLanguages,
        certificatesToRemove,
      } = req.body;

      const doctorId = parseInt(req.params.id);
      const files = req.files;

      // Check if the authenticated user is a doctor
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Doctors can only update their own profile
      if (req.user.id !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile',
        });
      }

      // Find or create professional details
      let professional = await DoctorProfessional.findOne({
        where: { doctorId },
      });

      if (!professional) {
        professional = await DoctorProfessional.create({
          doctorId,
          status: 'Verified',
        });
      }

      // Get current certificates
      let currentCertificates = await getCurrentCertificates(doctorId);

      // Handle certificate removal first
      let finalCertificates = currentCertificates;
      let deletedCertificates = [];

      if (certificatesToRemove) {
        const removalResult = await removeCertificates(
          certificatesToRemove,
          currentCertificates
        );
        finalCertificates = removalResult.remainingCertificates;
        deletedCertificates = removalResult.deletedCertificates;
      }

      // Handle new certificate uploads
      if (files && files.length > 0) {
        const certificateUploadPromises = files.map((file) =>
          uploadDoctorDocumentToS3(file, doctorId, 'certificates')
        );

        const certificateResults = await Promise.all(certificateUploadPromises);
        const newCertificates = certificateResults
          .filter((result) => result.success)
          .map((result) => ({
            url: result.fileUrl,
            name: result.filename,
            type: 'certificate',
            uploadedAt: new Date().toISOString(),
            key: result.key,
          }));

        finalCertificates = [...finalCertificates, ...newCertificates];
      }

      // Parse JSON strings for arrays
      let parsedCommunicationLanguages = professional.communicationLanguages;

      if (
        communicationLanguages &&
        typeof communicationLanguages === 'string'
      ) {
        try {
          parsedCommunicationLanguages = JSON.parse(communicationLanguages);
        } catch (e) {
          parsedCommunicationLanguages = [communicationLanguages];
        }
      }

      // Update professional details
      await professional.update({
        qualification: qualification || professional.qualification,
        specialization: specialization || professional.specialization,
        registrationNumber:
          registrationNumber || professional.registrationNumber,
        registrationState: registrationState || professional.registrationState,
        expiryDate: expiryDate || professional.expiryDate,
        certificates: finalCertificates,
        clinicName: clinicName || professional.clinicName,
        yearsOfExperience: yearsOfExperience
          ? parseInt(yearsOfExperience)
          : professional.yearsOfExperience,
        communicationLanguages:
          parsedCommunicationLanguages || professional.communicationLanguages,
        status: 'Verified',
      });

      // Prepare response with additional info about operations performed
      const responseData = {
        ...professional.toJSON(),
        operationSummary: {
          certificatesAdded: files ? files.length : 0,
          certificatesRemoved: deletedCertificates.length,
          totalCertificates: finalCertificates.length,
        },
      };

      res.json({
        success: true,
        message: 'Professional details updated successfully',
        data: responseData,
      });
    } catch (error) {
      console.error('Error updating professional details:', error);

      res.status(400).json({
        success: false,
        message: 'Failed to update professional details',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/doctors/professional-details/{id}/certificate/{certificateIndex}:
 *   delete:
 *     summary: Delete a certificate from doctor's professional details
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
 *       - in: path
 *         name: certificateIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Index of the certificate to delete
 *     responses:
 *       200:
 *         description: Certificate deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to modify this doctor's profile
 *       404:
 *         description: Doctor or certificate not found
 */
router.delete(
  '/professional-details/:id/certificate/:certificateIndex',
  auth,
  async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const certificateIndex = parseInt(req.params.certificateIndex);

      // Check if the authenticated user is a doctor
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Doctors can only update their own profile
      if (req.user.id !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'You can only modify your own profile',
        });
      }

      // Find professional details
      const professional = await DoctorProfessional.findOne({
        where: { doctorId },
      });

      if (!professional) {
        return res.status(404).json({
          success: false,
          message: 'Doctor professional details not found',
        });
      }

      const certificates = professional.certificates || [];

      if (certificateIndex < 0 || certificateIndex >= certificates.length) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
      }

      const certificateToDelete = certificates[certificateIndex];

      // Delete from S3 if key exists
      if (certificateToDelete.key) {
        await deleteFromS3(certificateToDelete.key);
      }

      // Remove certificate from array
      certificates.splice(certificateIndex, 1);

      // Update professional details
      await professional.update({
        certificates: certificates,
        status: 'Verified',
      });

      res.json({
        success: true,
        message: 'Certificate deleted successfully',
        data: professional,
      });
    } catch (error) {
      console.error('Error deleting certificate:', error);

      res.status(400).json({
        success: false,
        message: 'Failed to delete certificate',
        error: error.message,
      });
    }
  }
);

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
router.get('/profile', auth, async (req, res) => {
  try {
    const requestedDoctorId = req.query.doctorId
      ? parseInt(req.query.doctorId)
      : req.user.id;
    const isOwnProfile = requestedDoctorId === req.user.id;

    // Find doctor with professional details
    const doctor = await DoctorPersonal.findByPk(requestedDoctorId, {
      attributes: {
        exclude: ['password'],
      },
      include: [
        {
          model: DoctorProfessional,
          attributes: { exclude: ['id', 'doctorId'] },
          required: false, // Make it a LEFT JOIN so doctor is returned even without professional details
          where: isOwnProfile ? {} : { status: 'Verified' },
        },
      ],
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // If requesting other doctor's profile, only return public information
    if (!isOwnProfile) {
      // Remove sensitive data like certificates for other doctors' profiles
      const professionalData = doctor.DoctorProfessional
        ? {
          qualification: doctor.DoctorProfessional.qualification,
          specialization: doctor.DoctorProfessional.specialization,
          clinicName: doctor.DoctorProfessional.clinicName,
          yearsOfExperience: doctor.DoctorProfessional.yearsOfExperience,
          communicationLanguages:
            doctor.DoctorProfessional.communicationLanguages,
          status: doctor.DoctorProfessional.status,
          vdcEnabled: doctor.DoctorProfessional.vdcEnabled,
          // Only include VDC-related fields if VDC is enabled
          ...(doctor.DoctorProfessional.vdcEnabled && {
            consultationFees: doctor.DoctorProfessional.consultationFees,
            availableDays: doctor.DoctorProfessional.availableDays,
            availableTimeSlots: doctor.DoctorProfessional.availableTimeSlots,
          }),
          // Exclude certificates, registrationNumber, etc. for privacy
        }
        : null;

      const publicProfile = {
        id: doctor.id,
        fullName: doctor.fullName,
        gender: doctor.gender,
        profilePhoto: doctor.profilePhoto,
        DoctorProfessional: professionalData,
      };

      return res.json({
        success: true,
        data: publicProfile,
      });
    }

    // For own profile, return everything including certificates
    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(400).json({
      success: false,
      message: 'Error fetching profile',
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
router.put('/verify-email', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const doctorId = req.user.id;

    // Find doctor
    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
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
      message: 'Email verified successfully',
      data: {
        id: doctor.id,
        email: doctor.email,
        emailVerified: doctor.emailVerified,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/delete-account:
 *   delete:
 *     summary: Delete own doctor account (self-deletion)
 *     description: |
 *       Allows authenticated doctor to delete their own account without passing doctor ID.
 *       This action is irreversible and will:
 *       - Check for active consultations (prevents deletion if any exist)
 *       - Check for patients in waiting queue (prevents deletion if any exist)
 *       - Archive completed consultation history
 *       - Soft delete prescriptions
 *       - Remove all doctor data
 *     tags: [Doctors - Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: "Doctor account deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-20T10:30:00.000Z"
 *                     doctorId:
 *                       type: integer
 *                       example: 123
 *       400:
 *         description: Cannot delete account due to active consultations or patients in queue
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: Doctor not found
 *       500:
 *         description: Server error during deletion
 */
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const result = await doctorController.deleteDoctorAccount(doctorId);

    res.json({
      success: result.success,
      message: result.message,
      data: {
        deletedAt: result.deletedAt,
        doctorId: result.doctorId
      }
    });
  } catch (error) {
    console.error('Delete account error:', error);

    // Handle specific error cases
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Cannot delete account')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: error.message,
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
 *       - in: query
 *         name: onlyAvailable
 *         schema:
 *           type: boolean
 *         description: Filter only available doctors (true = available, false = offline)
 *     responses:
 *       200:
 *         description: List of doctors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Total number of doctors matching criteria
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 2
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   description: Number of records per page
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Doctor's unique ID
 *                         example: 1
 *                       fullName:
 *                         type: string
 *                         description: Doctor's full name
 *                         example: "Dr. John Smith"
 *                       phoneNumber:
 *                         type: string
 *                         description: Doctor's phone number
 *                         example: "+918805047968"
 *                       email:
 *                         type: string
 *                         description: Doctor's email address
 *                         example: "doctor@example.com"
 *                       gender:
 *                         type: string
 *                         enum: [Male, Female, Other]
 *                         example: "Male"
 *                       dob:
 *                         type: string
 *                         format: date
 *                         description: Doctor's date of birth
 *                         example: "1980-01-15"
 *                       status:
 *                         type: string
 *                         enum: [Active, Inactive]
 *                         example: "Active"
 *                       emailVerified:
 *                         type: boolean
 *                         example: true
 *                       profilePhoto:
 *                         type: string
 *                         nullable: true
 *                         description: URL of doctor's profile photo
 *                         example: "https://s3.amazonaws.com/bucket/doctors/1/profile/photo.jpg"
 *                       isOnline:
 *                         type: string
 *                         enum: [available, offline]
 *                         description: Doctor's current availability status
 *                         example: "available"
 *                       lastSeen:
 *                         type: string
 *                         format: date-time
 *                         description: Last time doctor was seen online
 *                         example: "2025-01-20T10:30:00Z"
 *                       isVerified:
 *                         type: boolean
 *                         description: Whether admin has verified this doctor
 *                         example: true
 *                       DoctorProfessional:
 *                         type: object
 *                         nullable: true
 *                         description: Professional details (only for verified doctors)
 *                         properties:
 *                           qualification:
 *                             type: string
 *                             example: "MBBS, MD"
 *                           specialization:
 *                             type: string
 *                             example: "Cardiology"
 *                           registrationNumber:
 *                             type: string
 *                             example: "MED12345"
 *                           registrationState:
 *                             type: string
 *                             example: "Maharashtra"
 *                           expiryDate:
 *                             type: string
 *                             format: date
 *                             example: "2025-12-31"
 *                           certificates:
 *                             type: array
 *                             description: Array of certificate objects
 *                             items:
 *                               type: object
 *                           clinicName:
 *                             type: string
 *                             example: "City Medical Center"
 *                           status:
 *                             type: string
 *                             enum: [Verified, Unverified, Pending Verification]
 *                             example: "Verified"
 *                           yearsOfExperience:
 *                             type: integer
 *                             example: 10
 *                           communicationLanguages:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["English", "Hindi"]
 *                           vdcEnabled:
 *                             type: boolean
 *                             description: Whether doctor has enabled video/digital consultation
 *                             example: true
 *                           consultationFees:
 *                             type: number
 *                             format: decimal
 *                             nullable: true
 *                             description: Consultation fees (only shown if VDC is enabled)
 *                             example: 500.00
 *                           availableDays:
 *                             type: array
 *                             nullable: true
 *                             description: Available days for consultation (only shown if VDC is enabled)
 *                             items:
 *                               type: string
 *                             example: ["monday", "tuesday", "wednesday"]
 *                           availableTimeSlots:
 *                             type: object
 *                             nullable: true
 *                             description: Available time slots (only shown if VDC is enabled)
 *                             example: {"monday": {"start": "09:00", "end": "17:00"}}
 *       400:
 *         description: Error fetching doctors
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
 *                   example: "Error fetching doctors"
 *                 error:
 *                   type: string
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const specialization = req.query.specialization || '';
    const onlyAvailable = req.query.onlyAvailable === 'true';

    const result = await doctorController.getAllDoctors(
      page,
      limit,
      search,
      specialization,
      onlyAvailable
    );

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
      message: 'Error fetching doctors',
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
router.put('/online-status', auth, async (req, res) => {
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
      message: 'Online status updated successfully',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update online status',
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
router.get('/:id/online-status', async (req, res) => {
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
      message: 'Failed to get online status',
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
router.get('/available', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';
    const specialization = req.query.specialization || '';

    const result = await doctorController.getAvailableDoctors(
      page,
      limit,
      search,
      specialization
    );

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
      message: 'Error fetching available doctors',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/doctors/professional-details/{id}/certificates:
 *   get:
 *     summary: Get doctor's current certificates
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
 *     responses:
 *       200:
 *         description: Certificates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           uploadedAt:
 *                             type: string
 *                           key:
 *                             type: string
 *                     totalCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not authorized to view this doctor's certificates
 *       404:
 *         description: Doctor not found
 */
router.get('/professional-details/:id/certificates', auth, async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id);

    // Check if the authenticated user is a doctor
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Doctors can only view their own certificates
    if (req.user.id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own certificates',
      });
    }

    // Get current certificates
    const certificates = await getCurrentCertificates(doctorId);

    res.json({
      success: true,
      data: {
        certificates,
        totalCount: certificates.length,
      },
    });
  } catch (error) {
    console.error('Error getting certificates:', error);

    res.status(400).json({
      success: false,
      message: 'Failed to get certificates',
      error: error.message,
    });
  }
});

// =============================================
// VDC (Video/Digital Consultation) Routes
// =============================================

/**
 * @swagger
 * /api/doctors/vdc-settings:
 *   get:
 *     summary: Get doctor's VDC (Video/Digital Consultation) settings
 *     tags: [Doctors - VDC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VDC settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     vdcEnabled:
 *                       type: boolean
 *                       description: Whether VDC is enabled for this doctor
 *                       example: true
 *                     consultationFees:
 *                       type: number
 *                       format: float
 *                       description: Consultation fee in local currency
 *                       example: 500.00
 *                     availableDays:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Days of the week when doctor is available
 *                       example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *                     availableTimeSlots:
 *                       type: object
 *                       description: Time slots for each day
 *                       example: {"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "10:00", "end": "18:00"}}
 *                     paymentOptions:
 *                       type: object
 *                       description: Payment options for receiving consultation fees
 *                       example: {"upi": {"enabled": true, "upiId": "doctor@paytm"}, "bank": {"enabled": true, "accountNumber": "1234567890", "accountHolderName": "Dr. John Smith", "ifscCode": "HDFC0001234", "bankName": "HDFC Bank"}}
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor professional details not found
 *   put:
 *     summary: Update doctor's VDC (Video/Digital Consultation) settings
 *     tags: [Doctors - VDC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vdcEnabled:
 *                 type: boolean
 *                 description: Enable or disable VDC for this doctor
 *                 example: true
 *               consultationFees:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Consultation fee in local currency (required if enabling VDC)
 *                 example: 500.00
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
 *                 description: Days of the week when doctor is available for VDC
 *                 example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *               availableTimeSlots:
 *                 type: object
 *                 description: Time slots for each available day
 *                 example: {"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "10:00", "end": "18:00"}}
 *               paymentOptions:
 *                 type: object
 *                 description: Payment options for receiving consultation fees
 *                 properties:
 *                   upi:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                         description: Enable UPI payments
 *                         example: true
 *                       upiId:
 *                         type: string
 *                         description: UPI ID for receiving payments
 *                         example: "doctor@paytm"
 *                       qrCode:
 *                         type: string
 *                         description: Base64 encoded QR code image
 *                         example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
 *                   bank:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                         description: Enable bank transfer payments
 *                         example: true
 *                       accountNumber:
 *                         type: string
 *                         description: Bank account number
 *                         example: "1234567890"
 *                       accountHolderName:
 *                         type: string
 *                         description: Account holder name
 *                         example: "Dr. John Smith"
 *                       ifscCode:
 *                         type: string
 *                         description: IFSC code of the bank
 *                         example: "HDFC0001234"
 *                       bankName:
 *                         type: string
 *                         description: Name of the bank
 *                         example: "HDFC Bank"
 *             anyOf:
 *               - required: ["vdcEnabled"]
 *               - required: ["consultationFees"]
 *               - required: ["availableDays"]
 *               - required: ["availableTimeSlots"]
 *     responses:
 *       200:
 *         description: VDC settings updated successfully
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
 *                   example: "VDC settings updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vdcEnabled:
 *                       type: boolean
 *                       example: true
 *                     consultationFees:
 *                       type: number
 *                       format: float
 *                       example: 500.00
 *                     availableDays:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *                     availableTimeSlots:
 *                       type: object
 *                       example: {"monday": {"start": "09:00", "end": "17:00"}}
 *       400:
 *         description: Bad request - Invalid data or validation error
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
 *                   example: "Consultation fees cannot be negative"
 *                 error:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */
/**
 * @swagger
 * /api/doctors/vdc-status:
 *   get:
 *     summary: Check if doctor has opted for VDC (Video/Digital Consultation) services
 *     tags: [Doctors - VDC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VDC status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     vdcEnabled:
 *                       type: boolean
 *                       description: Whether VDC is enabled for this doctor
 *                       example: true
 *                     hasOptedVDC:
 *                       type: boolean
 *                       description: Same as vdcEnabled (for clarity)
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor professional details not found
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
 *                   example: "Doctor professional details not found"
 */
router.get('/vdc-status', auth, vdcController.checkVDCStatus);

router.get('/vdc-settings', auth, vdcController.getVDCSettings);
router.put('/vdc-settings', auth, vdcController.updateVDCSettings);

// =============================================
// Doctor Language Routes
// =============================================

/**
 * @swagger
 * /api/doctors/language:
 *   get:
 *     summary: Get doctor's UI language preference
 *     tags: [Doctors - Language]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Language preference retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uiLanguage:
 *                       type: string
 *                       description: Current UI language preference
 *                       example: "en"
 *                       enum: ["en", "hi", "ta", "te", "ml", "kn"]
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 *   post:
 *     summary: Update doctor's UI language preference
 *     tags: [Doctors - Language]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *             properties:
 *               language:
 *                 type: string
 *                 description: Language code for UI display
 *                 example: "hi"
 *                 enum: ["en", "hi", "ta", "te", "ml", "kn"]
 *     responses:
 *       200:
 *         description: Language updated successfully
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
 *                   example: "Language updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     uiLanguage:
 *                       type: string
 *                       example: "hi"
 *       400:
 *         description: Bad request - Invalid language
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
 *                   example: "Unsupported language. Supported languages: en, hi, ta, te, ml, kn"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */
router.get('/language', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const result = await doctorController.getDoctorLanguage(doctorId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.post('/language', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language is required',
      });
    }

    const result = await doctorController.updateDoctorLanguage(doctorId, language);

    res.json({
      success: true,
      message: 'Language updated successfully',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
