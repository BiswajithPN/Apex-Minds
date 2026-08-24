const express = require('express');
const router = express.Router();
const {
  analyzeApplication,
  getApplicationAnalysis,
  getJobCandidateRankings,
  getJobFairnessAudit,
  getApplicationExplanation,
  updateJobRubric,
  getNotifications,
  markNotificationRead
} = require('../controllers/analysisController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

// 1. In-App Notifications routes (Placed before parameterized routes)
router.get('/all', getNotifications);
router.get('/notifications/all', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/:id/read', markNotificationRead);

// 2. Job Rankings & Leaderboard
router.get('/jobs/:jobId/rankings', getJobCandidateRankings);
router.get('/job/:jobId/rankings', getJobCandidateRankings);

// 3. Job Fairness Auditing
router.get('/jobs/:jobId/fairness', getJobFairnessAudit);
router.get('/job/:jobId/fairness', getJobFairnessAudit);

// 4. Candidate Constructive Rejection & Feedback Explanation
router.get('/applications/:applicationId/explanation', getApplicationExplanation);
router.get('/application/:applicationId/explanation', getApplicationExplanation);

// 5. Job Rubric & Threshold Configuration
router.patch('/jobs/:jobId/rubric', updateJobRubric);
router.patch('/job/:jobId/rubric', updateJobRubric);

// 6. Analysis Operations & Specific Application ID
router.post('/analyze/:applicationId', analyzeApplication);
router.get('/:applicationId', getApplicationAnalysis);

module.exports = router;
