const jwt = require('jsonwebtoken');
const { DoctorPersonal, DoctorProfessional } = require('../models/doctor.model');

// Utility function to generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register a new doctor
exports.registerDoctor = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Check if doctor already exists
    let doctor = await DoctorPersonal.findOne({ where: { phoneNumber } });
    
    if (!doctor) {
      // Create new doctor if not exists
      doctor = await DoctorPersonal.create({
        phoneNumber,
        status: 'Active'
      });

      // Create an empty professional record for the doctor
      await DoctorProfessional.create({
        doctorId: doctor.id,
        status: 'Pending Verification'
      });
    }

    // Generate OTP (in a real application, send via SMS)
    const otp = generateOTP();
    
    // In a real application, store OTP in database or redis with expiry
    // For demo purposes, we'll use 111111 as the OTP
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phoneNumber
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Validate OTP and authenticate doctor
exports.validateOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Find doctor by phone number
    const doctor = await DoctorPersonal.findOne({ where: { phoneNumber } });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // For demo purposes, accept 111111 as valid OTP
    if (otp !== '111111') {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: doctor.id, phoneNumber: doctor.phoneNumber, type: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'OTP validated successfully',
      data: {
        token,
        doctor: {
          id: doctor.id,
          phoneNumber: doctor.phoneNumber,
          isProfileComplete: !!doctor.fullName
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'OTP validation failed',
      error: error.message
    });
  }
};

// Check if doctor exists
exports.checkDoctorExists = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const doctor = await DoctorPersonal.findOne({ where: { phoneNumber } });

    res.json({
      success: true,
      exists: !!doctor,
      data: doctor ? {
        id: doctor.id,
        phoneNumber: doctor.phoneNumber,
        isProfileComplete: !!doctor.fullName
      } : null
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Check failed',
      error: error.message
    });
  }
};

// Update doctor's personal details
exports.updatePersonalDetails = async (req, res) => {
  try {
    const { fullName, email, gender, dob, profilePhoto } = req.body;
    const doctorId = req.user.id;

    // Find doctor
    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update doctor personal details
    const updatedDoctor = await doctor.update({
      fullName: fullName || doctor.fullName,
      email: email || doctor.email,
      gender: gender || doctor.gender,
      dob: dob || doctor.dob,
      profilePhoto: profilePhoto || doctor.profilePhoto
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
        emailVerified: updatedDoctor.emailVerified
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update personal details',
      error: error.message
    });
  }
};

// Update doctor's professional details
exports.updateProfessionalDetails = async (req, res) => {
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
      consultationFees
    } = req.body;
    
    const doctorId = req.user.id;

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
};

// Get doctor's complete profile
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Find doctor with professional details
    const doctor = await DoctorPersonal.findByPk(doctorId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: DoctorProfessional,
        attributes: { exclude: ['id', 'doctorId'] }
      }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Verify doctor's email
exports.verifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const doctorId = req.user.id;

    // Find doctor
    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update email (in a real app, you would send a verification email)
    await doctor.update({
      email: email || doctor.email
    });

    // For demo purposes, just mark it as verified
    // In a real app, this would be done through a verification link
    await doctor.update({
      emailVerified: true
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        id: doctor.id,
        email: doctor.email,
        emailVerified: doctor.emailVerified
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message
    });
  }
};

// Get all verified doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    const whereProf = { status: 'Verified' };
    
    if (specialization) {
      whereProf.specialization = specialization;
    }

    // Find all verified doctors
    const doctors = await DoctorPersonal.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: DoctorProfessional,
        where: whereProf,
        attributes: { exclude: ['id'] }
      }]
    });

    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
}; 