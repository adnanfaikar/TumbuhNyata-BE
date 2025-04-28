const db = require('../config/db');

// Model untuk notifikasi
const Notification = {
  // Mendapatkan semua notifikasi berdasarkan user_id
  findByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        }
      );
    });
  },

  // Membuat notifikasi baru
  create: (notificationData) => {
    return new Promise((resolve, reject) => {
      const { user_id, title, message } = notificationData;
      db.query(
        'INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, false, NOW())',
        [user_id, title, message],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          
          // Ambil notifikasi yang baru dibuat
          db.query('SELECT * FROM notifications WHERE id = ?', [result.insertId], (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results[0]);
          });
        }
      );
    });
  },

  // Menandai notifikasi sebagai telah dibaca
  markAsRead: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE notifications SET is_read = true WHERE id = ?',
        [id],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  },

  // Menghapus notifikasi
  delete: (id) => {
    return new Promise((resolve, reject) => {
      db.query(
        'DELETE FROM notifications WHERE id = ?',
        [id],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }
};

module.exports = Notification; 