const express = require("express");
const router = express.Router();
const controller = require("../controllers/certificationsController");
const verifyToken = require("../middleware/authMiddleware");

// Get semua pengajuan sertifikasi milik user (token disabled sementara)
router.get("/", controller.getUserCertifications);

// Get detail satu pengajuan sertifikasi (token disabled sementara)
router.get("/:id", controller.getCertificationById);

// Ajukan sertifikasi baru (token disabled sementara)
router.post("/apply", controller.submitCertification);

// Update status (opsional)
router.put("/:id/status", controller.updateStatus); // bisa diberi verifyToken jika hanya admin
// bisa juga ditambahkan role check jika perlu
module.exports = router;
