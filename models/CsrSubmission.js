const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Model untuk pengajuan CSR
const CsrSubmission = sequelize.define('CsrSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  program_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  partner_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  budget: {
    type: DataTypes.DECIMAL(15,2),
    allowNull: false
  },
  proposal_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  legality_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  agreed: {
    type: DataTypes.BOOLEAN,
    allowNull: false
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
  tableName: 'csr_submissions',
  timestamps: false
});

module.exports = CsrSubmission; 