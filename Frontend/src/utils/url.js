const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Resolve file/storage URLs cleanly without leaking JWT tokens in query parameters:
 * - Cloudinary https:// URLs → returned as-is
 * - /api/files/xxx → prepended with backend base URL
 * - Legacy /uploads/xxx → rewritten to /api/files/xxx
 */
export function getStorageUrl(path) {
  if (!path) return '';

  // Already a full URL (Cloudinary, etc.)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Legacy /uploads/ path → rewrite to clean /api/files/ path
  if (path.startsWith('/uploads/')) {
    const filename = path.replace('/uploads/', '');
    return `${API_URL}/files/${filename}`;
  }

  // Already an API path
  if (path.startsWith('/api/files/')) {
    const base = API_URL.replace(/\/api\/?$/, '');
    return `${base}${path}`;
  }

  // Fallback: prepend API base
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_URL}/files/${cleanPath}`;
}
