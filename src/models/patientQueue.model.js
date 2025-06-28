const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { DoctorPersonal } = require('./doctor.model');
const Consultation = require('./consultation.model');

const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;

const PatientQueue = sequelize.define(
  'PatientQueue',
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
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('waiting', 'in_consultation', 'done', 'left'),
      defaultValue: 'waiting',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    roomName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    socketId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Consultation,
        key: 'id',
      },
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    hasJoinedRoom: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    consultationStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'patient_queue',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    timestamps: true,
  }
);

// Establish relationships
// Only establish patient relationship if NOT using microservice
if (!ENABLE_PATIENT_MICROSERVICE) {
  const { PatientIN } = require('./patientIN.model');
  PatientQueue.belongsTo(PatientIN, {
    foreignKey: 'patientId',
    as: 'patient',
    onDelete: 'CASCADE',
  });
}

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

// Create hook to copy patient data
// PatientQueue.beforeCreate(async (queue, options) => {
//   try {
//     // Get patient data
//     const patient = await PatientIN.findByPk(queue.patientId);
//     if (patient) {
//       queue.patientFirstName = patient.firstName;
//       queue.patientLastName = patient.lastName;
//     }
//   } catch (error) {
//     console.error('Error in PatientQueue beforeCreate hook:', error);
//   }
// });

module.exports = PatientQueue;
