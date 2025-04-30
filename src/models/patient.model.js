const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Patient = sequelize.define(
  'Patient',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
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
  return bcrypt.compare(password, this.password);
};

module.exports = Patient; 