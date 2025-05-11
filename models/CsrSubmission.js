const db = require('../config/db');

// Model untuk pengajuan CSR
const CsrSubmission = {
  // Membuat pengajuan CSR baru
  create: (csrData) => {
    return new Promise((resolve, reject) => {
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
        proposal_url, 
        legality_url, 
        agreed 
      } = csrData;

      db.query(
        `INSERT INTO csr_submissions (
          user_id, program_name, category, description, location, 
          partner_name, start_date, end_date, budget, 
          proposal_url, legality_url, agreed, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          user_id, program_name, category, description, location, 
          partner_name, start_date, end_date, budget, 
          proposal_url, legality_url, agreed
        ],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          
          // Ambil pengajuan CSR yang baru dibuat
          db.query('SELECT * FROM csr_submissions WHERE id = ?', [result.insertId], (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results[0]);
          });
        }
      );
    });
  },

  // Mendapatkan detail pengajuan CSR berdasarkan ID
  findByPk: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM csr_submissions WHERE id = ?',
        [id],
        (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results[0]);
        }
      );
    });
  },

  // Mendapatkan semua pengajuan CSR
  findAll: () => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM csr_submissions ORDER BY created_at DESC',
        (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        }
      );
    });
  }
};

module.exports = CsrSubmission; 