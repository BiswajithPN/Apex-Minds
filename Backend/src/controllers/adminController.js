const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/dashboard/stats (Also mapped to /api/analytics/dashboard)
const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const jobseekers = await User.countDocuments({ role: 'jobseeker' });
  const employers = await User.countDocuments({ role: 'employer' });
  const activeJobs = await Job.countDocuments({ status: 'open', flagged: false });
  const totalApplications = await Application.countDocuments();

  return sendSuccess(res, 200, {
    totalUsers,
    jobseekers,
    employers,
    activeJobs,
    totalApplications,
  });
});

// GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  return sendSuccess(res, 200, { users });
});

// PATCH /api/admin/users/:id/status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');

  user.is_active = status === 'active';
  await user.save();

  return sendSuccess(res, 200, { user }, `User status updated to ${status}`);
});

// GET /api/admin/flagged-jobs
const getFlaggedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ flagged: true }).populate('employerId', 'full_name email');
  return sendSuccess(res, 200, { jobs });
});

// PATCH /api/admin/flagged-jobs/:id/flag
const updateFlagStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 404, 'Job not found');

  if (status === 'open') {
    job.flagged = false;
    job.flag_reason = '';
  } else if (status === 'flagged') {
    job.flagged = true;
  }
  await job.save();

  return sendSuccess(res, 200, { job }, 'Flag status updated');
});

// GET /api/admin/analytics (Also mapped to /api/analytics/trends)
const getAnalyticsTrends = asyncHandler(async (req, res) => {
  const statusCounts = {
    pending: await Application.countDocuments({ status: 'pending' }),
    reviewing: await Application.countDocuments({ status: 'reviewing' }),
    shortlisted: await Application.countDocuments({ status: 'shortlisted' }),
    interview: await Application.countDocuments({ status: 'interview' }),
    accepted: await Application.countDocuments({ status: 'accepted' }),
    rejected: await Application.countDocuments({ status: 'rejected' }),
  };

  return sendSuccess(res, 200, { statusCounts });
});

module.exports = {
  getAdminStats,
  getUsers,
  toggleUserStatus,
  getFlaggedJobs,
  updateFlagStatus,
  getAnalyticsTrends,
};
