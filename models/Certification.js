const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Certification = sequelize.define('Certification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  credential_body: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  benefits: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  cost: {
    type: DataTypes.DECIMAL(15,2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'submitted'
  },
  submission_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  supporting_documents: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'certifications',
  timestamps: false
});

module.exports = Certification; 