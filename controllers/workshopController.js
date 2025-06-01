const WorkshopRegistration = require('../models/WorkshopRegistration');

exports.registerWorkshop = async (req, res) => {
  const { workshop_id, company_name, email } = req.body;
  const file = req.file;
  const filePath = file ? file.path : null;

  if (!workshop_id || !company_name || !email) {
    return res.status(400).json({
      message: 'Data tidak lengkap. workshop_id, company_name, dan email diperlukan.'
    });
  }

  try {
    const registration = await WorkshopRegistration.create({
      workshop_id,
      company_name,
      email,
      file_path: filePath,
      status: 'pending',
      created_at: new Date()
    });

    res.status(201).json({
      message: 'Pendaftaran Workshop Berhasil',
      data: registration
    });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Gagal menyimpan pendaftaran workshop', error: err.message });
  }
};
