const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

// Doctor Personal Information Table
const DoctorPersonal = sequelize.define(
  'DoctorPersonal',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING(100),
      defaultValue: 'Dr. ',
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      // Remove unique constraint to avoid too many keys error
      // Will be managed by database itself
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      // Remove unique constraint to avoid too many keys error
      // Will be managed by database itself
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    profilePhoto: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    certificates: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: true,
    },
    isOnline: {
      type: DataTypes.ENUM('available', 'offline'),
      defaultValue: 'offline',
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'doctor_personal',
    timestamps: true,
    createdAt: 'timeCreated',
    updatedAt: 'timeUpdated',
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
    },
  }
);

// Doctor Professional Information Table
const DoctorProfessional = sequelize.define(
  'DoctorProfessional',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: DoctorPersonal,
        key: 'id',
      },
    },
    qualification: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    registrationState: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    certificates: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    clinicName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Verified', 'Unverified', 'Pending Verification'),
      defaultValue: 'Pending Verification',
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    communicationLanguages: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    consultationFees: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    availableDays: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    availableTimeSlots: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'doctor_professional',
    timestamps: true,
    createdAt: 'timeCreated',
    updatedAt: 'timeUpdated',
  }
);

// Establish the relation between Personal and Professional
DoctorPersonal.hasOne(DoctorProfessional, { foreignKey: 'doctorId' });
DoctorProfessional.belongsTo(DoctorPersonal, { foreignKey: 'doctorId' });

// Method to validate password
DoctorPersonal.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Set up the models for database synchronization
const syncModels = async () => {
  try {
    await DoctorPersonal.sync({ alter: true });
    await DoctorProfessional.sync({ alter: true });
    console.log('Doctor tables synchronized successfully');
  } catch (error) {
    console.error('Error syncing doctor tables:', error);
  }
};

syncModels();

module.exports = {
  DoctorPersonal,
  DoctorProfessional,
};
// module.exports = Doctor;
