const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const protect = require('../middleware/authMiddleware');
const { sendError } = require('../utils/apiResponse');

// GET /api/files/:filename
router.get('/:filename', protect, (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, '../../uploads', safeFilename);

  if (!fs.existsSync(filePath)) {
    return sendError(res, 404, 'File not found');
  }

  res.sendFile(filePath);
});

module.exports = router;
