const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadResume,
  uploadAvatar,
  uploadCertification,
  getResumeAnalysis,
  getJobRecommendations,
  getMyApplications,
  applyForJob,
  withdrawApplication,
} = require('../controllers/jobSeekerController');
const protect = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Avatar upload
router.post('/avatar/upload', upload.single('avatar'), uploadAvatar);

// Resume upload & analysis routes (stored in Cloudinary / local storage)
router.post('/upload', upload.single('resume'), uploadResume);
router.post('/resume/upload', upload.single('resume'), uploadResume);
router.get('/analysis', getResumeAnalysis);
router.get('/resume/analysis', getResumeAnalysis);

// Certification upload routes (stored in Cloudinary hirehub/certifications)
router.post('/certifications/upload', upload.single('certificate'), uploadCertification);
router.post('/certification/upload', upload.single('certificate'), uploadCertification);

// Recommendations routes
router.get('/', getJobRecommendations);
router.get('/recommendations', getJobRecommendations);

// Applications routes
router.post('/', applyForJob);
router.post('/applications', applyForJob);
router.get('/applications', getMyApplications);
router.get('/applications/mine', getMyApplications);
router.get('/mine', getMyApplications);
router.patch('/applications/:id/withdraw', validateObjectId('id'), withdrawApplication);
router.delete('/applications/:id', validateObjectId('id'), withdrawApplication);

module.exports = router;
