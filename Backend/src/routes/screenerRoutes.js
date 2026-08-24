const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  screenResumeFile,
  screenResumeText,
  screenBatchResumes,
  auditJD,
  screenApplication,
  screenJobApplicants,
  getJobsListForScreener
} = require('../controllers/screenerController');

const router = express.Router();

// Memory storage — works on Vercel (read-only filesystem)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only Images (PNG, JPG, WEBP, BMP) and PDF files are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB per file limit
});

// Single Resume Screening (accepts 'resumeFile' or 'resumeImage')
router.post(
  '/screen-resume',
  upload.single('resumeFile'),
  (req, res, next) => {
    next();
  },
  screenResumeFile
);

// Pasted Text Screening
router.post('/screen-text', screenResumeText);

// Batch Screening (up to 150 files)
router.post('/screen-batch', upload.array('resumeFiles', 150), screenBatchResumes);

// Job Description Bias and Inclusivity Auditor
router.post('/audit-jd', auditJD);

// Application Bias-Aware Screening
router.post('/screen-application/:id', screenApplication);

// Screen All Applicants for a specific Job post
router.post('/job/:jobId/screen-all', screenJobApplicants);
router.get('/job/:jobId/screen-all', screenJobApplicants);

// Get list of all jobs with applicant counts for screener UI
router.get('/jobs-list', getJobsListForScreener);

module.exports = router;
