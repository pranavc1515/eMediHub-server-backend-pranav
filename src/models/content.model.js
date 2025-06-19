const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Content = sequelize.define(
    'Content',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Type of content: faq, policy, help, about, etc.',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'draft',
            comment: 'Status: draft, published, archived',
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Display order within the same content type',
        },
        metaData: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON string for additional metadata',
        }
    },
    {
        tableName: 'contents',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = { Content }; 