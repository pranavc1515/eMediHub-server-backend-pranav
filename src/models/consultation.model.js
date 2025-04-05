const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Patient = require('./patient.model');
const { DoctorPersonal } = require('./doctor.model');

const Consultation = sequelize.define(
  'Consultation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
    },
    consultationType: {
      type: DataTypes.ENUM('video', 'in-person'),
      defaultValue: 'video',
    },
    roomName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancelledBy: {
      type: DataTypes.ENUM('patient', 'doctor'),
      allowNull: true,
    },
    actualStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Establish relationships
Consultation.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Consultation.belongsTo(DoctorPersonal, { foreignKey: 'doctorId', as: 'doctor' });

module.exports = Consultation; 