const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Mendapatkan profil user
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Didapatkan dari middleware auth

    const sql = "SELECT id_perusahaan, nama_perusahaan, email, no_telp, NIB, alamat FROM user_perusahaan WHERE id_perusahaan = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({ message: "Gagal mengambil data profil", error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Profil pengguna tidak ditemukan" });
      }

      res.json({ data: results[0] });
    });
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil profil" });
  }
};

// Mengupdate profil user
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Didapatkan dari middleware auth
    const { companyName, email, phoneNumber, address } = req.body;

    // Validasi input
    if (!companyName || !email || !phoneNumber || !address) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    const sql = "UPDATE user_perusahaan SET nama_perusahaan = ?, email = ?, no_telp = ?, alamat = ? WHERE id_perusahaan = ?";
    db.query(sql, [companyName, email, phoneNumber, address, userId], (err, result) => {
      if (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).json({ message: "Gagal memperbarui profil", error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Profil pengguna tidak ditemukan" });
      }

      res.json({ message: "Profil berhasil diperbarui" });
    });
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    res.status(500).json({ message: "Terjadi kesalahan saat memperbarui profil" });
  }
};

// Mengubah password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId; // Didapatkan dari middleware auth
    const { currentPassword, newPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Password lama dan baru harus diisi" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password baru minimal 8 karakter" });
    }

    // Ambil data user
    const getUserSql = "SELECT password FROM user_perusahaan WHERE id = ?";
    db.query(getUserSql, [userId], async (err, results) => {
      if (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ message: "Gagal mengambil data user", error: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan" });
      }

      const user = results[0];

      // Verifikasi password lama
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Password lama tidak sesuai" });
      }

      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const updateSql = "UPDATE user_perusahaan SET password = ? WHERE id = ?";
      db.query(updateSql, [hashedPassword, userId], (updateErr, updateResult) => {
        if (updateErr) {
          console.error('Error updating password:', updateErr);
          return res.status(500).json({ message: "Gagal memperbarui password", error: updateErr.message });
        }

        res.json({ message: "Password berhasil diperbarui" });
      });
    });
  } catch (err) {
    console.error('Error in changePassword:', err);
    res.status(500).json({ message: "Terjadi kesalahan saat mengubah password" });
  }
}; 