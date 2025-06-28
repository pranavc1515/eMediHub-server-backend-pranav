const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Consultation = require('./consultation.model');
const { DoctorPersonal } = require('./doctor.model');

const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;

const Prescription = sequelize.define(
  'Prescription',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Consultation,
        key: 'id',
      },
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
    prescriptionUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    prescriptionType: {
      type: DataTypes.ENUM('file', 'custom'),
      defaultValue: 'file',
    },
    s3Key: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customPrescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    medicines: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

// Establish relationships
Prescription.belongsTo(Consultation, {
  foreignKey: 'consultationId',
  as: 'consultation',
});

// Only establish patient relationship if NOT using microservice
if (!ENABLE_PATIENT_MICROSERVICE) {
  const { PatientIN } = require('./patientIN.model');
  Prescription.belongsTo(PatientIN, { foreignKey: 'patientId', as: 'patient' });
}

Prescription.belongsTo(DoctorPersonal, {
  foreignKey: 'doctorId',
  as: 'doctor',
});

module.exports = Prescription;
