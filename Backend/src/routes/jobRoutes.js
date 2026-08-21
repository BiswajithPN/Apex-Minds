const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  applyForJob,
} = require('../controllers/jobController');
const {
  getApplicantsForJob,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs,
  getEmployerStats,
} = require('../controllers/employerController');
const protect = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

// Public routes
router.get('/', getJobs);
router.get('/:id', validateObjectId('id'), getJobById);

// Job Seeker apply routes
router.post('/:id/apply', protect, validateObjectId('id'), applyForJob);
router.post('/applications', protect, (req, res, next) => {
  req.params.id = req.body.jobId;
  applyForJob(req, res, next);
});

// Employer Job Management routes (mapped under both /api/jobs and /api/employer)
router.post('/', protect, createJob);
router.post('/jobs', protect, createJob);
router.get('/employer/mine', protect, getEmployerJobs);
router.get('/employer/stats', protect, getEmployerStats);
router.get('/mine', protect, getEmployerJobs);
router.get('/:id/applicants', protect, validateObjectId('id'), getApplicantsForJob);
router.put('/:id', protect, validateObjectId('id'), updateJob);
router.patch('/:id', protect, validateObjectId('id'), updateJob);
router.delete('/:id', protect, validateObjectId('id'), deleteJob);

module.exports = router;
