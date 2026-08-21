const express = require('express');
const router = express.Router();
const {
  getCompanyProfile,
  updateCompanyProfile,
  getEmployerJobs,
  createJob,
  updateJob,
  deleteJob,
  getApplicantsForJob,
  updateApplicationStatus,
  scheduleInterview,
  getCandidateProfile,
  getEmployerStats,
} = require('../controllers/employerController');
const protect = require('../middleware/authMiddleware');
const restrict = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);
router.use(restrict('employer'));

router.get('/company', getCompanyProfile);
router.put('/company', updateCompanyProfile);
router.get('/jobs', getEmployerJobs);
router.get('/jobs/mine', getEmployerJobs);
router.get('/employer/mine', getEmployerJobs);
router.get('/jobs/stats', getEmployerStats);
router.post('/jobs', createJob);
router.put('/jobs/:id', validateObjectId('id'), updateJob);
router.delete('/jobs/:id', validateObjectId('id'), deleteJob);
router.get('/jobs/:id/applicants', validateObjectId('id'), getApplicantsForJob);
router.patch('/applications/:id/status', validateObjectId('id'), updateApplicationStatus);
router.patch('/applications/:id/interview', validateObjectId('id'), scheduleInterview);
router.put('/applications/:id/interview', validateObjectId('id'), scheduleInterview);
router.get('/candidates/:id', validateObjectId('id'), getCandidateProfile);

module.exports = router;
