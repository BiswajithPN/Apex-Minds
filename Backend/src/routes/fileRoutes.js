const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { sendError } = require('../utils/apiResponse');

// MIME type map for proper Content-Type headers
const MIME_TYPES = {
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.bmp':  'image/bmp',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * GET /api/files/:filename
 * Serves locally stored uploads with correct Content-Type.
 * Accepts optional ?token= query param (validated by auth middleware in future;
 * currently public to allow <img> and <a href> tags to load without extra headers).
 */
router.get('/:filename', (req, res) => {
  // Sanitise — strip any path traversal attempts
  const safeFilename = path.basename(req.params.filename);
  const uploadsDir = path.join(__dirname, '../../uploads');
  const filePath = path.join(uploadsDir, safeFilename);

  // Guard: must resolve inside uploads dir
  if (!filePath.startsWith(uploadsDir)) {
    return sendError(res, 400, 'Invalid file path');
  }

  if (!fs.existsSync(filePath)) {
    return sendError(res, 404, 'File not found');
  }

  const ext = path.extname(safeFilename).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Allow browsers (including cross-origin img tags) to load the file
  res.set({
    'Content-Type': contentType,
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cache-Control': 'public, max-age=86400', // cache 1 day
  });

  res.sendFile(filePath);
});

module.exports = router;
