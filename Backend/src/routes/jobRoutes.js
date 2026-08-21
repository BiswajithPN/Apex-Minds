const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  applyForJob,
} = require('../controllers/jobController');
const { getApplicantsForJob, updateJob, deleteJob } = require('../controllers/employerController');
const protect = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

// Public routes
router.get('/', getJobs);
router.get('/:id', validateObjectId('id'), getJobById);

// Protected routes
router.post('/:id/apply', protect, validateObjectId('id'), applyForJob);
router.post('/applications', protect, (req, res, next) => {
  req.params.id = req.body.jobId;
  applyForJob(req, res, next);
});

// Employer shortcuts mapped under /api/jobs for frontend compatibility
router.post('/', protect, require('../controllers/employerController').createJob);
router.get('/employer/mine', protect, require('../controllers/employerController').getEmployerJobs);
router.get('/employer/stats', protect, require('../controllers/employerController').getEmployerStats);
router.get('/:id/applicants', protect, validateObjectId('id'), getApplicantsForJob);
router.patch('/:id', protect, validateObjectId('id'), updateJob);
router.delete('/:id', protect, validateObjectId('id'), deleteJob);

module.exports = router;
