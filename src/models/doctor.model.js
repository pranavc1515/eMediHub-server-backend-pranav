const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Doctor = sequelize.define(
  'Doctor',
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
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hospitalClinicName: {
      type: DataTypes.STRING,
    },
    profilePicture: {
      type: DataTypes.STRING,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    languagesSpoken: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    availableDays: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    availableTimeSlots: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    timeZone: {
      type: DataTypes.STRING,
      defaultValue: 'Asia/Kolkata',
    },
    consultationFees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    additionalCharges: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    paymentMethods: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    upiId: {
      type: DataTypes.STRING,
    },
    medicalLicenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    licenseExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    licenseCountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    previousWorkExperience: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    awards: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    consultationModes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['Video', 'Audio', 'Text'],
    },
    bio: {
      type: DataTypes.TEXT,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    numberOfReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (doctor) => {
        if (doctor.password) {
          doctor.password = await bcrypt.hash(doctor.password, 10);
        }
      },
      beforeUpdate: async (doctor) => {
        if (doctor.changed('password')) {
          doctor.password = await bcrypt.hash(doctor.password, 10);
        }
      },
    }
  }
);

// Instance method to check password
Doctor.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Doctor; 