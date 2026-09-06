const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE = API_URL.replace(/\/api$/, '');

/**
 * Get the current auth token.
 * Reads from authStore when possible (avoids coupling to Zustand internals),
 * falls back to direct localStorage parse.
 */
function getToken() {
  try {
    // Prefer authStore.getState() — avoids reading Zustand's internal storage shape
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: useAuthStore } = require('../store/authStore');
    return useAuthStore.getState().token || '';
  } catch {
    // Fallback: read from persisted state directly
    try {
      const stored = JSON.parse(localStorage.getItem('hirehub-auth') || '{}');
      return stored?.state?.token || '';
    } catch {
      return '';
    }
  }
}

/**
 * Resolve file/storage URLs:
 * - Full https:// URLs (Cloudinary, R2, etc.) → returned as-is
 * - /api/files/xxx  → prepend backend base URL
 * - /uploads/xxx    → rewrite to /api/files/xxx
 * - bare filename   → prepend /api/files/
 */
export function getStorageUrl(filePath) {
  if (!filePath) return '';

  // Already a full URL (Cloudinary / any CDN)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const token = getToken();
  const tokenParam = token ? `?token=${token}` : '';

  // Legacy /uploads/xxx  → rewrite to /api/files/xxx
  if (filePath.startsWith('/uploads/')) {
    const filename = filePath.replace('/uploads/', '');
    return `${API_BASE}/api/files/${encodeURIComponent(filename)}${tokenParam}`;
  }

  // Already an /api/files/xxx path
  if (filePath.startsWith('/api/files/')) {
    const sep = filePath.includes('?') ? '&' : '?';
    return `${API_BASE}${filePath}${token ? `${sep}token=${token}` : ''}`;
  }

  // Bare filename  → prepend API files route
  return `${API_BASE}/api/files/${encodeURIComponent(filePath)}${tokenParam}`;
}
