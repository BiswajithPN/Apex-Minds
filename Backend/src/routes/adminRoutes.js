const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getUsers,
  toggleUserStatus,
  getFlaggedJobs,
  updateFlagStatus,
  getAnalyticsTrends,
} = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const restrict = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);
router.use(restrict('admin'));

router.get('/dashboard/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/status', validateObjectId('id'), toggleUserStatus);
router.get('/flagged-jobs', getFlaggedJobs);
router.get('/flagged', getFlaggedJobs);
router.patch('/flagged-jobs/:id/flag', validateObjectId('id'), updateFlagStatus);
router.patch('/jobs/:id/flag', validateObjectId('id'), updateFlagStatus);
router.get('/analytics', getAnalyticsTrends);

module.exports = router;
