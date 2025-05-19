const express = require('express');
const { getUserProfile, updateUserProfile, changePassword } = require('../controllers/profileController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware autentikasi untuk semua routes
router.use(verifyToken);

// Route untuk profil
router.get('/me', getUserProfile);
router.put('/update', updateUserProfile);
router.put('/change-password', changePassword);

module.exports = router; 