// models/CarbonSubmission.js
const { DataTypes, Op } = require("sequelize");
const sequelize = require("../config/db"); // Sesuaikan dengan konfigurasi database Anda

const CarbonSubmission = sequelize.define(
  "CarbonSubmission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "ID perusahaan yang melakukan submission",
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: new Date().getFullYear(),
      comment: "Tahun data carbon footprint",
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: new Date().getMonth() + 1,
      validate: {
        min: 1,
        max: 12,
      },
      comment: "Bulan data carbon footprint (1-12)",
    },
    carbon_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment:
        "General value field for all KPI types (emisi, energi, air, pohon, sampah, manfaat)",
    },
    document_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "data_emisi",
      validate: {
        isIn: [
          [
            "data_emisi",
            "data_energi",
            "data_air",
            "data_pohon",
            "data_sampah",
            "data_manfaat",
            "laporan_csr",
            "sertifikasi_csr",
            "dokumen_pendukung_lain",
          ],
        ],
      },
      comment:
        "Jenis dokumen CSR (data_emisi, data_energi, data_air, data_pohon, data_sampah, data_manfaat, dll)",
    },
    document_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Nama file dokumen yang diupload",
    },
    document_path: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Path lengkap file dokumen di server",
    },
    analysis: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Analisis atau catatan tambahan",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "carbon_submissions",
    timestamps: false, // Karena kita menggunakan created_at manual
    indexes: [
      {
        fields: ["company_id"],
      },
      {
        fields: ["year", "month"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

// Method untuk mendapatkan data per bulan
CarbonSubmission.getMonthlyData = async function (year, company_id = null) {
  const whereClause = { year: parseInt(year) };
  if (company_id) whereClause.company_id = company_id;

  return await this.findAll({
    attributes: [
      "month",
      [sequelize.fn("SUM", sequelize.col("carbon_value")), "total_carbon"],
      [sequelize.fn("COUNT", sequelize.col("id")), "submission_count"],
      [sequelize.fn("AVG", sequelize.col("carbon_value")), "avg_carbon"],
    ],
    where: whereClause,
    group: ["month"],
    order: [["month", "ASC"]],
  });
};

// Method untuk mendapatkan total statistics
CarbonSubmission.getTotalStats = async function (year, company_id = null) {
  const whereClause = { year: parseInt(year) };
  if (company_id) whereClause.company_id = company_id;

  return await this.findOne({
    attributes: [
      [sequelize.fn("SUM", sequelize.col("carbon_value")), "total_carbon"],
      [sequelize.fn("AVG", sequelize.col("carbon_value")), "avg_carbon"],
      [sequelize.fn("COUNT", sequelize.col("id")), "total_submissions"],
      [sequelize.fn("MIN", sequelize.col("carbon_value")), "min_carbon"],
      [sequelize.fn("MAX", sequelize.col("carbon_value")), "max_carbon"],
    ],
    where: whereClause,
  });
};

// Method untuk mendapatkan data tren tahunan
CarbonSubmission.getMultiYearData = async function (
  endYear,
  years = 5,
  company_id = null
) {
  const startYear = endYear - years + 1;
  const whereClause = {
    year: {
      [Op.gte]: startYear,
      [Op.lte]: currentYear,
    },
  };
  if (company_id && company_id !== "undefined") {
    whereClause.company_id = company_id;
  }
  return await this.findAll({
    attributes: [
      "year",
      [sequelize.fn("SUM", sequelize.col("carbon_value")), "total_carbon"],
      [sequelize.fn("COUNT", sequelize.col("id")), "submission_count"],
    ],
    where: whereClause,
    group: ["year"],
    order: [["year", "ASC"]],
  });
};

// Method untuk mendapatkan recent submissions
CarbonSubmission.getRecentSubmissions = async function (
  company_id = null,
  limit = 5
) {
  const whereClause = {};
  if (company_id && company_id !== "undefined") {
    whereClause.company_id = company_id;
  }

  return await this.findAll({
    where: whereClause,
    limit: parseInt(limit),
    order: [["created_at", "DESC"]],
  });
};

// Method untuk mendapatkan available years
CarbonSubmission.getAvailableYears = async function () {
  return await this.findAll({
    attributes: [[sequelize.fn("DISTINCT", sequelize.col("year")), "year"]],
    order: [["year", "DESC"]],
  });
};

// Method untuk mendapatkan KPI multi-year data
CarbonSubmission.getMultiYearData = async function (
  endYear,
  years = 5,
  company_id = null
) {
  const startYear = endYear - years + 1;
  const whereClause = {
    year: {
      [Op.gte]: startYear,
      [Op.lte]: endYear,
    },
  };
  if (company_id && company_id !== "undefined") {
    whereClause.company_id = company_id;
  }

  return await this.findAll({
    attributes: [
      "year",
      [sequelize.fn("SUM", sequelize.col("carbon_value")), "total_carbon"],
      [sequelize.fn("COUNT", sequelize.col("id")), "submission_count"],
    ],
    where: whereClause,
    group: ["year"],
    order: [["year", "ASC"]],
  });
};

// Method untuk mendapatkan detailed statistics untuk KPI
CarbonSubmission.getDetailedStats = async function (year, company_id = null) {
  const whereClause = { year: parseInt(year) };
  if (company_id && company_id !== "undefined") {
    whereClause.company_id = company_id;
  }

  return await this.findOne({
    attributes: [
      [sequelize.fn("AVG", sequelize.col("carbon_value")), "avg_value"],
      [sequelize.fn("MIN", sequelize.col("carbon_value")), "min_value"],
      [sequelize.fn("MAX", sequelize.col("carbon_value")), "max_value"],
      [sequelize.fn("SUM", sequelize.col("carbon_value")), "total_value"],
    ],
    where: whereClause,
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
