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
      message: 'Pendaftaran workshop berhasil',
      data: registration
    });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Gagal menyimpan pendaftaran workshop', error: err.message });
  }
};

exports.deleteByWorkshopId = async (req, res) => {
  const { workshopId } = req.params;

  try {
    const deleted = await WorkshopRegistration.destroy({
      where: { workshop_id: workshopId }
    });

    if (!deleted) {
      return res.status(404).json({
        message: 'Workshop tidak ditemukan'
      });
    }

    res.status(200).json({
      message: 'Workshop berhasil dihapus'
    });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({
      message: 'Gagal menghapus workshop',
      error: err.message
    });
  }
};