const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleAuth,
  getMe,
  changePassword,
  resetPasswordWithGoogle,
  adminLogin,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
// Google users can reset password using their Google token as identity proof
// Must be authenticated — protect ensures req.user matches the token owner
router.post('/reset-password-with-google', protect, resetPasswordWithGoogle);

module.exports = router;
