const sendSuccess = (res, statusCode = 200, data = {}, message = '') => {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...data,
  });
};

const sendError = (res, statusCode = 400, message = 'An error occurred', detail = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(detail ? { detail } : {}),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
