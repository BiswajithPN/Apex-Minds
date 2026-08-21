const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendAccountConfirmationEmail, sendPasswordChangeEmail } = require('../services/emailService');

const googleClient = new OAuth2Client();

// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    return sendError(res, 400, 'Please provide full_name, email, and password');
  }

  const allowedRoles = ['jobseeker', 'employer'];
  const userRole = allowedRoles.includes(role) ? role : 'jobseeker';

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return sendError(res, 400, 'Account already exists with this email. Please sign in instead.');
  }

  const user = await User.create({
    full_name,
    email: email.toLowerCase(),
    password,
    role: userRole,
  });

  // Create empty profile
  if (userRole === 'jobseeker') {
    await JobSeekerProfile.create({ userId: user._id, full_name });
  } else if (userRole === 'employer') {
    await EmployerProfile.create({ userId: user._id, company_name: full_name });
  }

  // Trigger welcome / confirmation email
  sendAccountConfirmationEmail(user.email, user.full_name);

  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  return sendSuccess(
    res,
    201,
    {
      token,
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
    'Account registered successfully'
  );
});

// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
  if (!user) {
    return sendError(res, 404, 'Account not found with this email. Please sign up first.');
  }

  if (user.isLocked) {
    return sendError(
      res,
      429,
      'Account locked due to too many failed login attempts. Try again after 15 minutes.'
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    return sendError(res, 401, 'Invalid password. Please try again.');
  }

  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  return sendSuccess(
    res,
    200,
    {
      token,
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
    'Login successful'
  );
});

// POST /api/auth/google
const googleAuth = asyncHandler(async (req, res) => {
  const { credential, role, isSignUp } = req.body;

  if (!credential) {
    return sendError(res, 400, 'Google credential token is required');
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential });
    payload = ticket.getPayload();
  } catch (err) {
    return sendError(res, 400, 'Invalid Google OAuth credential token');
  }

  const { email, name, sub: google_id, picture } = payload;
  const normalizedEmail = email.toLowerCase();

  let user = await User.findOne({ email: normalizedEmail });

  // 1. LOGIN FLOW (isSignUp === false)
  if (!isSignUp) {
    if (!user) {
      return sendError(
        res,
        404,
        `No account found for ${normalizedEmail}. Please sign up first before logging in.`
      );
    }

    if (!user.google_id) {
      user.google_id = google_id;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }
  } 
  // 2. SIGNUP FLOW (isSignUp === true)
  else {
    if (user) {
      return sendError(
        res,
        400,
        `An account with email ${normalizedEmail} already exists. Please sign in instead.`
      );
    }

    const allowedRoles = ['jobseeker', 'employer'];
    const userRole = allowedRoles.includes(role) ? role : 'jobseeker';
    const randomHash = crypto.randomBytes(16).toString('hex');

    user = await User.create({
      full_name: name || 'Google User',
      email: normalizedEmail,
      google_id,
      avatar: picture || '',
      role: userRole,
      password: randomHash,
    });

    if (userRole === 'jobseeker') {
      await JobSeekerProfile.create({ userId: user._id, full_name: user.full_name });
    } else if (userRole === 'employer') {
      await EmployerProfile.create({ userId: user._id, company_name: user.full_name });
    }

    // Trigger welcome / confirmation email for new Google signup
    sendAccountConfirmationEmail(user.email, user.full_name);
  }

  const token = generateToken({ id: user._id, role: user.role, email: user.email });

  return sendSuccess(
    res,
    isSignUp ? 201 : 200,
    {
      token,
      user: {
        _id: user._id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
    isSignUp ? 'Google registration successful' : 'Google login successful'
  );
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  return sendSuccess(res, 200, {
    user: {
      _id: user._id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (user.password) {
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 400, 'Current password is incorrect');
    }
  }

  user.password = newPassword;
  await user.save();

  // Send password change notification email
  sendPasswordChangeEmail(user.email);

  return sendSuccess(res, 200, {}, 'Password changed successfully');
});

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  getMe,
  changePassword,
};
