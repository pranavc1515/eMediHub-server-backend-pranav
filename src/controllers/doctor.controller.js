const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  DoctorPersonal,
  DoctorProfessional,
} = require('../models/doctor.model');
const { Op } = require('sequelize');

// Utility function to generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register a new doctor with phone number
const registerDoctor = async (phoneNumber) => {
  try {
    // Validate phone number format (10 digits)
    if (!phoneNumber || !/^\+91[0-9]{10}$/.test(phoneNumber)) {
      throw new Error(
        'Invalid phone number format. Please provide a valid phone number with the country code +91 (e.g., +919876543210).'
      );
    }

    // Check if doctor already exists
    let doctor = await DoctorPersonal.findOne({ where: { phoneNumber } });

    if (!doctor) {
      // Create new doctor if not exists
      doctor = await DoctorPersonal.create({
        phoneNumber,
        status: 'Active',
      });

      // Create an empty professional record for the doctor
      await DoctorProfessional.create({
        doctorId: doctor.id,
        status: 'Verified',
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // For demo purposes, using 111111 as the OTP
    // In production:
    // 1. Store OTP in database/redis with expiry
    // 2. Implement rate limiting for OTP generation
    // 3. Send OTP via SMS gateway

    return {
      phoneNumber,
    };
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
};

// Login for existing doctor with phone number
const loginDoctor = async (phoneNumber) => {
  try {
    // Validate phone number format (10 digits)
    if (!phoneNumber || !/^\+91[0-9]{10}$/.test(phoneNumber)) {
      throw new Error(
        'Invalid phone number format. Please provide a valid phone number with the country code +91 (e.g., +919876543210).'
      );
    }

    // Check if doctor exists
    const doctor = await DoctorPersonal.findOne({ where: { phoneNumber } });

    if (!doctor) {
      throw new Error('Doctor not found with this phone number');
    }

    // Generate OTP
    const otp = generateOTP();

    // For demo purposes, using 111111 as the OTP
    // In production:
    // 1. Store OTP in database/redis with expiry
    // 2. Implement rate limiting for OTP generation
    // 3. Send OTP via SMS gateway

    return {
      phoneNumber,
    };
  } catch (error) {
    throw new Error(`${error.message}`);
  }
};

// Validate OTP and authenticate doctor
const validateOTP = async (phoneNumber, otp) => {
  try {
    if (!phoneNumber || !otp) {
      throw new Error('Phone number and OTP are required');
    }

    // Find doctor by phone number
    const doctor = await DoctorPersonal.findOne({ where: { phoneNumber } });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // For demo purposes, accept 111111 as valid OTP
    if (otp !== '111111') {
      throw new Error('Invalid OTP');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: doctor.id, phoneNumber: doctor.phoneNumber, type: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
      status: true,
      status_code: 200,
      message: 'OTP verified successfully',
      token,
      doctor: {
        id: doctor.id,
        name: doctor.fullName,
        email: doctor.email,
        gender: doctor.gender,
        dob: doctor.dob,
        profilePhoto: doctor.profilePhoto,
        isPhoneVerify: doctor.isPhoneVerify,
        isEmailVerify: doctor.isEmailVerify,
        height: doctor.details?.height,
        weight: doctor.details?.weight,
        profession: doctor.details?.profession,
        image: doctor.details?.image,
        phoneNumber: doctor.phoneNumber,
        isProfileComplete: !!doctor.email,
      },
    };
  } catch (error) {
    throw new Error(`OTP validation failed: ${error.message}`);
  }
};

// Check if doctor exists by phone number
const checkDoctorExists = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const doctor = await DoctorPersonal.findOne({ where: { phoneNumber } });

    return {
      exists: !!doctor,
      data: doctor
        ? {
            id: doctor.id,
            phoneNumber: doctor.phoneNumber,
            isProfileComplete: !!doctor.fullName,
          }
        : null,
    };
  } catch (error) {
    throw new Error(`Check failed: ${error.message}`);
  }
};

// Update doctor's personal details
const updatePersonalDetails = async (doctorId, personalData) => {
  try {
    const { fullName, email, gender, dob, profilePhoto } = personalData;

    // Find doctor
    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Update doctor personal details
    const updatedDoctor = await doctor.update({
      fullName: fullName || doctor.fullName,
      email: email || doctor.email,
      gender: gender || doctor.gender,
      dob: dob || doctor.dob,
      profilePhoto: profilePhoto || doctor.profilePhoto,
    });

    return {
      id: updatedDoctor.id,
      fullName: updatedDoctor.fullName,
      phoneNumber: updatedDoctor.phoneNumber,
      email: updatedDoctor.email,
      gender: updatedDoctor.gender,
      dob: updatedDoctor.dob,
      profilePhoto: updatedDoctor.profilePhoto,
      status: updatedDoctor.status,
      emailVerified: updatedDoctor.emailVerified,
    };
  } catch (error) {
    throw new Error(`Failed to update personal details: ${error.message}`);
  }
};

// Update doctor's professional details
const updateProfessionalDetails = async (doctorId, professionalData) => {
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
      availableDays,
    } = professionalData;

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

    // Check if the registration number is unique if it's being changed
    if (
      registrationNumber &&
      registrationNumber !== professional.registrationNumber
    ) {
      const existingWithRegNumber = await DoctorProfessional.findOne({
        where: {
          registrationNumber,
          doctorId: { [Op.ne]: doctorId }, // exclude the current doctor
        },
      });

      if (existingWithRegNumber) {
        throw new Error(
          'This registration number is already in use by another doctor'
        );
      }
    }

    // Update professional details
    await professional.update({
      qualification:
        qualification !== undefined
          ? qualification
          : professional.qualification,
      specialization:
        specialization !== undefined
          ? specialization
          : professional.specialization,
      registrationNumber:
        registrationNumber !== undefined
          ? registrationNumber
          : professional.registrationNumber,
      registrationState:
        registrationState !== undefined
          ? registrationState
          : professional.registrationState,
      expiryDate:
        expiryDate !== undefined ? expiryDate : professional.expiryDate,
      certificates:
        certificates !== undefined ? certificates : professional.certificates,
      clinicName:
        clinicName !== undefined ? clinicName : professional.clinicName,
      yearsOfExperience:
        yearsOfExperience !== undefined
          ? yearsOfExperience
          : professional.yearsOfExperience,
      communicationLanguages:
        communicationLanguages !== undefined
          ? communicationLanguages
          : professional.communicationLanguages,
      consultationFees:
        consultationFees !== undefined
          ? consultationFees
          : professional.consultationFees,
      availableDays:
        availableDays !== undefined
          ? availableDays
          : professional.availableDays,
      status: 'Verified',
    });

    return professional;
  } catch (error) {
    throw new Error(`Failed to update professional details: ${error.message}`);
  }
};

