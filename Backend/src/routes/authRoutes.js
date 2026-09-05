const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleAuth,
  getMe,
  changePassword,
  adminLogin,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;
