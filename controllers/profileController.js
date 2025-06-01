const { UserPerusahaan } = require('../models');
const bcrypt = require('bcryptjs');

// Mendapatkan profil user
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // Didapatkan dari middleware auth
    const user = await UserPerusahaan.findByPk(userId, {
      attributes: ['id_perusahaan', 'nama_perusahaan', 'email', 'no_telp', 'NIB', 'alamat']
    });
    if (!user) {
      return res.status(404).json({ message: "Profil pengguna tidak ditemukan" });
    }
    res.json({ data: user });
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

    const [updated] = await UserPerusahaan.update({
      nama_perusahaan: companyName,
      email,
      no_telp: phoneNumber,
      alamat: address
    }, {
      where: { id_perusahaan: userId }
    });

    if (updated === 0) {
      return res.status(404).json({ message: "Profil pengguna tidak ditemukan" });
    }

    res.json({ message: "Profil berhasil diperbarui" });
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
    const user = await UserPerusahaan.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password lama tidak sesuai" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserPerusahaan.update({ password: hashedPassword }, { where: { id_perusahaan: userId } });
    res.json({ message: "Password berhasil diperbarui" });
  } catch (err) {
    console.error('Error in changePassword:', err);
    res.status(500).json({ message: "Terjadi kesalahan saat mengubah password" });
  }
}; 