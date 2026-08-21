const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleAuth,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;
