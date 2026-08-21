const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getUsers,
  getUserDetails,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getAllJobs,
  getFlaggedJobs,
  updateFlagStatus,
  getAnalyticsTrends,
} = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const restrict = require('../middleware/roleMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);
router.use(restrict('admin'));

// Stats & Trends
router.get('/dashboard/stats', getAdminStats);
router.get('/analytics', getAnalyticsTrends);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', validateObjectId('id'), getUserDetails);
router.patch('/users/:id/status', validateObjectId('id'), toggleUserStatus);
router.patch('/users/:id/role', validateObjectId('id'), updateUserRole);
router.delete('/users/:id', validateObjectId('id'), deleteUser);

// Job & Content Moderation
router.get('/jobs', getAllJobs);
router.get('/flagged-jobs', getFlaggedJobs);
router.get('/flagged', getFlaggedJobs);
router.patch('/flagged-jobs/:id/flag', validateObjectId('id'), updateFlagStatus);
router.patch('/jobs/:id/flag', validateObjectId('id'), updateFlagStatus);

module.exports = router;
