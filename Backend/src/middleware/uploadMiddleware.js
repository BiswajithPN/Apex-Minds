const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

// Cloudinary config
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

// Multer memory storage
const storage = multer.memoryStorage();

// PDF file filter
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: pdfFilter,
});

// Helper: Magic byte check for PDF (%PDF-)
const isPdfMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 4) return false;
  return buffer.toString('utf8', 0, 4) === '%PDF';
};

// Save buffer to Cloudinary or local disk
const saveFile = async (buffer, filename, folder = 'hirehub/resumes') => {
  // If Cloudinary configured -> upload
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          public_id: path.parse(filename).name,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Fallback -> local disk storage in ./uploads
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeFilename = path.basename(filename);
  const filePath = path.join(uploadDir, safeFilename);
  fs.writeFileSync(filePath, buffer);

  return `/api/files/${safeFilename}`;
};

module.exports = {
  upload,
  isPdfMagicBytes,
  saveFile,
};
