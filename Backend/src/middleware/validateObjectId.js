const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(id) && !id.startsWith('mock-')) {
      return sendError(res, 400, `Invalid ID parameter: ${id}`);
    }
    next();
  };
};

module.exports = validateObjectId;
