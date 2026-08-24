const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE = API_URL.replace(/\/api$/, '');

/**
 * Resolve file/storage URLs:
 * - Cloudinary https:// URLs → returned as-is
 * - /api/files/xxx → prepended with backend base + ?token= for auth
 * - Legacy /uploads/xxx → rewritten to /api/files/xxx
 */
export function getStorageUrl(path) {
  if (!path) return '';

  // Already a full URL (Cloudinary, etc.)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Get token for authenticated file access
  const stored = JSON.parse(localStorage.getItem('hirehub-auth') || '{}');
  const token = stored?.state?.token || '';

  // Legacy /uploads/ path → rewrite
  if (path.startsWith('/uploads/')) {
    const filename = path.replace('/uploads/', '');
    return `${API_URL}/files/${filename}?token=${token}`;
  }

  // Already an API path
  if (path.startsWith('/api/files/')) {
    const separator = path.includes('?') ? '&' : '?';
    return `${API_BASE}${path}${separator}token=${token}`;
  }

  // Fallback: prepend API base
  const separator = path.includes('?') ? '&' : '?';
  return `${API_URL}/files/${path}${separator}token=${token}`;
}
