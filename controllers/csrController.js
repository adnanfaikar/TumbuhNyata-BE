const { CsrSubmission } = require('../models');
const path = require('path');

exports.submitCSR = async (req, res) => {
  try {
    // Validasi body request
    if (!req.body || !req.body.user_id) {
      return res.status(400).json({ 
        message: 'Data tidak lengkap. user_id diperlukan.'
      });
    }

    const {
      user_id,
      program_name,
      category,
      description,
      location,
      partner_name,
      start_date,
      end_date,
      budget,
      agreed
    } = req.body;

    // Penanganan file dengan cara yang lebih aman (opsional untuk testing)
    let proposal_url = null;
    let legality_url = null;
    
    if (req.files) {
      if (req.files['proposal'] && req.files['proposal'][0]) {
        proposal_url = req.files['proposal'][0].path;
      }
      
      if (req.files['legalitas'] && req.files['legalitas'][0]) {
        legality_url = req.files['legalitas'][0].path;
      }
    }

    // Debug output
    console.log('Request Body:', req.body);
    console.log('Files:', req.files);

    const newSubmission = await CsrSubmission.create({
      user_id,
      program_name,
      category,
      description,
      location,
      partner_name,
      start_date,
      end_date,
      budget,
      proposal_url,
      legality_url,
      agreed: agreed === 'true',
    });

    res.status(201).json({ message: 'Pengajuan CSR berhasil dibuat', data: newSubmission });
  } catch (err) {
    console.error('Error submitting CSR:', err);
    res.status(500).json({ message: 'Gagal membuat pengajuan CSR', error: err.message });
  }
};

exports.getCSRDetail = async (req, res) => {
  const { id } = req.params;
  const csr = await CsrSubmission.findByPk(id);
  if (!csr) return res.status(404).json({ message: 'CSR tidak ditemukan' });
  res.json(csr);
};

exports.getAllCSR = async (req, res) => {
  const list = await CsrSubmission.findAll();
  res.json(list);
};
