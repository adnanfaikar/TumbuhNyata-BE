// controllers/carbonSubmissionController.js
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const CarbonSubmission = require('../models/carbonSubmission');

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
  

class CarbonSubmissionController {
  // Upload dan proses file CSV
  static uploadCSV = upload.single('csvFile');

  static async processCSVFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      const filePath = req.file.path;
      const results = [];
      
      // Baca dan parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            // Validasi dan clean data sesuai dengan CSV structure
            const allowedTypes = ['laporan_csr', 'sertifikasi_csr', 'data_emisi', 'dokumen_pendukung_lain'];
            let docType = data.document_type ? data.document_type.toString().trim() : 'data_emisi';
            if (!allowedTypes.includes(docType)) docType = 'data_emisi';

            const cleanData = {
              id_perusahaan: data.id_perusahaan ? data.id_perusahaan.toString().trim() : null,
              year: parseInt(data.year) || new Date().getFullYear(),
              month: parseInt(data.month) || new Date().getMonth() + 1,
              carbon_value: parseFloat(data.carbon_value) || 0,
              document_type: docType,
              document_name: data.document_name ? data.document_name.toString().trim() : req.file.originalname,
              document_path: data.document_path ? data.document_path.toString().trim() : req.file.path,
              analysis: data.analysis ? data.analysis.toString().trim() : null,
              created_at: new Date()
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
          .on('end', resolve)
          .on('error', reject);
      });

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid data found in CSV file'
        });
      }

      // Simpan data ke database
      const savedData = await CarbonSubmission.bulkCreate(results);

      // Hitung total carbon footprint
      const totalCarbon = results.reduce((sum, item) => sum + item.carbon_value, 0);
      const avgCarbon = totalCarbon / results.length;

      res.status(201).json({
        success: true,
        message: 'CSV file processed successfully',
        data: {
          totalRecords: savedData.length,
          totalCarbonValue: totalCarbon,
          averageCarbonValue: avgCarbon,
          fileName: req.file.originalname,
          processedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error processing CSV:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing CSV file',
        error: error.message
      });
    }
  }

  // Get semua data submissions
  static async getAllSubmissions(req, res) {
    try {
      const { page = 1, limit = 10, year, month, id_perusahaan } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (year) whereClause.year = year;
      if (month) whereClause.month = month;
      if (id_perusahaan) whereClause.id_perusahaan = id_perusahaan;

      const submissions = await CarbonSubmission.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: submissions.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(submissions.count / limit),
          totalItems: submissions.count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching submissions',
        error: error.message
      });
    }
  }

  // Get carbon footprint analytics
  static async getAnalytics(req, res) {
    try {
      const { year = new Date().getFullYear(), id_perusahaan } = req.query;
      
      const whereClause = { year: parseInt(year) };
      if (id_perusahaan) whereClause.id_perusahaan = id_perusahaan;

      // Get monthly data untuk chart
      const monthlyData = await CarbonSubmission.findAll({
        attributes: [
          'month',
          [CarbonSubmission.sequelize.fn('SUM', CarbonSubmission.sequelize.col('carbon_value')), 'total_carbon'],
          [CarbonSubmission.sequelize.fn('COUNT', CarbonSubmission.sequelize.col('id')), 'submission_count']
        ],
        where: whereClause,
        group: ['month'],
        order: [['month', 'ASC']]
      });

      // Get total statistics
      const totalStats = await CarbonSubmission.findOne({
        attributes: [
          [CarbonSubmission.sequelize.fn('SUM', CarbonSubmission.sequelize.col('carbon_value')), 'total_carbon'],
          [CarbonSubmission.sequelize.fn('AVG', CarbonSubmission.sequelize.col('carbon_value')), 'avg_carbon'],
          [CarbonSubmission.sequelize.fn('COUNT', CarbonSubmission.sequelize.col('id')), 'total_submissions']
        ],
        where: whereClause
      });

      // Format data untuk response
      const chartData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthData = monthlyData.find(item => item.month === month);
        return {
          month: month,
          carbon_value: monthData ? parseFloat(monthData.dataValues.total_carbon) : 0,
          submission_count: monthData ? parseInt(monthData.dataValues.submission_count) : 0
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
            totalSubmissions: parseInt(totalStats.dataValues.total_submissions) || 0
          }
        }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching analytics',
        error: error.message
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
          message: 'Submission not found'
        });
      }

      // Hapus file jika ada
      if (submission.document_path && fs.existsSync(submission.document_path)) {
        fs.unlinkSync(submission.document_path);
      }

      await submission.destroy();

      res.status(200).json({
        success: true,
        message: 'Submission deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting submission',
        error: error.message
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
          message: 'Submission not found'
        });
      }

      res.status(200).json({
        success: true,
        data: submission
      });

    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching submission',
        error: error.message
      });
    }
  }
}

module.exports = CarbonSubmissionController;