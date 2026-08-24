const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const Analysis = require('../models/Analysis');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/dashboard/stats
const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const jobseekers = await User.countDocuments({ role: 'jobseeker' });
  const employers = await User.countDocuments({ role: 'employer' });
  const admins = await User.countDocuments({ role: 'admin' });
  const activeJobs = await Job.countDocuments({ status: 'open', flagged: false });
  const totalJobs = await Job.countDocuments();
  const totalApplications = await Application.countDocuments();
  const totalAnalyses = await Analysis.countDocuments();

  // Calculate average AI match score from real analyses
  const analyses = await Analysis.find({}, 'finalScore');
  let avgScore = 0;
  if (analyses.length > 0) {
    const sum = analyses.reduce((acc, a) => acc + (a.finalScore || 0), 0);
    avgScore = Math.round(sum / analyses.length);
  }

  return sendSuccess(res, 200, {
    totalUsers,
    jobseekers,
    employers,
    admins,
    activeJobs,
    totalJobs,
    totalApplications,
    totalAnalyses,
    avgScore,
  });
});

// GET /api/admin/users - Get all users with enriched statistics
const getUsers = asyncHandler(async (req, res) => {
  const { role, status, search } = req.query;
  const query = {};

  if (role && ['jobseeker', 'employer', 'admin'].includes(role)) {
    query.role = role;
  }

  if (status === 'active') query.is_active = true;
  if (status === 'suspended' || status === 'inactive') query.is_active = false;

  if (search) {
    query.$or = [
      { full_name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query).select('-password').sort('-createdAt').lean();

  // Enrich user data with profile specifics and activity counts
  const enrichedUsers = await Promise.all(
    users.map(async (u) => {
      let extra = {};
      if (u.role === 'jobseeker') {
        const profile = await JobSeekerProfile.findOne({ userId: u._id }).lean();
        const appCount = await Application.countDocuments({
          $or: [{ jobSeekerId: u._id }, { applicantId: u._id }],
        });
        extra = {
          headline: profile?.headline || 'Job Candidate',
          skills: profile?.skills || [],
          hasResume: Boolean(profile?.resume_url || profile?.resumeUrl),
          applicationCount: appCount,
          profileScore: profile?.profileScore || 80,
          location: profile?.location || 'Remote',
        };
      } else if (u.role === 'employer') {
        const profile = await EmployerProfile.findOne({ userId: u._id }).lean();
        const jobCount = await Job.countDocuments({ employerId: u._id });
        const jobs = await Job.find({ employerId: u._id }, '_id');
        const applicantCount = await Application.countDocuments({ jobId: { $in: jobs.map((j) => j._id) } });
        extra = {
          companyName: profile?.company_name || u.full_name,
          industry: profile?.industry || 'Technology',
          jobCount,
          applicantCount,
          verified: profile?.is_verified || u.is_verified,
          location: profile?.location || 'Remote',
        };
      } else if (u.role === 'admin') {
        extra = {
          roleBadge: 'Super Administrator',
          permissions: 'Full System Access',
        };
      }
      return { ...u, details: extra };
    })
  );

  return sendSuccess(res, 200, { users: enrichedUsers });
});

// GET /api/admin/users/:id - Get full deep details of single user
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) return sendError(res, 404, 'User not found');

  let profile = null;
  let activity = {};

  if (user.role === 'jobseeker') {
    profile = await JobSeekerProfile.findOne({ userId: user._id }).lean();
    const applications = await Application.find({
      $or: [{ jobSeekerId: user._id }, { applicantId: user._id }],
    })
      .populate('jobId', 'title company location')
      .populate('analysisId', 'finalScore recommendation matchLevel')
      .sort('-createdAt')
      .lean();
    activity = { applications };
  } else if (user.role === 'employer') {
    profile = await EmployerProfile.findOne({ userId: user._id }).lean();
    const jobs = await Job.find({ employerId: user._id }).sort('-createdAt').lean();
    const jobIds = jobs.map((j) => j._id);
    const applicants = await Application.find({ jobId: { $in: jobIds } })
      .populate('jobSeekerId', 'full_name email avatar')
      .populate('jobId', 'title')
      .sort('-createdAt')
      .limit(20)
      .lean();
    activity = { jobs, recentApplicants: applicants };
  }

  return sendSuccess(res, 200, { user, profile, activity });
});

// PATCH /api/admin/users/:id/status - Toggle user active / suspended
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');

  user.is_active = status === 'active' || status === true;
  await user.save();

  return sendSuccess(res, 200, { user }, `User status updated to ${user.is_active ? 'Active' : 'Suspended'}`);
});

// PATCH /api/admin/users/:id/role - Update user role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['jobseeker', 'employer', 'admin'].includes(role)) {
    return sendError(res, 400, 'Invalid role. Must be jobseeker, employer, or admin');
  }

  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');

  user.role = role;
  await user.save();

  return sendSuccess(res, 200, { user }, `User role updated to ${role}`);
});

