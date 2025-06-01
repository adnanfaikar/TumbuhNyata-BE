const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WorkshopRegistration = sequelize.define('WorkshopRegistration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workshop_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'pending'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'workshop_registrations',
  timestamps: false
});

module.exports = WorkshopRegistration;
