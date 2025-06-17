const express = require('express');
const router = express.Router();
const csrController = require('../controllers/csrController');
const { uploadCSRFiles } = require('../middleware/upload');
const { getCsrSummary } = require('../controllers/csrSummaryController');

// Endpoint untuk melihat riwayat CSR (list)
router.get('/history', csrController.getCSRHistory);

// Endpoint untuk melihat detail 1 CSR dari riwayat
router.get('/history/:id', csrController.getCSRHistoryDetail);

// Endpoint untuk menghapus riwayat CSR
router.delete('/history/:id', csrController.deleteCSRHistory);

// Endpoint existing untuk submit baru
router.post('/ajukan', uploadCSRFiles, csrController.submitCSR);

router.get('/summary', getCsrSummary);


module.exports = router;
