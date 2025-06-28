const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { DoctorPersonal } = require('./doctor.model');

const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;

const Consultation = sequelize.define(
  'Consultation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Only add foreign key constraint if NOT using microservice
      ...(ENABLE_PATIENT_MICROSERVICE ? {} : {
        references: {
          model: 'patient_personal', // Use table name instead of model
          key: 'id',
        },
      }),
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: DoctorPersonal,
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
      type: DataTypes.ENUM('pending', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'pending',
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
    twilioRoomSid: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    patientSocketId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    doctorSocketId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    queuePosition: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'consultation',
    timestamps: true,
  }
);

// Establish relationships
// Only establish patient relationship if NOT using microservice
if (!ENABLE_PATIENT_MICROSERVICE) {
  const { PatientIN } = require('./patientIN.model');
  Consultation.belongsTo(PatientIN, { foreignKey: 'patientId', as: 'patient' });
}

Consultation.belongsTo(DoctorPersonal, {
  foreignKey: 'doctorId',
  as: 'doctor',
});

// Set up association with PatientQueue after model is defined
// This will be called after all models are loaded to avoid circular dependency
Consultation.associate = (models) => {
  if (models.PatientQueue) {
    Consultation.hasMany(models.PatientQueue, {
      foreignKey: 'consultationId',
      as: 'queueEntries',
      onDelete: 'SET NULL',
    });
  }
};

module.exports = Consultation;
