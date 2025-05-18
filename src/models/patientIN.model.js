const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PatientIN = sequelize.define(
  'PatientIN',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    marital_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    language_code: {
      type: DataTypes.STRING(5),
      defaultValue: 'en',
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    isPhoneVerify: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
    },
    isEmailVerify: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
    },
    otp: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'patient_personal',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

const PatientINDetails = sequelize.define(
  'PatientINDetails',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    diet: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profession: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    food_allergies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    drug_allergies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    blood_group: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    implants: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    surgeries: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    family_medical_history: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'patient_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Define associations
PatientIN.hasOne(PatientINDetails, { foreignKey: 'user_id', as: 'details' });
PatientINDetails.belongsTo(PatientIN, { foreignKey: 'user_id', as: 'patient' });

module.exports = { PatientIN, PatientINDetails };
