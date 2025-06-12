const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const uploadExcel = require('../middleware/uploadExcel');

router.post('/register', uploadExcel.single('daftar_karyawan'), workshopController.registerWorkshop);
router.delete('/:workshopId', workshopController.deleteByWorkshopId);
router.get('/history', workshopController.getHistoryByEmail);

module.exports = router;
