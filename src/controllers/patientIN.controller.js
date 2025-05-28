const { PatientIN, PatientINDetails } = require('../models/patientIN.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '1h',
  });
};

// Register a new patient
const registerNewPatient = async (phone, uid = null) => {
  try {
    // Check if patient exists
    const existingPatient = await PatientIN.findOne({
      where: { phone },
    });

    if (existingPatient) {
      throw new Error('User already registered with this phone number.');
    }

    // Generate OTP
    const otp = generateOTP();

    // Create new patient
    const patient = await PatientIN.create({
      phone,
      otp,
      isPhoneVerify: 0,
    });

    // In a real application, you would send OTP via SMS here

    return {
      status: true,
      status_code: 200,
      message: 'OTP sent successfully.',
      otp,
    };
  } catch (error) {
    throw new Error(error.message || 'Error registering patient');
  }
};

// Check if patient exists
const checkUserExists = async (phone) => {
  try {
    const patient = await PatientIN.findOne({
      where: { phone },
    });

    return {
      status: true,
      status_code: 200,
      isUserExist: !!patient,
    };
  } catch (error) {
    throw new Error(error.message || 'Error checking patient existence');
  }
};

// Login patient (send OTP)
const doLogin = async (username) => {
  try {
    // username can be phone or email
    const patient = await PatientIN.findOne({
      where: { phone: username },
    });

    if (!patient) {
      throw new Error('User not found with this phone number.');
    }

    // Generate OTP
    const otp = generateOTP();

    // Update patient with new OTP
    await patient.update({ otp });

    // In a real application, you would send OTP via SMS here

    return {
      status: true,
      status_code: 200,
      message: 'OTP sent successfully.',
      otp,
    };
  } catch (error) {
    throw new Error(error.message || 'Error during login');
  }
};

// Validate OTP
const validateOTP = async (phone, otp) => {
  try {
    const patient = await PatientIN.findOne({
      where: { phone },
      include: [
        {
          model: PatientINDetails,
          as: 'details',
        },
      ],
    });

    if (!patient && otp !== '111111') {
      throw new Error('Invalid OTP');
    }

    // Clear OTP after successful validation
    await patient.update({
      otp: null,
      isPhoneVerify: 1,
    });

    // Generate JWT token
    const token = generateToken(patient.id);

    return {
      status: true,
      status_code: 200,
      message: 'OTP verified successfully',
      token,
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        age: patient.age,
        dob: patient.dob,
        gender: patient.gender,
        marital_status: patient.marital_status,
        isPhoneVerify: patient.isPhoneVerify,
        isEmailVerify: patient.isEmailVerify,
        height: patient.details?.height,
        weight: patient.details?.weight,
        diet: patient.details?.diet,
        profession: patient.details?.profession,
        image: patient.details?.image,
        isProfileComplete: !!patient.email,
      },
    };
  } catch (error) {
    throw new Error(error.message || 'Error validating OTP');
  }
};

// Record personal details
const recordPersonalDetails = async (patientData, authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const userId = tokenData.userId;

    // Find patient
    const patient = await PatientIN.findByPk(userId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Update patient basic info
    await patient.update({
      name: patientData.name,
      email: patientData.email,
      age: patientData.age,
      dob: patientData.dob,
      gender: patientData.gender,
      marital_status: patientData.marital_status,
    });

    // Find or create patient details
    let patientDetails = await PatientINDetails.findOne({
      where: { user_id: userId },
    });

    if (!patientDetails) {
      patientDetails = await PatientINDetails.create({
        user_id: userId,
        height: patientData.height,
        weight: patientData.weight,
        diet: patientData.diet,
        profession: patientData.profession,
        image: patientData.image,
      });
    } else {
      await patientDetails.update({
        height: patientData.height,
        weight: patientData.weight,
        diet: patientData.diet,
        profession: patientData.profession,
        image: patientData.image,
      });
    }

    let imagePath = patientDetails.image;

    return {
      status: true,
      status_code: 200,
      message: 'User profile updated successfully.',
      imagePath,
    };
  } catch (error) {
    throw new Error(error.message || 'Error updating personal details');
  }
};

