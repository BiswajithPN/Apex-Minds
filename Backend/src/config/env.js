const path = require('path');

// Load the single authoritative .env — Backend/.env takes precedence over workspace root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
// Fallback: if running from workspace root (e.g. `node Backend/server.js`)
if (!process.env.JWT_SECRET) {
  require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
}
// Last resort: CWD .env
if (!process.env.JWT_SECRET) {
  require('dotenv').config();
}

// SEC-01: JWT_SECRET is required — never fall back to a hardcoded string
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

const env = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/hirehub',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

module.exports = env;
