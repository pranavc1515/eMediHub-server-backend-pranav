const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prescription = sequelize.define(
    'Prescription',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        consultationId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        patientId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        doctorId: {
            type: DataTypes.STRING,
            allowNull: false,
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
        }
    },
    {
        timestamps: true,
    }
);

// No associations with other tables

module.exports = Prescription; 