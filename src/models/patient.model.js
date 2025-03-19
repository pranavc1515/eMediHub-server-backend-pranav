const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const User = require('./user.model');

const Patient = sequelize.define(
  'Patient',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    isMainUser: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      description: 'Indicates if this patient record belongs to the main user account',
    },
    relationship: {
      type: DataTypes.STRING,
      allowNull: true,
      description: 'Relationship with the main user (e.g., self, spouse, child, parent)',
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Optional for family members
    },
    medicalHistory: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    allergies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'English',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (patient) => {
        if (patient.password) {
          patient.password = await bcrypt.hash(patient.password, 10);
        }
      },
      beforeUpdate: async (patient) => {
        if (patient.changed('password')) {
          patient.password = await bcrypt.hash(patient.password, 10);
        }
      },
    },
  }
);

// Instance method to check password
Patient.prototype.validatePassword = async function (password) {
  return this.password ? bcrypt.compare(password, this.password) : false;
};

// Define association with User
Patient.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Patient, { foreignKey: 'userId' });

module.exports = Patient; 