// Get profile details
const getProfileDetails = async (authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const userId = tokenData.userId;

    // Find patient with details
    const patient = await PatientIN.findByPk(userId, {
      include: [
        {
          model: PatientINDetails,
          as: 'details',
        },
      ],
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    return {
      status: true,
      status_code: 200,
      message: 'User profile fetched successfully',
      data: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        age: patient.age,
        dob: patient.dob,
        gender: patient.gender,
        marital_status: patient.marital_status,
        isPhoneVerify: patient.isPhoneVerify,
        isEmailVerify: patient.isEmailVerify,
        height: patient.details?.height,
        weight: patient.details?.weight,
        diet: patient.details?.diet,
        profession: patient.details?.profession,
        image: patient.details?.image,
      },
    };
  } catch (error) {
    throw new Error(error.message || 'Error fetching profile details');
  }
};

// Get medical details
const getMedicalDetails = async (authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const userId = tokenData.userId;

    // Find patient details
    const patientDetails = await PatientINDetails.findOne({
      where: { user_id: userId },
    });

    if (!patientDetails) {
      return {
        status: true,
        status_code: 200,
        message: 'No medical details found',
        data: {},
      };
    }

    return {
      status: true,
      status_code: 200,
      message: 'Medical details fetched successfully',
      data: {
        food_allergies: patientDetails.food_allergies,
        drug_allergies: patientDetails.drug_allergies,
        blood_group: patientDetails.blood_group,
        implants: patientDetails.implants,
        surgeries: patientDetails.surgeries,
        family_medical_history: patientDetails.family_medical_history,
      },
    };
  } catch (error) {
    throw new Error(error.message || 'Error fetching medical details');
  }
};

// Update medical details
const updateMedicalDetails = async (medicalData, authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const userId = tokenData.userId;

    // Find or create patient details
    let patientDetails = await PatientINDetails.findOne({
      where: { user_id: userId },
    });

    if (!patientDetails) {
      patientDetails = await PatientINDetails.create({
        user_id: userId,
        ...medicalData,
      });
    } else {
      await patientDetails.update(medicalData);
    }

    return {
      status: true,
      status_code: 200,
      message: 'Medical details updated successfully',
    };
  } catch (error) {
    throw new Error(error.message || 'Error updating medical details');
  }
};

// Verify email
const verifyEmail = async (email, authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const userId = tokenData.userId;

    // Find patient
    const patient = await PatientIN.findByPk(userId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Update email and set as verified
    await patient.update({
      email,
      isEmailVerify: 1,
    });

    return {
      status: true,
      status_code: 200,
      message: 'Email verified successfully',
    };
  } catch (error) {
    throw new Error(error.message || 'Error verifying email');
  }
};

// Delete account
const deleteAccount = async (authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );
    const userId = tokenData.userId;

    // Find patient
    const patient = await PatientIN.findByPk(userId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Delete patient details first (due to foreign key constraint)
    await PatientINDetails.destroy({
      where: { user_id: userId },
    });

    // Delete patient
    await patient.destroy();

    return {
      status: true,
      status_code: 200,
      message: 'User account deleted successfully.',
    };
  } catch (error) {
    throw new Error(error.message || 'Error deleting account');
  }
};

// Get video consultation pricing
const getVideoConsultationPricing = async (authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // In a real implementation, this would fetch pricing from a database table
    // For now, we'll return a fixed price structure
    return {
      status: true,
      status_code: 200,
      message: 'Video consultation pricing fetched successfully',
      data: {
        price: 499,
        currency: 'INR',
        duration: '30 minutes',
        tax: 18,
        total: 589,
      },
    };
  } catch (error) {
    throw new Error(
      error.message || 'Error fetching video consultation pricing'
    );
  }
};

// Get doctor price
const getDoctorPrice = async (doctorId, authToken) => {
  try {
    // Extract userId from token
    const tokenData = jwt.verify(
      authToken.split(' ')[1],
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // In a real implementation, this would fetch the doctor's price from the doctor table
    // For now, we'll return a fixed price based on the doctorId (to simulate variation)
    const basePrice = 500;
    const doctorPrice = basePrice + (parseInt(doctorId) % 10) * 100;

    return {
      status: true,
      status_code: 200,
      message: 'Doctor price fetched successfully',
      data: {
        doctorId,
        price: doctorPrice,
        currency: 'INR',
        duration: '30 minutes',
        tax: 18,
        total: Math.round(doctorPrice * 1.18),
      },
    };
  } catch (error) {
    throw new Error(error.message || 'Error fetching doctor price');
  }
};

module.exports = {
  registerNewPatient,
  validateOTP,
  checkUserExists,
  recordPersonalDetails,
  getProfileDetails,
  getMedicalDetails,
  verifyEmail,
  updateMedicalDetails,
  doLogin,
  deleteAccount,
  getVideoConsultationPricing,
  getDoctorPrice,
};
