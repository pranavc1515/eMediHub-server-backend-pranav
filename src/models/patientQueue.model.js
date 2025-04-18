const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./patient.model');
const { DoctorPersonal } = require('./doctor.model');
const Consultation = require('./consultation.model');

const PatientQueue = sequelize.define(
  'PatientQueue',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    consultationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Consultations',
        key: 'id',
      },
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Patients',
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DoctorPersonals',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('waiting', 'in_consultation', 'done', 'left'),
      defaultValue: 'waiting',
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    estimatedWaitTime: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    roomName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    socketId: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  {
    timestamps: true,
  }
);

// Establish relationships
PatientQueue.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
PatientQueue.belongsTo(DoctorPersonal, { foreignKey: 'doctorId', as: 'doctor' });
PatientQueue.belongsTo(Consultation, { foreignKey: 'consultationId', as: 'consultation' });

module.exports = PatientQueue; 