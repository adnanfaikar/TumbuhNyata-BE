const express = require('express');
const router = express.Router();
const csrController = require('../controllers/csrController');
const { uploadCSRFiles } = require('../middleware/upload'); // <- dari langkah di atas

router.post('/ajukan', uploadCSRFiles, csrController.submitCSR);

module.exports = router;
