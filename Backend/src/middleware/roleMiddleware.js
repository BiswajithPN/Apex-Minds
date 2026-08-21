const { sendError } = require('../utils/apiResponse');

const restrict = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Role '${req.user ? req.user.role : 'none'}' is not authorized to access this resource`
      );
    }
    next();
  };
};

module.exports = restrict;
