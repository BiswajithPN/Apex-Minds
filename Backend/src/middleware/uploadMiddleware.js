const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

// Configure Cloudinary from CLOUDINARY_URL or individual keys
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Multer memory storage
const storage = multer.memoryStorage();

// Multi-format file filter (PDF, DOC, DOCX, JPEG, JPG, PNG, WEBP, BMP)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedExtensions.includes(ext) ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.includes('word') ||
    file.mimetype.includes('document')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Supported formats: PDF, DOC, DOCX, JPEG, JPG, PNG, WEBP'), false);
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

/**
 * Save file buffer directly to Cloudinary (for all PDF resumes, documents, and certifications)
 * Falls back gracefully to local uploads directory if Cloudinary keys are not yet set.
 */
const saveFile = async (buffer, filename, folder = 'hirehub/resumes') => {
  const isCloudinaryConfigured =
    Boolean(process.env.CLOUDINARY_URL) ||
    Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY);

  if (isCloudinaryConfigured) {
    try {
      const ext = path.extname(filename).toLowerCase();
      const isPdf = ext === '.pdf' || isPdfMagicBytes(buffer);

      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: isPdf ? 'raw' : 'auto',
            public_id: `${path.parse(filename).name}_${Date.now()}${isPdf ? '.pdf' : ''}`,
            use_filename: true,
            unique_filename: true,
            access_mode: 'public',
          },
          (error, result) => {
            if (error) {
              console.warn('[Cloudinary Stream warning, retrying with auto type]:', error.message);
              // Retry with auto
              const retryStream = cloudinary.uploader.upload_stream(
                {
                  folder,
                  resource_type: 'auto',
                  public_id: `${path.parse(filename).name}_${Date.now()}`,
                },
                (retryError, retryResult) => {
                  if (retryError) return reject(retryError);
                  console.log('[Cloudinary Upload Success]:', retryResult.secure_url);
                  resolve(retryResult.secure_url || retryResult.url);
                }
              );
              retryStream.end(buffer);
            } else {
              console.log('[Cloudinary Upload Success]:', result.secure_url);
              resolve(result.secure_url || result.url);
            }
          }
        );
        uploadStream.end(buffer);
      });
    } catch (err) {
      console.warn('[Cloudinary Upload Failed, using local storage fallback]:', err.message);
    }
  }

  // Fallback -> local disk storage (works locally, not on Vercel)
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeFilename = `${Date.now()}-${path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, buffer);
    return `/api/files/${safeFilename}`;
  } catch (err) {
    console.warn('[Local Storage Failed]:', err.message);
    throw new Error('File storage unavailable. Cloudinary is required for production.');
  }
};

module.exports = {
  upload,
  isPdfMagicBytes,
  saveFile,
};
