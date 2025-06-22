const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Family = sequelize.define(
    'Family',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'User who is adding the family member',
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50]
            }
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 50]
            }
        },
        relationship: {
            type: DataTypes.ENUM(
                'Father',
                'Mother',
                'Spouse',
                'Brother',
                'Sister',
                'Son',
                'Daughter',
                'Other'
            ),
            allowNull: false,
        },
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        gender: {
            type: DataTypes.ENUM('Male', 'Female', 'Other'),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [10, 15]
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            },
        },
        bloodGroup: {
            type: DataTypes.ENUM(
                'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
            ),
            allowNull: true,
        },
        medicalConditions: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Any existing medical conditions or allergies'
        },
        emergencyContact: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether this family member can be contacted in emergencies'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        profileImage: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL to profile image'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional notes about the family member'
        }
    },
    {
        tableName: 'family_members',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['userId'],
                name: 'idx_family_user_id'
            },
            {
                fields: ['relationship'],
                name: 'idx_family_relationship'
            },
            {
                fields: ['userId', 'relationship'],
                name: 'idx_family_user_relationship'
            }
        ]
    }
);

module.exports = Family; 