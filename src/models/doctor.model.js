const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  qualification: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  preferredLanguage: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  consultationFees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  medicalLicenseNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  licenseExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  licenseCountry: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hospitalClinicName: {
    type: DataTypes.STRING(255)
  },
  profilePicture: {
    type: DataTypes.STRING(255)
  },
  languagesSpoken: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  availableDays: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  availableTimeSlots: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  timeZone: {
    type: DataTypes.STRING(50)
  },
  additionalCharges: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  paymentMethods: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  upiId: {
    type: DataTypes.STRING(100)
  },
  previousWorkExperience: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  awards: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  certifications: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  consultationModes: {
    type: DataTypes.JSON,
    defaultValue: ['Video', 'Audio', 'Text']
  },
  bio: {
    type: DataTypes.TEXT
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  numberOfReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'doctors',
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
    }
  }
});

// Instance method to validate password
Doctor.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Doctor; 