const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Route untuk mendapatkan semua notifikasi berdasarkan user_id
router.get('/:userId', notificationController.getNotifications);

// Route untuk membuat notifikasi baru
router.post('/', notificationController.createNotification);

// Route untuk menandai notifikasi sebagai dibaca
router.patch('/:id/read', notificationController.markAsRead);

// Route untuk menghapus notifikasi
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 