const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return sendError(res, 401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id || decoded.sub).select('-password');
    if (!user) {
      return sendError(res, 401, 'User no longer exists');
    }

    if (!user.is_active) {
      return sendError(res, 403, 'Account has been deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Not authorized, token failed or expired');
  }
};

module.exports = protect;
