/**
 * String Validation and Sanitization Utility
 * Ensures no empty or whitespace-only strings enter the database.
 */

const sanitizeString = (str, fallback = '') => {
  if (str === null || str === undefined) return fallback;
  const trimmed = String(str).trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const isNonEmptyString = (str) => {
  return typeof str === 'string' && str.trim().length > 0;
};

const sanitizeStringArray = (arr) => {
  if (Array.isArray(arr)) {
    return arr.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }
  if (typeof arr === 'string') {
    return arr.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
  }
  return [];
};

module.exports = {
  sanitizeString,
  isNonEmptyString,
  sanitizeStringArray,
};
