// routes/carbonSubmissions.js
const express = require('express');
const router = express.Router();
const CarbonSubmissionController = require('../controllers/carbonSubmissionController');

// Route untuk upload dan proses CSV file
router.post('/upload-csv', 
  CarbonSubmissionController.uploadCSV,
  CarbonSubmissionController.processCSVFile
);

// Route untuk mendapatkan semua submissions dengan pagination dan filter
router.get('/submissions', CarbonSubmissionController.getAllSubmissions);

// Route untuk mendapatkan analytics data
router.get('/analytics', CarbonSubmissionController.getAnalytics);

// Route untuk mendapatkan submission by ID
router.get('/submissions/:id', CarbonSubmissionController.getSubmissionById);

// Route untuk delete submission
router.delete('/submissions/:id', CarbonSubmissionController.deleteSubmission);

// Route untuk mendapatkan dashboard data (kombinasi analytics dan recent submissions)
router.get('/dashboard', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), company_id } = req.query;
    
    // Get analytics data
    const analyticsReq = { query: { year, company_id } };
    const analyticsRes = {
      status: (code) => ({ json: (data) => ({ analyticsData: data }) })
    };
    
    // Get recent submissions
    const recentSubmissionsReq = { query: { limit: 5, company_id } };
    const recentSubmissionsRes = {
      status: (code) => ({ json: (data) => ({ recentSubmissions: data }) })
    };

    // Simulate controller calls (dalam implementasi nyata, ekstrak logic ke service)
    const whereClause = { year: parseInt(year) };
    if (company_id) whereClause.company_id = company_id;

    const CarbonSubmission = require('../models/CarbonSubmission');

    // Get analytics
    const monthlyData = await CarbonSubmission.findAll({
      attributes: [
        'month',
        [CarbonSubmission.sequelize.fn('SUM', CarbonSubmission.sequelize.col('carbon_value')), 'total_carbon'],
      ],
      where: whereClause,
      group: ['month'],
      order: [['month', 'ASC']]
    });

    const totalStats = await CarbonSubmission.findOne({
      attributes: [
        [CarbonSubmission.sequelize.fn('SUM', CarbonSubmission.sequelize.col('carbon_value')), 'total_carbon'],
        [CarbonSubmission.sequelize.fn('COUNT', CarbonSubmission.sequelize.col('id')), 'total_submissions']
      ],
      where: whereClause
    });

    // Get recent submissions
    const recentSubmissions = await CarbonSubmission.findAll({
      where: company_id ? { company_id } : {},
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    // Format chart data
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = monthlyData.find(item => item.month === month);
      return {
        month: month,
        carbon_value: monthData ? parseFloat(monthData.dataValues.total_carbon) : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        analytics: {
          year: parseInt(year),
          monthlyData: chartData,
          totalStats: {
            totalCarbon: parseFloat(totalStats?.dataValues?.total_carbon) || 0,
            totalSubmissions: parseInt(totalStats?.dataValues?.total_submissions) || 0
          }
        },
        recentSubmissions: recentSubmissions,
        summary: {
          currentYearTotal: parseFloat(totalStats?.dataValues?.total_carbon) || 0,
          submissionCount: parseInt(totalStats?.dataValues?.total_submissions) || 0,
          lastUpdated: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

module.exports = router;