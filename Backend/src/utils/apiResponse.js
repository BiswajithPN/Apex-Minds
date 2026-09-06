/**
 * Standard API response helpers.
 *
 * sendSuccess spreads the payload directly into the response body so that
 * frontend code can access fields like response.data.jobs, response.data.token
 * etc. without an extra .data layer.
 *
 * Shape: { success: true, message?, ...payload }
 */
const sendSuccess = (res, statusCode = 200, payload = {}, message = '') => {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    ...payload,
  });
};

const sendError = (res, statusCode = 400, message = 'An error occurred', code = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(code ? { code } : {}),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
