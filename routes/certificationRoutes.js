const express = require('express');
const router = express.Router();
const controller = require('../controllers/certificationsController');
const verifyToken = require('../middleware/authMiddleware');

// Get semua pengajuan sertifikasi milik user
router.get('/', verifyToken, controller.getUserCertifications);

// Get detail satu pengajuan sertifikasi
router.get('/:id', verifyToken, controller.getCertificationById);

// Ajukan sertifikasi baru
router.post('/apply', verifyToken, controller.submitCertification);

// Update status (opsional)
router.put('/:id/status', controller.updateStatus); // bisa diberi verifyToken jika hanya admin
// bisa juga ditambahkan role check jika perlu
module.exports = router;
