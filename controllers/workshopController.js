const db = require('../config/db'); // Sesuaikan koneksi database kamu

exports.registerWorkshop = (req, res) => {
  const { workshop_id, company_name, email } = req.body;
  const file = req.file;

  // Hapus validasi wajib file
  // if (!file) {
  //   return res.status(400).json({ message: 'File daftar karyawan wajib diunggah' });
  // }

  // File path bisa null jika tidak ada file
  const filePath = file ? file.path : null;

  // Validasi data penting
  if (!workshop_id || !company_name || !email) {
    return res.status(400).json({ 
      message: 'Data tidak lengkap. workshop_id, company_name, dan email diperlukan.' 
    });
  }

  console.log('Request Body:', req.body);
  console.log('File:', file);

  const query = `
    INSERT INTO workshop_registrations (
      workshop_id, company_name, email, file_path, status, created_at
    ) VALUES (?, ?, ?, ?, 'pending', NOW())
  `;

  db.query(query, [workshop_id, company_name, email, filePath], (err, result) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ message: 'Gagal menyimpan pendaftaran workshop', error: err.message });
    }

    res.status(201).json({
      message: 'Pendaftaran Workshop Berhasil',
      data: {
        id: result.insertId,
        workshop_id,
        company_name,
        email,
        file_path: filePath,
        status: 'pending'
      }
    });
  });
};
