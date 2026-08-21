const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadResume,
  uploadCertificationPdf,
  getJobRecommendations,
  getMyApplications,
  checkApplicationStatus,
  withdrawApplication,
} = require('../controllers/jobSeekerController');
const protect = require('../middleware/authMiddleware');
const restrict = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume/upload', upload.single('resume'), uploadResume);
router.post('/certification/upload', upload.single('certification'), uploadCertificationPdf);
router.get('/recommendations', getJobRecommendations);
router.get('/applications', getMyApplications);
router.get('/applications/check/:jobId', validateObjectId('jobId'), checkApplicationStatus);
router.patch('/applications/:id/withdraw', validateObjectId('id'), withdrawApplication);
router.delete('/applications/:id', validateObjectId('id'), withdrawApplication);

module.exports = router;
