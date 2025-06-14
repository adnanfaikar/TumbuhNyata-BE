const db = require('../config/db');
const { Certification } = require('../models');

// ✅ GET semua pengajuan sertifikasi milik user
exports.getUserCertifications = (req, res) => {
  const userId = req.userId;

  const sql = "SELECT * FROM certifications WHERE user_id = ? ORDER BY submission_date DESC";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching certifications:', err);
      return res.status(500).json({ message: "Gagal mengambil data sertifikasi", error: err.message });
    }

    res.json({ data: results });
  });
};

// ✅ GET detail satu pengajuan sertifikasi
exports.getCertificationById = (req, res) => {
  const userId = req.userId;
  const id = req.params.id;

  const sql = "SELECT * FROM certifications WHERE id = ? AND user_id = ?";
  db.query(sql, [id, userId], (err, results) => {
    if (err) {
      console.error('Error fetching certification:', err);
      return res.status(500).json({ message: "Gagal mengambil detail sertifikasi", error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Sertifikasi tidak ditemukan" });
    }

    res.json({ data: results[0] });
  });
};

// ✅ POST ajukan sertifikasi baru
exports.submitCertification = async (req, res) => {
  const userId = req.userId;
  const { name, description, credential_body, benefits, cost, supporting_documents } = req.body;

  if (!name || !description || !credential_body || !benefits || !cost || !supporting_documents) {
    return res.status(400).json({ message: "Semua field harus diisi" });
  }

  try {
    const newCertification = await Certification.create({
      user_id: userId,
      name,
      description,
      credential_body,
      benefits,
      cost,
      status: 'submitted',
      submission_date: new Date(),
      supporting_documents: JSON.stringify(supporting_documents)
    });

    res.status(201).json({ message: "Pengajuan sertifikasi berhasil", id: newCertification.id });
  } catch (err) {
    console.error('Error submitting certification:', err);
    res.status(500).json({ message: "Gagal mengajukan sertifikasi", error: err.message });
  }
};

// ✅ PUT untuk update status (opsional, misal admin)
exports.updateStatus = (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!['submitted', 'in_review', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Status tidak valid" });
  }

  const sql = "UPDATE certifications SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(500).json({ message: "Gagal memperbarui status", error: err.message });
    }

    res.json({ message: "Status sertifikasi diperbarui" });
  });
};