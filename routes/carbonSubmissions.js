// routes/carbonSubmissions.js
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const CarbonSubmissionController = require("../controllers/carbonSubmissionController");

// Route untuk upload dan proses CSV file
router.post(
  "/upload-csv",
  CarbonSubmissionController.uploadCSV,
  CarbonSubmissionController.processCSVFile
);

// Route untuk membuat single submission (create)
router.post("/submissions", CarbonSubmissionController.createSubmission);

// Route untuk mengupdate submission by ID (update)
router.put("/submissions/:id", CarbonSubmissionController.updateSubmission);

// Route untuk mendapatkan semua submissions dengan pagination dan filter
router.get("/submissions", CarbonSubmissionController.getAllSubmissions);

// Route untuk mendapatkan analytics data
router.get("/analytics", CarbonSubmissionController.getAnalytics);

// Route untuk mendapatkan submission by ID
router.get("/submissions/:id", CarbonSubmissionController.getSubmissionById);

// Route untuk delete submission
router.delete("/submissions/:id", CarbonSubmissionController.deleteSubmission);

// Route untuk mendapatkan KPI data by type
router.get("/kpi/:kpiType", CarbonSubmissionController.getKPI);

// Route untuk mendapatkan dashboard data (kombinasi analytics dan recent submissions)
router.get("/dashboard", CarbonSubmissionController.getDashboard);

module.exports = router;
