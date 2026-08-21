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

// Multi-format file filter (PDF, JPEG, JPG, PNG, WEBP, BMP)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (
    allowedExtensions.includes(ext) ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.startsWith('image/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Supported formats: PDF, JPEG, JPG, PNG, WEBP, BMP'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter,
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
          resource_type: 'auto',
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

  const safeFilename = `${Date.now()}-${path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeFilename);
  fs.writeFileSync(filePath, buffer);

  return `/api/files/${safeFilename}`;
};

module.exports = {
  upload,
  isPdfMagicBytes,
  saveFile,
};
