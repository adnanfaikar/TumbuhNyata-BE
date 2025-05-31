// models/CarbonSubmission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Sesuaikan dengan konfigurasi database Anda

const CarbonSubmission = sequelize.define('CarbonSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ID perusahaan yang melakukan submission'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: new Date().getFullYear(),
    comment: 'Tahun data carbon footprint'
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: new Date().getMonth() + 1,
    validate: {
      min: 1,
      max: 12
    },
    comment: 'Bulan data carbon footprint (1-12)'
  },
  carbon_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Nilai carbon footprint dalam kg CO2e'
  },
  document_type: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'csv_upload',
    comment: 'Jenis dokumen (csv_upload, pdf, xlsx, manual_input, etc.)'
  },
  document_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nama file dokumen yang diupload'
  },
  document_path: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Path lengkap file dokumen di server'
  },
  analysis: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Analisis atau catatan tambahan'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'carbon_submissions',
  timestamps: false, // Karena kita menggunakan created_at manual
  indexes: [
    {
      fields: ['company_id']
    },
    {
      fields: ['year', 'month']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Method untuk mendapatkan data per bulan
CarbonSubmission.getMonthlyData = async function(year, companyId = null) {
  const whereClause = { year: parseInt(year) };
  if (companyId) whereClause.company_id = companyId;

  return await this.findAll({
    attributes: [
      'month',
      [sequelize.fn('SUM', sequelize.col('carbon_value')), 'total_carbon'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'submission_count'],
      [sequelize.fn('AVG', sequelize.col('carbon_value')), 'avg_carbon']
    ],
    where: whereClause,
    group: ['month'],
    order: [['month', 'ASC']]
  });
};

// Method untuk mendapatkan total statistics
CarbonSubmission.getTotalStats = async function(year, companyId = null) {
  const whereClause = { year: parseInt(year) };
  if (companyId) whereClause.company_id = companyId;

  return await this.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('carbon_value')), 'total_carbon'],
      [sequelize.fn('AVG', sequelize.col('carbon_value')), 'avg_carbon'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_submissions'],
      [sequelize.fn('MIN', sequelize.col('carbon_value')), 'min_carbon'],
      [sequelize.fn('MAX', sequelize.col('carbon_value')), 'max_carbon']
    ],
    where: whereClause
  });
};

// Method untuk mendapatkan data tren tahunan
CarbonSubmission.getYearlyTrend = async function(companyId = null, years = 5) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years + 1;
  
  const whereClause = {
    year: {
      [sequelize.Op.gte]: startYear,
      [sequelize.Op.lte]: currentYear
    }
  };
  if (companyId) whereClause.company_id = companyId;

  return await this.findAll({
    attributes: [
      'year',
      [sequelize.fn('SUM', sequelize.col('carbon_value')), 'total_carbon'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'submission_count']
    ],
    where: whereClause,
    group: ['year'],
    order: [['year', 'ASC']]
  });
};

// Hook sebelum create untuk validasi
CarbonSubmission.beforeCreate((instance, options) => {
  // Pastikan carbon_value tidak negatif
  if (instance.carbon_value < 0) {
    instance.carbon_value = 0;
  }
  
  // Pastikan month dalam range yang benar
  if (instance.month < 1 || instance.month > 12) {
    instance.month = new Date().getMonth() + 1;
  }
  
  // Set default year jika tidak ada
  if (!instance.year) {
    instance.year = new Date().getFullYear();
  }
});

module.exports = CarbonSubmission;