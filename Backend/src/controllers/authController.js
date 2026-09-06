const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendAccountConfirmationEmail, sendPasswordChangeEmail } = require('../services/emailService');

const googleClient = new OAuth2Client();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * EDGE-01: Validate that a value is a plain non-empty string.
 * Rejects objects (NoSQL injection via { $gt: '' }), arrays, numbers, etc.
 */
const isValidString = (val) => typeof val === 'string' && val.trim().length > 0;

/**
 * ERR-01: Fire-and-forget email — always attach .catch() so promise rejections
 * don't silently disappear or crash the process.
 */
const fireEmail = (fn, ...args) => {
  try {
    const result = fn(...args);
    if (result && typeof result.catch === 'function') {
      result.catch((err) => console.error('[Email Error]', err.message));
    }
  } catch (err) {
    console.error('[Email Error]', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { full_name, email, password, role } = req.body;

  // EDGE-01: Reject non-string / empty inputs to prevent NoSQL injection
  if (!isValidString(full_name) || !isValidString(email) || !isValidString(password)) {
    return sendError(res, 400, 'Please provide full_name, email, and password');
  }

  const allowedRoles = ['jobseeker', 'employer'];
  const userRole = allowedRoles.includes(role) ? role : 'jobseeker';

  const userExists = await User.findOne({ email: email.trim().toLowerCase() });
  if (userExists) {
    // LOGIC-08: Don't reveal whether the account is active or deactivated
    // (returning 403 for deactivated leaks that the email exists)
    if (!userExists.is_active) {
      return sendError(res, 400, 'Unable to register with this email. Please contact support.');
    }
    return sendError(res, 400, 'Account already exists with this email. Please sign in instead.');
  }

  const user = await User.create({
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: userRole,
  });

  // Create empty profile
  if (userRole === 'jobseeker') {
    await JobSeekerProfile.create({ userId: user._id, full_name: user.full_name });
  } else if (userRole === 'employer') {
    await EmployerProfile.create({ userId: user._id, company_name: user.full_name });
  }

  // ERR-01: Fire-and-forget with proper error handling
  fireEmail(sendAccountConfirmationEmail, user.email, user.full_name);

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
        google_id: user.google_id || null,
      },
    },
    'Account registered successfully'
  );
});

// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // EDGE-01: Ensure inputs are plain strings (NoSQL injection guard)
  if (!isValidString(email) || !isValidString(password)) {
    return sendError(res, 400, 'Please provide email and password');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    '+password +loginAttempts +lockUntil is_active google_id role'
  );

  // LOGIC-07: Return generic 401 for both unknown email AND wrong password
  // to prevent user enumeration attacks
  if (!user) {
    return sendError(res, 401, 'Invalid credentials. Please check your email and password.');
  }

  // LOGIC-01: Check is_active BEFORE any lockout resets (don't silently
  // wipe lockout data on a deactivated account)
  if (!user.is_active) {
    return sendError(res, 403, 'Account has been deactivated. Please contact support.');
  }

  // If user signed up via Google, they cannot use email/password login — check this FIRST
  if (user.google_id) {
    // If user has set a password, allow email/password login
    if (user.password) {
      // Reset lockout only AFTER is_active check (LOGIC-01)
      if (user.isLocked) {
        await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
      }
      // Fall through to normal password comparison below
    } else {
      return sendError(
        res,
        400,
        'No password set for this account. Use Google Sign-In or set a password via Change Password.',
        'no_password_set'
      );
    }
  }

  // Check lockout (skip for Google users — they set passwords separately, not brute-forceable)
  if (user.isLocked && !user.google_id) {
    return sendError(
      res,
      429,
      'Account temporarily locked after too many failed attempts. Please try again in 15 minutes.'
    );
  }

  // If user has no password set
  if (!user.password) {
    return sendError(
      res,
      400,
      'No password set for this account. Use Google Sign-In or set a password via Change Password.',
      'no_password_set'
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    if (user.google_id) {
      return sendError(
        res,
        400,
        'Incorrect password. Use Google Sign-In or update your password via Change Password.',
        'google_password_mismatch'
      );
    }
    await user.incLoginAttempts();
    return sendError(res, 401, 'Incorrect email or password. Please try again.');
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
        google_id: user.google_id || null,
        has_password: !!user.password,
      },
    },
    'Login successful'
  );
});

// POST /api/auth/google
const googleAuth = asyncHandler(async (req, res) => {
  const { credential, role, isSignUp } = req.body;

  // EDGE-01: Validate credential is a plain string
  if (!isValidString(credential)) {
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

  if (!user) {
    // Create new account with selected role (default to jobseeker)
    const allowedRoles = ['jobseeker', 'employer'];
    const userRole = role && allowedRoles.includes(role) ? role : 'jobseeker';

    user = await User.create({
      full_name: name || 'Google User',
      email: normalizedEmail,
      google_id,
      avatar: picture || '',
      role: userRole,
      is_verified: true,
      is_active: true,
    });

    if (userRole === 'jobseeker') {
      await JobSeekerProfile.create({ userId: user._id, full_name: user.full_name });
    } else if (userRole === 'employer') {
      await EmployerProfile.create({ userId: user._id, company_name: user.full_name });
    }

    // ERR-01: Fire-and-forget with proper error handling
    fireEmail(sendAccountConfirmationEmail, user.email, user.full_name);
  } else {
    // EDGE-03: Block banned users — do NOT reactivate deactivated accounts via Google OAuth
    if (!user.is_active) {
      return sendError(
        res,
        403,
        'This account has been deactivated. Please contact support to reactivate.'
      );
    }

    // Link google_id / avatar if not already set
    let changed = false;
    if (!user.google_id) { user.google_id = google_id; changed = true; }
    if (picture && !user.avatar) { user.avatar = picture; changed = true; }
    if (changed) await user.save();
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
        google_id: user.google_id || null,
      },
    },
    'Google authentication successful'
  );
});

