const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Specialization = sequelize.define(
    'Specialization',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        consultationFee: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    },
    {
        tableName: 'specializations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = { Specialization }; 