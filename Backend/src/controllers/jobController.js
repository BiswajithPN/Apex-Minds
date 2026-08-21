const Job = require('../models/Job');
const Application = require('../models/Application');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const { calculateMatchScore } = require('../services/matchScoreService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/jobs (Search + Filter + Pagination)
const getJobs = asyncHandler(async (req, res) => {
  const { search, q, type, location, page = 1, limit = 9 } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 9, 1), 100);

  const query = { status: 'open', flagged: false };

  const keyword = search || q;
  if (keyword) {
    // Regex escape sanitization
    const sanitized = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: sanitized, $options: 'i' } },
      { description: { $regex: sanitized, $options: 'i' } },
      { skills_required: { $regex: sanitized, $options: 'i' } },
    ];
  }

  if (type && type !== 'All') {
    query.job_type = type;
  }

  if (location) {
    const sanitizedLoc = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.location = { $regex: sanitizedLoc, $options: 'i' };
  }

  const skip = (pageNum - 1) * limitNum;
  const totalJobs = await Job.countDocuments(query);
  const totalPages = Math.ceil(totalJobs / limitNum) || 1;

  const jobs = await Job.find(query)
    .populate('employerId', 'full_name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const formattedJobs = await Promise.all(
    jobs.map(async (j) => {
      const company = await EmployerProfile.findOne({ userId: j.employerId?._id });
      return {
        _id: j._id,
        title: j.title,
        description: j.description,
        requirements: j.requirements,
        skills: j.skills_required,
        location: j.location,
        type: j.job_type,
        salary: j.salary,
        company: {
          name: company?.company_name || j.employerId?.full_name || 'Employer',
        },
        createdAt: j.createdAt,
      };
    })
  );

  return sendSuccess(res, 200, {
    jobs: formattedJobs,
    page: parseInt(page, 10),
    totalPages,
    totalJobs,
  });
});

// GET /api/jobs/:id (Details)
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employerId', 'full_name email avatar');
  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  const company = await EmployerProfile.findOne({ userId: job.employerId?._id });

  let applied = false;
  let applicationStatus = null;

  if (req.user) {
    const app = await Application.findOne({ jobId: job._id, jobSeekerId: req.user._id });
    if (app) {
      applied = true;
      applicationStatus = app.status;
    }
  }

  return sendSuccess(res, 200, {
    job: {
      _id: job._id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      skills: job.skills_required,
      location: job.location,
      type: job.job_type,
      salary: job.salary,
      company: {
        name: company?.company_name || job.employerId?.full_name,
      },
      createdAt: job.createdAt,
    },
    applied,
    applicationStatus,
  });
});

// POST /api/jobs/:id/apply (Jobseeker Apply + Match Score)
const applyForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job || job.status !== 'open' || job.flagged) {
    return sendError(res, 400, 'This job is no longer accepting applications');
  }

  const existingApp = await Application.findOne({ jobId: job._id, jobSeekerId: req.user._id });
  if (existingApp) {
    return sendError(res, 409, 'You have already applied for this job'); // 409 Conflict
  }

  const profile = (await JobSeekerProfile.findOne({ userId: req.user._id })) || { skills: [] };

  const { match_score, matched_skills, missing_skills } = await calculateMatchScore(
    { full_name: req.user.full_name, skills: profile.skills || [], experience: profile.experience },
    job
  );

  try {
    const application = await Application.create({
      jobId: job._id,
      jobSeekerId: req.user._id,
      match_score,
      matched_skills,
      missing_skills,
      status: 'pending',
    });

    return sendSuccess(res, 201, { application }, 'Application submitted successfully');
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 409, 'You have already applied for this job');
    }
    throw err;
  }
});

module.exports = {
  getJobs,
  getJobById,
  applyForJob,
};
