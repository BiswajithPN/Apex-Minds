const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

/**
 * Ensures temporary uploads/processing directory exists.
 */
function getTempDir() {
  const dir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Pre-processes an image for multi-pass OCR accuracy.
 */
async function preprocessImage(inputPath) {
  const uploadDir = getTempDir();
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const processedPaths = [];

  try {
    const metadata = await sharp(inputPath).metadata();
    const targetWidth = Math.max(metadata.width || 2000, 2000);

    // Pass 1: Grayscale + high contrast + sharpen
    const pass1Path = path.join(uploadDir, `${baseName}_pass1.png`);
    await sharp(inputPath)
      .resize({ width: targetWidth, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.5 })
      .modulate({ brightness: 1.1 })
      .png()
      .toFile(pass1Path);
    processedPaths.push(pass1Path);

    // Pass 2: Binary threshold (pure B&W)
    const pass2Path = path.join(uploadDir, `${baseName}_pass2.png`);
    await sharp(inputPath)
      .resize({ width: targetWidth, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .threshold(140)
      .png()
      .toFile(pass2Path);
    processedPaths.push(pass2Path);

    // Pass 3: Lower threshold for lighter/faint text
    const pass3Path = path.join(uploadDir, `${baseName}_pass3.png`);
    await sharp(inputPath)
      .resize({ width: targetWidth, withoutEnlargement: false })
      .grayscale()
      .normalize()
      .threshold(100)
      .sharpen({ sigma: 2 })
      .png()
      .toFile(pass3Path);
    processedPaths.push(pass3Path);
  } catch (err) {
    console.error('[Sharp Preprocessing Error]', err.message);
    processedPaths.push(inputPath);
  }

  return processedPaths;
}

/**
 * Fast single-pass preprocessor designed for batch processing of 10–150 resumes.
 */
async function preprocessImageFast(inputPath) {
  const uploadDir = getTempDir();
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const passPath = path.join(uploadDir, `${baseName}_fast.png`);

  try {
    await sharp(inputPath)
      .resize({ width: 1500, withoutEnlargement: true })
      .grayscale()
      .normalize()
      .threshold(128)
      .png()
      .toFile(passPath);
    return passPath;
  } catch (err) {
    return inputPath;
  }
}

/**
 * Runs Tesseract OCR on a local image.
 */
async function runOCR(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
    return text || '';
  } catch (err) {
    console.error('[Tesseract OCR Error]', err.message);
    return '';
  }
}

/**
 * Cleans extracted OCR text.
 */
function cleanOCRText(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove non-printable characters except newlines
  cleaned = cleaned.replace(/[^\x20-\x7E\n]/g, ' ');

  // Collapse excessive spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Filter noisy lines with too few letters
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
 * Jaccard word-level similarity.
 */
function computeSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  return intersection / Math.min(wordsA.size, wordsB.size);
}

/**
 * Merges multiple OCR pass outputs via line-by-line voting.
 */
function mergeOCRResults(texts) {
  const allLines = new Set();
  for (const text of texts) {
    const lines = (text || '').split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    for (const line of lines) {
      allLines.add(line);
    }
  }

  const lineArray = [...allLines];
  const finalLines = [];
  const used = new Set();

  for (let i = 0; i < lineArray.length; i++) {
    if (used.has(i)) continue;
    let bestLine = lineArray[i];

    for (let j = i + 1; j < lineArray.length; j++) {
      if (used.has(j)) continue;
      const similarity = computeSimilarity(lineArray[i], lineArray[j]);
      if (similarity > 0.6) {
        const lettersI = (lineArray[i].match(/[a-zA-Z]/g) || []).length;
        const lettersJ = (lineArray[j].match(/[a-zA-Z]/g) || []).length;
        if (lettersJ > lettersI) {
          bestLine = lineArray[j];
        }
        used.add(j);
      }
    }

    finalLines.push(bestLine);
    used.add(i);
  }

  return finalLines.join('\n');
}

/**
 * Extracts text from file buffer/path (PDF or Image).
 */
async function extractTextFromFile(filePath, mimetype) {
  if (mimetype === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(buffer);
    return cleanOCRText(pdfData.text || '');
  } else {
    // Image OCR
    const processedPaths = await preprocessImage(filePath);
    const passTexts = [];
    for (const p of processedPaths) {
      const txt = await runOCR(p);
      passTexts.push(cleanOCRText(txt));
      // Cleanup intermediate pass files
      if (p !== filePath) {
        try { fs.unlinkSync(p); } catch (e) {}
      }
    }
    return mergeOCRResults(passTexts);
  }
}

/**
 * Asynchronous worker pool for limiting concurrency during batch jobs.
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

module.exports = {
  preprocessImage,
  preprocessImageFast,
  runOCR,
  cleanOCRText,
  mergeOCRResults,
  extractTextFromFile,
  asyncPool,
  getTempDir
};
