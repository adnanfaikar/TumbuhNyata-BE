const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const uploadExcel = require('../middleware/uploadExcel');

// POST /workshops/register
router.post('/register', uploadExcel.single('daftar_karyawan'), workshopController.registerWorkshop);
// DELETE /workshops/:id
router.delete('/:workshopId', workshopController.deleteByWorkshopId);

module.exports = router;
