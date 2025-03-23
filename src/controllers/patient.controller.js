const Patient = require('../models/patient.model');
const User = require('../models/user.model');

// Create a new patient profile
const createPatientProfile = async (userId, patientData) => {
  try {
    // Check if this is the main profile
    const isMainProfile = !patientData.relationship;

    // If main profile, check if one already exists
    if (isMainProfile) {
      const existingMainProfile = await Patient.findOne({
        where: {
          userId: userId,
          isMainUser: true,
        },
      });

      if (existingMainProfile) {
        throw new Error('Main patient profile already exists for this user');
      }
    }

    // Set additional fields
    patientData.userId = userId;
    patientData.isMainUser = isMainProfile;

    // Create patient record
    const patient = await Patient.create(patientData);

    // Remove sensitive information
    const patientResponse = patient.toJSON();
    delete patientResponse.password;

    return patientResponse;
  } catch (error) {
    throw new Error(`Error creating patient profile: ${error.message}`);
  }
};

// Get patient profiles for a user
const getPatientProfiles = async (userId) => {
  try {
    const patients = await Patient.findAll({
      where: { userId },
      attributes: { exclude: ['password'] },
      order: [
        ['isMainUser', 'DESC'], // Main user first
        ['createdAt', 'ASC'], // Then by creation date
      ],
    });

    return patients;
  } catch (error) {
    throw new Error(`Error fetching patient profiles: ${error.message}`);
  }
};

// Get single patient profile 
const getPatientProfile = async (patientId, userId) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: patientId,
        userId: userId,
      },
      attributes: { exclude: ['password'] },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    return patient;
  } catch (error) {
    throw new Error(`Error fetching patient profile: ${error.message}`);
  }
};

// Update patient profile
const updatePatientProfile = async (patientId, userId, updateData) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: patientId,
        userId: userId,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.isMainUser;
    delete updateData.password;

    // Update patient record
    await patient.update(updateData);

    // Remove sensitive information
    const patientResponse = patient.toJSON();
    delete patientResponse.password;

    return patientResponse;
  } catch (error) {
    throw new Error(`Error updating patient profile: ${error.message}`);
  }
};

// Delete patient profile
const deletePatientProfile = async (patientId, userId) => {
  try {
    const patient = await Patient.findOne({
      where: {
        id: patientId,
        userId: userId,
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    if (patient.isMainUser) {
      throw new Error('Cannot delete main user profile');
    }

    await patient.destroy();
    return true;
  } catch (error) {
    throw new Error(`Error deleting patient profile: ${error.message}`);
  }
};

module.exports = {
  createPatientProfile,
  getPatientProfiles,
  getPatientProfile,
  updatePatientProfile,
  deletePatientProfile
}; 