const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserPerusahaan = sequelize.define('UserPerusahaan', {
  id_perusahaan: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama_perusahaan: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  no_telp: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  NIB: {
    type: DataTypes.STRING(13),
    allowNull: false
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'user_perusahaan',
  timestamps: false
});

module.exports = UserPerusahaan; 