const pdfParse = require('pdf-parse');

/**
 * Cleans extracted text.
 */
function cleanOCRText(text) {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/[^\x20-\x7E\n]/g, ' ');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length < 2) return false;
      const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
      return letterCount >= 2;
    })
    .join('\n');
  return cleaned;
}

/**
 * Extract text from a PDF file on disk.
 */
async function extractTextFromFile(filePath, mimetype) {
  const fs = require('fs');
  if (mimetype === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    return cleanOCRText(pdfData.text || '');
  }
  // Image files — no local OCR, return empty (use Cloudinary URL for viewing)
  return '';
}

/**
 * Extract text from a PDF buffer (memoryStorage uploads).
 * For image buffers, returns empty string — images are stored on Cloudinary for viewing.
 */
async function extractTextFromBuffer(buffer, originalname, mimetype) {
  const isPdf =
    mimetype === 'application/pdf' ||
    originalname.toLowerCase().endsWith('.pdf') ||
    (buffer.length > 4 && buffer.toString('utf8', 0, 4) === '%PDF');

  if (isPdf) {
    try {
      const pdfData = await pdfParse(buffer);
      return cleanOCRText(pdfData.text || '');
    } catch (err) {
      console.warn('[PDF Parse Error]', err.message);
      return '';
    }
  }

  // Image — no OCR engine available, return empty string
  // The image is stored on Cloudinary and viewable by URL
  return '';
}

/**
 * Async worker pool for limiting concurrency during batch jobs.
 */
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

function getTempDir() {
  // On Vercel, use /tmp (only writable directory)
  if (process.env.VERCEL) {
    return '/tmp';
  }
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(__dirname, '../../uploads');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch (e) {
    return '/tmp';
  }
}

module.exports = {
  cleanOCRText,
  extractTextFromFile,
  extractTextFromBuffer,
  asyncPool,
  getTempDir,
};
