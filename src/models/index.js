/**
 * Models index file
 * Exports all models with proper associations
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const { DoctorPersonal, DoctorProfessional } = require('./doctor.model');
const Patient = require('./patient.model');
const Consultation = require('./consultation.model');
const PatientQueue = require('./patientQueue.model');
const Prescription = require('./prescription.model');
const Family = require('./family.model');
const { User } = require('./user.model');

// Set custom hooks for models
const addModelHooks = () => {
  sequelize.beforeDefine((attributes, options) => {
    // For all UUID fields using CHAR(36), set binary collation
    for (const [name, fieldConfig] of Object.entries(attributes)) {
      if (fieldConfig.type instanceof DataTypes.CHAR &&
        (name === 'id' || name.endsWith('Id')) &&
        fieldConfig.type.options &&
        fieldConfig.type.options.length === 36) {

        // Add binary collation option for UUID fields
        fieldConfig.type.options = {
          ...fieldConfig.type.options,
          collate: 'utf8mb4_bin'
        };
      }
    }
  });
};

// Establish all model relationships
const setupAssociations = () => {
  // Doctor relationships were already set up in doctor.model.js

  // Consultations relationships
  Consultation.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
  Consultation.belongsTo(DoctorPersonal, { foreignKey: 'doctorId', as: 'doctor' });

  // PatientQueue relationships
  PatientQueue.belongsTo(Patient, {
    foreignKey: 'patientId',
    as: 'patient',
    onDelete: 'CASCADE',
  });

  PatientQueue.belongsTo(DoctorPersonal, {
    foreignKey: 'doctorId',
    as: 'doctor',
    onDelete: 'CASCADE',
  });

  PatientQueue.belongsTo(Consultation, {
    foreignKey: 'consultationId',
    as: 'consultation',
    onDelete: 'SET NULL',
  });

  // Reverse association: Consultation has many PatientQueue entries
  Consultation.hasMany(PatientQueue, {
    foreignKey: 'consultationId',
    as: 'queueEntries',
    onDelete: 'SET NULL',
  });

  // Family relationships (without strict foreign key constraints)
  // Note: We're not setting up strict foreign key relationships to allow flexibility
  // The userId field will be a simple string reference
};

// Initialize all models
const initializeModels = () => {
  addModelHooks();
  setupAssociations();
};

// Export models and initialization function
module.exports = {
  sequelize,
  DoctorPersonal,
  DoctorProfessional,
  Patient,
  Consultation,
  PatientQueue,
  Prescription,
  Family,
  User,
  initializeModels
}; 