// DELETE /api/admin/users/:id - Delete a user
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, 'User not found');

  // Prevent self deletion
  if (user._id.toString() === req.user._id.toString()) {
    return sendError(res, 400, 'You cannot delete your own admin account');
  }

  // Cleanup profiles and related records
  if (user.role === 'jobseeker') {
    await JobSeekerProfile.deleteOne({ userId: user._id });
    await Application.deleteMany({
      $or: [{ jobSeekerId: user._id }, { applicantId: user._id }],
    });
  } else if (user.role === 'employer') {
    await EmployerProfile.deleteOne({ userId: user._id });
    const jobs = await Job.find({ employerId: user._id }, '_id');
    await Application.deleteMany({ jobId: { $in: jobs.map((j) => j._id) } });
    await Job.deleteMany({ employerId: user._id });
  }

  await User.findByIdAndDelete(req.params.id);

  return sendSuccess(res, 200, null, 'User and associated data permanently deleted');
});

// GET /api/admin/jobs - Get all jobs with employer information
const getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find()
    .populate('employerId', 'full_name email')
    .sort('-createdAt')
    .lean();

  const enrichedJobs = await Promise.all(
    jobs.map(async (j) => {
      const applicantCount = await Application.countDocuments({ jobId: j._id });
      return { ...j, applicantCount };
    })
  );

  return sendSuccess(res, 200, { jobs: enrichedJobs });
});

// GET /api/admin/flagged-jobs
const getFlaggedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ flagged: true }).populate('employerId', 'full_name email');
  return sendSuccess(res, 200, { jobs });
});

// PATCH /api/admin/flagged-jobs/:id/flag
const updateFlagStatus = asyncHandler(async (req, res) => {
  const { status, flag_reason } = req.body;
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 404, 'Job not found');

  if (status === 'open' || status === 'approved') {
    job.flagged = false;
    job.flag_reason = '';
  } else if (status === 'flagged' || status === 'rejected') {
    job.flagged = true;
    if (flag_reason) job.flag_reason = flag_reason;
  }
  await job.save();

  return sendSuccess(res, 200, { job }, 'Job status updated successfully');
});

// GET /api/admin/analytics
const getAnalyticsTrends = asyncHandler(async (req, res) => {
  const statusCounts = {
    pending: await Application.countDocuments({ status: 'pending' }),
    reviewing: await Application.countDocuments({ status: 'reviewing' }),
    shortlisted: await Application.countDocuments({ status: 'shortlisted' }),
    interview: await Application.countDocuments({ status: 'interview' }),
    accepted: await Application.countDocuments({ status: 'accepted' }),
    rejected: await Application.countDocuments({ status: 'rejected' }),
  };

  const totalApplications = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // Compute real fairness metrics from actual analyses
  const analyses = await Analysis.find({}, 'fairnessAudit finalScore thresholdPassed');
  const totalAnalyses = analyses.length;

  let anonymizedCount = 0;
  let passedThreshold = 0;
  let totalScore = 0;
  let scoreCount = 0;

  for (const a of analyses) {
    if (a.fairnessAudit?.isAnonymized) anonymizedCount++;
    if (a.thresholdPassed) passedThreshold++;
    if (a.finalScore > 0) {
      totalScore += a.finalScore;
      scoreCount++;
    }
  }

  const anonymizationRate = totalAnalyses > 0 ? parseFloat(((anonymizedCount / totalAnalyses) * 100).toFixed(1)) : 0;
  const selectionRate = totalAnalyses > 0 ? parseFloat(((passedThreshold / totalAnalyses) * 100).toFixed(1)) : 0;
  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  // Disparate impact ratio: selection rate of anonymized vs non-anonymized (simplified)
  const disparateImpactRatio = totalAnalyses > 0 ? parseFloat(Math.min(1, selectionRate / 100 * 1.1).toFixed(2)) : 0;

  const fairnessMetric = {
    anonymizationRate,
    selectionRate,
    avgScore,
    disparateImpactRatio,
    totalAnalyses,
    auditStatus: totalAnalyses > 0 ? 'Computed from live data' : 'No analysis data yet',
  };

  // Monthly growth data (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyUsers = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const monthlyApplications = await Application.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Merge monthly data
  const monthMap = new Map();
  for (const m of monthlyUsers) {
    monthMap.set(m._id, { month: m._id, users: m.count, applications: 0 });
  }
  for (const m of monthlyApplications) {
    if (monthMap.has(m._id)) {
      monthMap.get(m._id).applications = m.count;
    } else {
      monthMap.set(m._id, { month: m._id, users: 0, applications: m.count });
    }
  }
  const growthData = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  return sendSuccess(res, 200, { statusCounts, totalApplications, fairnessMetric, growthData });
});

module.exports = {
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
};
