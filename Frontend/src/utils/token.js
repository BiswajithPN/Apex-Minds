import { jwtDecode } from 'jwt-decode';

/**
 * Validates whether a JWT token exists, is well-formed, and has not expired.
 * @param {string} token
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  try {
    const decoded = jwtDecode(token);
    if (!decoded || !decoded.exp) return false;
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