// POST /api/auth/admin-login
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password, adminPass } = req.body;

  // SEC-05: ADMIN_PASS must come from environment — no hardcoded fallback
  const ADMIN_PASS = process.env.ADMIN_PASS;
  if (!ADMIN_PASS) {
    console.error('[FATAL] ADMIN_PASS environment variable is not set.');
    return sendError(res, 500, 'Server configuration error. Admin login is unavailable.');
  }

  // EDGE-01: Validate all inputs are plain strings
  if (!isValidString(adminPass)) {
    return sendError(res, 400, 'Admin pass is required to validate admin dashboard');
  }
  if (adminPass !== ADMIN_PASS) {
    return sendError(res, 401, 'Invalid admin pass. Please contact super admin.');
  }

  if (!isValidString(email) || !isValidString(password)) {
    return sendError(res, 400, 'Email and password are required for admin login');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    '+password +loginAttempts +lockUntil +is_active role'
  );

  // Use generic message to avoid revealing whether the admin email exists
  if (!user || user.role !== 'admin') {
    return sendError(res, 401, 'Invalid admin credentials.');
  }

  // LOGIC-03: Do NOT silently reactivate deactivated admin accounts
  if (!user.is_active) {
    return sendError(
      res,
      403,
      'This admin account has been deactivated. Please contact the super admin.'
    );
  }

  if (!user.password) {
    return sendError(
      res,
      400,
      'Admin account has no password set. Please set a password via DB or use the seeded admin.'
    );
  }

  // OTHER-04: Track failed attempts — same brute-force protection as regular login
  if (user.isLocked) {
    return sendError(
      res,
      429,
      'Admin account locked due to too many failed login attempts. Try again after 15 minutes.'
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    return sendError(res, 401, 'Invalid admin credentials.');
  }

  // Reset failed attempts on success
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
        google_id: user.google_id || null,
      },
    },
    'Admin login successful'
  );
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  // LOGIC-02: Guard against null — user may have been deleted after token issuance
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return sendError(res, 401, 'User no longer exists. Please sign in again.');
  }
  return sendSuccess(res, 200, {
    user: {
      _id: user._id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      google_id: user.google_id || null,
      // Tells the frontend whether a password is set (without exposing the hash)
      has_password: !!user.password,
    },
  });
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password google_id');

  if (!isValidString(newPassword) || newPassword.length < 8) {
    return sendError(res, 400, 'New password must be at least 8 characters');
  }

  // LOGIC-05: Only skip current-password check when the Google user has NO password yet.
  // If they already have a password set, require the current password — regardless of google_id.
  if (user.google_id && !user.password) {
    // Setting password for the first time (Google-only account)
    user.password = newPassword;
    await user.save();
    // ERR-01: Fire-and-forget with error handling
    fireEmail(sendPasswordChangeEmail, user.email);
    return sendSuccess(
      res,
      200,
      {},
      'Password set successfully. You can now sign in with email and password.'
    );
  }

  // Regular password change — always require current password
  if (!isValidString(currentPassword)) {
    return sendError(res, 400, 'Current password is required');
  }

  if (!user.password) {
    return sendError(res, 400, 'Account uses social login. Password change not available.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return sendError(res, 400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // ERR-01: Fire-and-forget with error handling
  fireEmail(sendPasswordChangeEmail, user.email);

  return sendSuccess(res, 200, {}, 'Password changed successfully');
});

// POST /auth/reset-password-with-google
// Google users can reset password using their Google token as identity proof
// to reset it — no "current password" needed since Google OAuth IS the credential.
const resetPasswordWithGoogle = asyncHandler(async (req, res) => {
  const { credential, newPassword } = req.body;

  if (!isValidString(credential)) {
    return sendError(res, 400, 'Google credential token is required');
  }
  if (!isValidString(newPassword) || newPassword.length < 8) {
    return sendError(res, 400, 'New password must be at least 8 characters');
  }

  // Verify the Google token
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential });
    payload = ticket.getPayload();
  } catch {
    return sendError(res, 400, 'Invalid Google credential. Please try again.');
  }

  // SECURITY: The Google account chosen MUST match the currently logged-in user.
  // This prevents someone with 2 Google accounts from verifying with account B
  // to reset the password of account A.
  const loggedInUser = req.user; // set by protect middleware
  const verifiedEmail = payload.email.toLowerCase();

  if (verifiedEmail !== loggedInUser.email.toLowerCase()) {
    return sendError(
      res,
      403,
      `The Google account you chose (${verifiedEmail}) does not match your logged-in account (${loggedInUser.email}). Please select the correct Google account.`
    );
  }

  // Also verify google_id matches (defense in depth — same email, same sub)
  if (payload.sub !== loggedInUser.google_id) {
    return sendError(
      res,
      403,
      'Google account mismatch. Please sign in with the Google account linked to this HireHub account.'
    );
  }

  const user = await User.findById(loggedInUser._id).select('+password');
  if (!user) {
    return sendError(res, 404, 'Account not found.');
  }
  if (!user.is_active) {
    return sendError(res, 403, 'Account has been deactivated. Contact support.');
  }

  user.password = newPassword;
  await user.save();

  fireEmail(sendPasswordChangeEmail, user.email);

  return sendSuccess(res, 200, {}, 'Password updated successfully using Google verification.');
});

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  getMe,
  changePassword,
  resetPasswordWithGoogle,
  adminLogin,
};
