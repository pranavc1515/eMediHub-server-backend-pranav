const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Consultation = require('./consultation.model');
const { PatientIN } = require('./patientIN.model');
const { DoctorPersonal } = require('./doctor.model');

const Prescription = sequelize.define(
  'Prescription',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    consultationId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Consultation,
        key: 'id',
      },
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: PatientIN,
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.STRING,
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
Prescription.belongsTo(PatientIN, { foreignKey: 'patientId', as: 'patient' });
Prescription.belongsTo(DoctorPersonal, {
  foreignKey: 'doctorId',
  as: 'doctor',
});

module.exports = Prescription;
