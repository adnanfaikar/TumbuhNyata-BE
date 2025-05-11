const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const uploadExcel = require('../middleware/uploadExcel');

// POST /api/workshops/register
router.post('/register', uploadExcel.single('daftar_karyawan'), workshopController.registerWorkshop);

module.exports = router;
