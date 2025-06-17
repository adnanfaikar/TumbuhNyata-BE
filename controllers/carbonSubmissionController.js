// controllers/carbonSubmissionController.js
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const CarbonSubmission = require("../models/carbonSubmission");

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${originalName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

class CarbonSubmissionController {
  // Upload dan proses file CSV
  static uploadCSV = upload.single("csvFile");

  static async processCSVFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No CSV file uploaded",
        });
      }

      const filePath = req.file.path;
      const results = [];

      // Baca dan parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            // Validasi dan clean data sesuai dengan CSV structure
            const allowedTypes = [
              "data_emisi",
              "data_energi",
              "data_air",
              "data_pohon",
              "data_sampah",
              "data_manfaat",
              "laporan_csr",
              "sertifikasi_csr",
              "dokumen_pendukung_lain",
            ];
            let docType = data.document_type
              ? data.document_type.toString().trim()
              : "data_emisi";
            if (!allowedTypes.includes(docType)) docType = "data_emisi";

            const cleanData = {
              company_id: data.id_perusahaan
                ? data.id_perusahaan.toString().trim()
                : null,
              year: parseInt(data.year) || new Date().getFullYear(),
              month: parseInt(data.month) || new Date().getMonth() + 1,
              carbon_value: parseFloat(data.carbon_value) || 0, // General value field untuk semua KPI types
              document_type: docType,
              document_name: data.document_name
                ? data.document_name.toString().trim()
                : req.file.originalname,
              document_path: data.document_path
                ? data.document_path.toString().trim()
                : req.file.path,
              analysis: data.analysis ? data.analysis.toString().trim() : null,
              created_at: new Date(),
            };

            // Validasi tambahan
            if (cleanData.month < 1 || cleanData.month > 12) {
              cleanData.month = new Date().getMonth() + 1;
            }

            if (cleanData.carbon_value < 0) {
              cleanData.carbon_value = 0;
            }

            results.push(cleanData);
          })
          .on("end", resolve)
          .on("error", reject);
      });

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid data found in CSV file",
        });
      }

      // Simpan data ke database
      const savedData = await CarbonSubmission.bulkCreate(results);

      // Hitung total carbon footprint
      const totalCarbon = results.reduce(
        (sum, item) => sum + item.carbon_value,
        0
      );
      const avgCarbon = totalCarbon / results.length;

      res.status(201).json({
        success: true,
        message: "CSV file processed successfully",
        data: {
          totalRecords: savedData.length,
          totalCarbonValue: totalCarbon,
          averageCarbonValue: avgCarbon,
          fileName: req.file.originalname,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      res.status(500).json({
        success: false,
        message: "Error processing CSV file",
        error: error.message,
      });
    }
  }

  // Create individual submission
  static async createSubmission(req, res) {
    try {
      const {
        company_id,
        year,
        month,
        carbon_value,
        document_type,
        document_name,
        document_path,
        analysis,
      } = req.body;

      // Validation
      if (!company_id) {
        return res.status(400).json({
          success: false,
          message: "company_id is required",
        });
      }

      // Validate and clean data
      const allowedTypes = [
        "data_emisi",
        "data_energi",
        "data_air",
        "data_pohon",
        "data_sampah",
        "data_manfaat",
        "laporan_csr",
        "sertifikasi_csr",
        "dokumen_pendukung_lain",
      ];

      let docType = document_type
        ? document_type.toString().trim()
        : "data_emisi";
      if (!allowedTypes.includes(docType)) docType = "data_emisi";

      const cleanData = {
        company_id: company_id.toString().trim(),
        year: parseInt(year) || new Date().getFullYear(),
        month: parseInt(month) || new Date().getMonth() + 1,
        carbon_value: parseFloat(carbon_value) || 0,
        document_type: docType,
        document_name: document_name ? document_name.toString().trim() : null,
        document_path: document_path ? document_path.toString().trim() : null,
        analysis: analysis ? analysis.toString().trim() : null,
        created_at: new Date(),
      };

      // Additional validation
      if (cleanData.month < 1 || cleanData.month > 12) {
        cleanData.month = new Date().getMonth() + 1;
      }

      if (cleanData.carbon_value < 0) {
        cleanData.carbon_value = 0;
      }

      // Save to database
      const savedSubmission = await CarbonSubmission.create(cleanData);

      res.status(201).json({
        success: true,
        message: "Submission created successfully",
        data: {
          id: savedSubmission.id,
          company_id: savedSubmission.company_id,
          year: savedSubmission.year,
          month: savedSubmission.month,
          carbon_value: savedSubmission.carbon_value,
          document_type: savedSubmission.document_type,
          created_at: savedSubmission.created_at,
        },
      });
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({
        success: false,
        message: "Error creating submission",
        error: error.message,
      });
    }
  }

  // Update individual submission
  static async updateSubmission(req, res) {
    try {
      const { id } = req.params;
      const {
        company_id,
        year,
        month,
        carbon_value,
        document_type,
        document_name,
        document_path,
        analysis,
      } = req.body;

      // Check if submission exists
      const submission = await CarbonSubmission.findByPk(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      // Validate and clean data
      const allowedTypes = [
        "data_emisi",
        "data_energi",
        "data_air",
        "data_pohon",
        "data_sampah",
        "data_manfaat",
        "laporan_csr",
        "sertifikasi_csr",
        "dokumen_pendukung_lain",
      ];

      let docType = document_type
        ? document_type.toString().trim()
        : submission.document_type;
      if (!allowedTypes.includes(docType)) docType = "data_emisi";

      const updateData = {};

      if (company_id !== undefined)
        updateData.company_id = company_id.toString().trim();
      if (year !== undefined)
        updateData.year = parseInt(year) || submission.year;
      if (month !== undefined) {
        const parsedMonth = parseInt(month) || submission.month;
        updateData.month =
          parsedMonth >= 1 && parsedMonth <= 12
            ? parsedMonth
            : submission.month;
      }
      if (carbon_value !== undefined) {
        const parsedCarbon = parseFloat(carbon_value);
        updateData.carbon_value = parsedCarbon >= 0 ? parsedCarbon : 0;
      }
      if (document_type !== undefined) updateData.document_type = docType;
      if (document_name !== undefined)
        updateData.document_name = document_name
          ? document_name.toString().trim()
          : null;
      if (document_path !== undefined)
        updateData.document_path = document_path
          ? document_path.toString().trim()
          : null;
      if (analysis !== undefined)
        updateData.analysis = analysis ? analysis.toString().trim() : null;

      // Update submission
      await submission.update(updateData);

      // Fetch updated submission
      const updatedSubmission = await CarbonSubmission.findByPk(id);

      res.status(200).json({
        success: true,
        message: "Submission updated successfully",
        data: {
          id: updatedSubmission.id,
          company_id: updatedSubmission.company_id,
          year: updatedSubmission.year,
          month: updatedSubmission.month,
          carbon_value: updatedSubmission.carbon_value,
          document_type: updatedSubmission.document_type,
          document_name: updatedSubmission.document_name,
          document_path: updatedSubmission.document_path,
          analysis: updatedSubmission.analysis,
          created_at: updatedSubmission.created_at,
          updated_at: updatedSubmission.updated_at,
        },
      });
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({
        success: false,
        message: "Error updating submission",
        error: error.message,
      });
    }
  }

  // Get semua data submissions
  static async getAllSubmissions(req, res) {
    try {
      const { page = 1, limit = 10, year, month, company_id } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (year) whereClause.year = year;
      if (month) whereClause.month = month;
      if (company_id) whereClause.company_id = company_id;

      const submissions = await CarbonSubmission.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: submissions.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(submissions.count / limit),
          totalItems: submissions.count,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching submissions",
        error: error.message,
      });
    }
  }

  // Get carbon footprint analytics
  static async getAnalytics(req, res) {
    try {
      const { year = new Date().getFullYear(), company_id } = req.query;

      const whereClause = { year: parseInt(year) };
      if (company_id) whereClause.company_id = company_id;

      // Get monthly data untuk chart
      const monthlyData = await CarbonSubmission.findAll({
        attributes: [
          "month",
          [
            CarbonSubmission.sequelize.fn(
              "SUM",
              CarbonSubmission.sequelize.col("carbon_value")
            ),
            "total_carbon",
          ],
          [
            CarbonSubmission.sequelize.fn(
              "COUNT",
              CarbonSubmission.sequelize.col("id")
            ),
            "submission_count",
          ],
        ],
        where: whereClause,
        group: ["month"],
        order: [["month", "ASC"]],
      });

      // Get total statistics
      const totalStats = await CarbonSubmission.findOne({
        attributes: [
          [
            CarbonSubmission.sequelize.fn(
              "SUM",
              CarbonSubmission.sequelize.col("carbon_value")
            ),
            "total_carbon",
          ],
          [
            CarbonSubmission.sequelize.fn(
              "AVG",
              CarbonSubmission.sequelize.col("carbon_value")
            ),
            "avg_carbon",
          ],
          [
            CarbonSubmission.sequelize.fn(
              "COUNT",
              CarbonSubmission.sequelize.col("id")
            ),
            "total_submissions",
          ],
        ],
        where: whereClause,
      });

      // Format data untuk response
      const chartData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthData = monthlyData.find((item) => item.month === month);
        return {
          month: month,
          carbon_value: monthData
            ? parseFloat(monthData.dataValues.total_carbon)
            : 0,
          submission_count: monthData
            ? parseInt(monthData.dataValues.submission_count)
            : 0,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          year: parseInt(year),
          monthlyData: chartData,
          totalStats: {
            totalCarbon: parseFloat(totalStats.dataValues.total_carbon) || 0,
            avgCarbon: parseFloat(totalStats.dataValues.avg_carbon) || 0,
            totalSubmissions:
              parseInt(totalStats.dataValues.total_submissions) || 0,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching analytics",
        error: error.message,
      });
    }
  }

  // Delete submission
  static async deleteSubmission(req, res) {
    try {
      const { id } = req.params;

      const submission = await CarbonSubmission.findByPk(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      // Hapus file jika ada
      if (submission.document_path && fs.existsSync(submission.document_path)) {
        fs.unlinkSync(submission.document_path);
      }

      await submission.destroy();

      res.status(200).json({
        success: true,
        message: "Submission deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting submission:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting submission",
        error: error.message,
      });
    }
  }

  // Get submission by ID
  static async getSubmissionById(req, res) {
    try {
      const { id } = req.params;

      const submission = await CarbonSubmission.findByPk(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching submission",
        error: error.message,
      });
    }
  }

  // Get dashboard data (kombinasi analytics dan recent submissions)
  static async getDashboard(req, res) {
    try {
      const { year, company_id } = req.query;

      console.log("Dashboard endpoint called with:", { year, company_id });

      // Smart Year Detection: Get latest year with data if no year specified
      let actualYear;
      if (year) {
        actualYear = parseInt(year);
      } else {
        const availableYears = await CarbonSubmission.getAvailableYears();
        actualYear =
          availableYears.length > 0
            ? availableYears[0].dataValues.year
            : new Date().getFullYear();
        console.log(
          "Available years in database:",
          availableYears.map((y) => y.dataValues.year)
        );
        console.log("Using year for dashboard calculation:", actualYear);
      }

      console.log("Dashboard processing year:", actualYear);

      // Get monthly analytics data using model method
      const monthlyData = await CarbonSubmission.getMonthlyData(
        actualYear,
        company_id
      );

      // Get total statistics using model method
      const totalStats = await CarbonSubmission.getTotalStats(
        actualYear,
        company_id
      );

      console.log("Dashboard query results:", {
        monthlyDataCount: monthlyData.length,
        totalStats: totalStats?.dataValues,
      });

      // Get recent submissions using model method
      const recentSubmissions = await CarbonSubmission.getRecentSubmissions(
        company_id,
        100 // Increased limit for better grouping
      );

      // Group and aggregate by document_type (NEW: Support for multiple CSR types)
      const documentTypes = [
        "data_emisi",
        "data_energi",
        "data_air",
        "data_pohon",
        "data_sampah",
        "data_manfaat",
      ];
      const aggregatedData = {};

      documentTypes.forEach((type) => {
        const typeData = recentSubmissions.filter(
          (item) => item.document_type === type
        );
        const totalValue = typeData.reduce(
          (sum, item) => sum + parseFloat(item.carbon_value || 0),
          0
        );

        aggregatedData[type] = {
          total_value: totalValue,
          submission_count: typeData.length,
          latest_submission: typeData[0] || null,
        };
      });

      // Format chart data (ensure all 12 months are included)
      const chartData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthData = monthlyData.find((item) => item.month === month);
        return {
          month: month,
          carbon_value: monthData
            ? parseFloat(monthData.dataValues.total_carbon)
            : 0,
        };
      });

      const finalTotalCarbon =
        parseFloat(totalStats?.dataValues?.total_carbon) || 0;
      const finalTotalSubmissions =
        parseInt(totalStats?.dataValues?.total_submissions) || 0;

      console.log("Final dashboard totals:", {
        finalTotalCarbon,
        finalTotalSubmissions,
      });

      res.status(200).json({
        success: true,
        data: {
          analytics: {
            year: parseInt(actualYear),
            monthlyData: chartData,
            totalStats: {
              totalCarbon: finalTotalCarbon,
              totalSubmissions: finalTotalSubmissions,
            },
          },
          recentSubmissions: recentSubmissions,
          summary: {
            currentYearTotal: finalTotalCarbon,
            submissionCount: finalTotalSubmissions,
            lastUpdated: new Date(),
          },
          kpi_breakdown: aggregatedData, // NEW: Breakdown per KPI type untuk frontend
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching dashboard data",
        error: error.message,
      });
    }
  }

  // Get KPI data by type
  static async getKPI(req, res) {
    try {
      const { kpiType } = req.params;
      const { company_id, year } = req.query;

      // Debug logging
      console.log("KPI Endpoint called with:", { kpiType, company_id, year });

      // Validate kpiType
      if (kpiType !== "carbon_footprint") {
        return res.status(404).json({
          success: false,
          message: `Unsupported KPI type: ${kpiType}. Currently only 'carbon_footprint' is supported.`,
        });
      }

      // Smart Year Detection: Get latest year with data if no year specified
      let actualYear;
      if (year) {
        actualYear = parseInt(year);
      } else {
        const availableYears = await CarbonSubmission.getAvailableYears();
        actualYear =
          availableYears.length > 0
            ? availableYears[0].dataValues.year
            : new Date().getFullYear();
        console.log(
          "Available years in database:",
          availableYears.map((y) => y.dataValues.year)
        );
        console.log("Using year for calculation:", actualYear);
      }

      // 1. Get yearly data (monthly aggregation for specified year) using model method
      const monthlyData = await CarbonSubmission.getMonthlyData(
        actualYear,
        company_id
      );

      console.log(
        "Monthly data query results:",
        monthlyData.length,
        "months found"
      );

      // Format yearly data (ensure all 12 months are included)
      const yearly_data = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthItem = monthlyData.find((item) => item.month === month);
        return {
          month: month,
          value: monthItem ? parseFloat(monthItem.dataValues.total_carbon) : 0,
          submission_count: monthItem
            ? parseInt(monthItem.dataValues.submission_count)
            : 0,
        };
      });

      // 2. Get multi-year data using model method
      const yearlyAggregation = await CarbonSubmission.getMultiYearData(
        actualYear,
        5,
        company_id
      );

      // Format multi-year data (ensure all 5 years are included)
      const startYear = actualYear - 4;
      const multi_year_data = Array.from({ length: 5 }, (_, i) => {
        const targetYear = startYear + i;
        const yearData = yearlyAggregation.find(
          (item) => item.year === targetYear
        );
        return {
          year: targetYear,
          total_value: yearData
            ? parseFloat(yearData.dataValues.total_carbon)
            : 0,
          submission_count: yearData
            ? parseInt(yearData.dataValues.submission_count)
            : 0,
        };
      });

      // 3. Get statistics for the specified year using model method
      const statistics = await CarbonSubmission.getDetailedStats(
        actualYear,
        company_id
      );

      // Format statistics
      const statsData = statistics?.dataValues || {};
      const formattedStats = {
        average_value: parseFloat(statsData.avg_value) || 0,
        min_value: parseFloat(statsData.min_value) || 0,
        max_value: parseFloat(statsData.max_value) || 0,
        total_value: parseFloat(statsData.total_value) || 0,
      };

      console.log("Statistics results:", formattedStats);

      // 4. Generate analysis
      const totalSubmissions = yearly_data.reduce(
        (sum, month) => sum + month.submission_count,
        0
      );
      const analysis = `Analisis CSR reporting untuk tahun ${actualYear}. Total nilai: ${formattedStats.total_value.toFixed(
        1
      )} dengan rata-rata ${formattedStats.average_value.toFixed(
        1
      )} per submission. Total ${totalSubmissions} submission tercatat untuk berbagai KPI (emisi, energi, air, pohon, sampah, manfaat).`;

      // Final response
      res.status(200).json({
        success: true,
        data: {
          kpi_type: "carbon_footprint",
          title: "CSR Reporting Dashboard",
          unit: "General Value",
          yearly_data: yearly_data,
          multi_year_data: multi_year_data,
          statistics: formattedStats,
          analysis: analysis,
        },
      });
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching KPI data",
        error: error.message,
      });
    }
  }
}

module.exports = CarbonSubmissionController;
