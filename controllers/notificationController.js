const Notification = require('../models/Notification');

// Controller untuk fitur notifikasi
const notificationController = {
  // Mendapatkan semua notifikasi berdasarkan user_id
  getNotifications: async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await Notification.findByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error retrieving notifications:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat mengambil notifikasi' });
    }
  },

  // Membuat notifikasi baru
  createNotification: async (req, res) => {
    try {
      const { user_id, title, message } = req.body;
      
      // Validasi input
      if (!user_id || !title || !message) {
        return res.status(400).json({ message: 'user_id, title, dan message harus diisi' });
      }

      const newNotification = await Notification.create({ user_id, title, message });
      res.status(201).json(newNotification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat membuat notifikasi' });
    }
  },

  // Menandai notifikasi sebagai dibaca
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      await Notification.markAsRead(id);
      res.json({ message: 'Notifikasi berhasil ditandai telah dibaca' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menandai notifikasi telah dibaca' });
    }
  },

  // Menghapus notifikasi
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      await Notification.delete(id);
      res.json({ message: 'Notifikasi berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Terjadi kesalahan saat menghapus notifikasi' });
    }
  }
};

module.exports = notificationController; 