// Update doctor online status
const updateOnlineStatus = async (doctorId, status) => {
  try {
    if (!['available', 'offline'].includes(status)) {
      throw new Error(
        'Invalid status. Status must be "available" or "offline"'
      );
    }

    const doctor = await DoctorPersonal.findByPk(doctorId);

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    await doctor.update({
      isOnline: status,
      lastSeen: status === 'offline' ? new Date() : doctor.lastSeen,
    });

    return {
      id: doctor.id,
      isOnline: doctor.isOnline,
      lastSeen: doctor.lastSeen,
    };
  } catch (error) {
    throw new Error(`Error updating online status: ${error.message}`);
  }
};

// Get doctor online status
const getOnlineStatus = async (doctorId) => {
  try {
    const doctor = await DoctorPersonal.findByPk(doctorId, {
      attributes: ['id', 'fullName', 'isOnline', 'lastSeen'],
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return {
      id: doctor.id,
      fullName: doctor.fullName,
      isOnline: doctor.isOnline,
      lastSeen: doctor.lastSeen,
    };
  } catch (error) {
    throw new Error(`Error fetching online status: ${error.message}`);
  }
};

// Get all verified doctors with pagination and search
const getAllDoctors = async (
  page = 1,
  limit = 15,
  searchQuery = '',
  specialization = '',
  onlyAvailable = false
) => {
  try {
    const offset = (page - 1) * limit;
    const whereProf = { status: 'Verified' };
    const wherePers = {};

    // Add specialization filter if provided
    if (specialization && specialization !== 'all') {
      whereProf.specialization = specialization;
    }

    // Add name search if provided
    if (searchQuery) {
      wherePers.fullName = {
        [Op.like]: `%${searchQuery}%`,
      };
    }

    // Add availability filter based on onlyAvailable parameter
    if (onlyAvailable !== undefined) {
      wherePers.isOnline = onlyAvailable ? 'available' : 'offline';
    }

    // Get total count and doctors in a single query using Promise.all
    const [totalCount, doctors] = await Promise.all([
      DoctorPersonal.count({
        where: wherePers,
        include: [
          {
            model: DoctorProfessional,
            where: whereProf,
            attributes: [],
          },
        ],
      }),
      DoctorPersonal.findAll({
        where: wherePers,
        attributes: {
          exclude: ['password'],
        },
        include: [
          {
            model: DoctorProfessional,
            where: whereProf,
            attributes: { exclude: ['id'] },
          },
        ],
        offset,
        limit,
        order: [['fullName', 'ASC']],
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Validate page number
    const validatedPage = page > totalPages ? 1 : page;

    if (validatedPage !== page) {
      // If page number was invalid, recursively call with valid page
      return getAllDoctors(
        validatedPage,
        limit,
        searchQuery,
        specialization,
        onlyAvailable
      );
    }

    return {
      doctors,
      totalCount,
      totalPages,
      currentPage: validatedPage,
      pageSize: limit,
    };
  } catch (error) {
    throw new Error(`Error fetching doctors: ${error.message}`);
  }
};

// Get available doctors with pagination and search
const getAvailableDoctors = async (
  page = 1,
  limit = 15,
  searchQuery = '',
  specialization = ''
) => {
  try {
    const offset = (page - 1) * limit;
    const whereProf = { status: 'Verified' };
    const wherePers = { isOnline: 'available' };

    // Add specialization filter if provided
    if (specialization) {
      whereProf.specialization = specialization;
    }

    // Add name search if provided
    if (searchQuery) {
      wherePers.fullName = {
        [Op.like]: `%${searchQuery}%`,
      };
    }

    // Get total count for pagination
    const totalCount = await DoctorPersonal.count({
      where: wherePers,
      include: [
        {
          model: DoctorProfessional,
          where: whereProf,
          attributes: [],
        },
      ],
    });

    // Get available doctors with pagination
    const doctors = await DoctorPersonal.findAll({
      where: wherePers,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: DoctorProfessional,
          where: whereProf,
          attributes: { exclude: ['id'] },
        },
      ],
      offset,
      limit,
      order: [['fullName', 'ASC']],
    });

    return {
      doctors,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      pageSize: limit,
    };
  } catch (error) {
    throw new Error(`Error fetching available doctors: ${error.message}`);
  }
};

// Export all doctor controller functions
module.exports = {
  registerDoctor,
  loginDoctor,
  validateOTP,
  checkDoctorExists,
  updatePersonalDetails,
  updateProfessionalDetails,
  updateOnlineStatus,
  getOnlineStatus,
  getAllDoctors,
  getAvailableDoctors,
};
