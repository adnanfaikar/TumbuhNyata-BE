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
      agreed,
      status
    } = req.body;

    // Debug output
    console.log('Request Body:', req.body);
    console.log('Files:', req.files);

    // Fungsi untuk konversi format tanggal dari "DD MMM YYYY" ke "YYYY-MM-DD"
    const convertDateFormat = (dateString) => {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
      } catch (error) {
        console.error('Date conversion error:', error);
        throw new Error(`Invalid date format: ${dateString}`);
      }
    };

    // Konversi budget ke number
    const budgetNumber = parseFloat(budget.toString().replace(/[^\d.]/g, ''));
    if (isNaN(budgetNumber)) {
      return res.status(400).json({ 
        message: 'Format budget tidak valid'
      });
    }

    // Konversi tanggal
    let convertedStartDate, convertedEndDate;
    try {
      convertedStartDate = convertDateFormat(start_date);
      convertedEndDate = convertDateFormat(end_date);
    } catch (error) {
      return res.status(400).json({ 
        message: `Error konversi tanggal: ${error.message}`
      });
    }

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

    console.log('Converted data:', {
      user_id,
      program_name,
      category,
      description,
      location,
      partner_name,
      start_date: convertedStartDate,
      end_date: convertedEndDate,
      budget: budgetNumber,
      agreed: agreed === true || agreed === 'true',
      status: status || 'pending'
    });

    const newSubmission = await CsrSubmission.create({
      user_id,
      program_name,
      category,
      description,
      location,
      partner_name,
      start_date: convertedStartDate,
      end_date: convertedEndDate,
      budget: budgetNumber,
      proposal_url,
      legality_url,
      agreed: agreed === true || agreed === 'true',
      status: status || 'pending'
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

exports.getCSRHistory = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    if (!user_id) {
      return res.status(400).json({ message: 'Parameter user_id diperlukan.' });
    }

    const submissions = await CsrSubmission.findAll({
      where: { user_id },
      order: [['start_date', 'DESC']]
    });

    res.json(submissions);
  } catch (err) {
    console.error('Error fetching CSR history:', err);
    res.status(500).json({ message: 'Gagal mengambil riwayat CSR.' });
  }
};

// NEW: detail salah satu riwayat CSR (cek juga agar hanya milik user itu)
exports.getCSRHistoryDetail = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const { id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: 'Parameter user_id diperlukan.' });
    }

    const submission = await CsrSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({ message: 'Riwayat CSR tidak ditemukan.' });
    }

    // Cek apakah submission milik user yang sesuai
    // Konversi ke string untuk memastikan perbandingan yang benar
    if (String(submission.user_id) !== String(user_id)) {
      console.log('User ID mismatch:', { 
        submissionUserId: submission.user_id, 
        requestedUserId: user_id,
        types: {
          submissionUserIdType: typeof submission.user_id,
          requestedUserIdType: typeof user_id
        }
      });
      return res.status(403).json({ message: 'Anda tidak memiliki akses ke riwayat CSR ini.' });
    }

    res.json(submission);
  } catch (err) {
    console.error('Error fetching CSR history detail:', err);
    res.status(500).json({ message: 'Gagal mengambil detail riwayat CSR.' });
  }
};

// NEW: menghapus riwayat CSR
exports.deleteCSRHistory = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const { id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: 'Parameter user_id diperlukan.' });
    }

    const submission = await CsrSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({ message: 'Riwayat CSR tidak ditemukan.' });
    }

    // Cek apakah submission milik user yang sesuai
    if (String(submission.user_id) !== String(user_id)) {
      console.log('User ID mismatch for deletion:', { 
        submissionUserId: submission.user_id, 
        requestedUserId: user_id,
        types: {
          submissionUserIdType: typeof submission.user_id,
          requestedUserIdType: typeof user_id
        }
      });
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk menghapus riwayat CSR ini.' });
    }

    // Hapus file yang terupload jika ada
    const fs = require('fs');
    if (submission.proposal_url) {
      try {
        fs.unlinkSync(submission.proposal_url);
      } catch (err) {
        console.log('Error deleting proposal file:', err.message);
      }
    }
    
    if (submission.legality_url) {
      try {
        fs.unlinkSync(submission.legality_url);
      } catch (err) {
        console.log('Error deleting legality file:', err.message);
      }
    }

    // Hapus data dari database
    await submission.destroy();

    res.json({ message: 'Riwayat CSR berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting CSR history:', err);
    res.status(500).json({ message: 'Gagal menghapus riwayat CSR.' });
  }
};