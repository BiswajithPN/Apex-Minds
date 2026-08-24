const EmployerProfile = require('../models/EmployerProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const User = require('../models/User');
const { rankApplicants } = require('../services/rankingService');
const { sendAccountConfirmationEmail } = require('../services/emailService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/employer/company
const getCompanyProfile = asyncHandler(async (req, res) => {
  let company = await EmployerProfile.findOne({ userId: req.user._id });
  if (!company) {
    company = await EmployerProfile.create({ userId: req.user._id, company_name: req.user.full_name });
  }
  const companyObj = {
    ...company.toObject(),
    companyName: company.company_name,
  };
  return sendSuccess(res, 200, { company: companyObj, profile: companyObj });
});

// PUT /api/employer/company
const updateCompanyProfile = asyncHandler(async (req, res) => {
  const payload = req.body.company || req.body;
  const { companyName, company_name, industry, website, description, location, email } = payload;
  const nameToUse = (companyName || company_name || '').trim();

  // Validate required fields are not empty
  const errors = [];
  if (!nameToUse) errors.push('Company name is required');
  if (industry !== undefined && !String(industry).trim()) errors.push('Industry cannot be empty');
  if (website !== undefined && !String(website).trim()) errors.push('Website cannot be empty');
  if (description !== undefined && !String(description).trim()) errors.push('Description cannot be empty');
  if (location !== undefined && !String(location).trim()) errors.push('Location cannot be empty');
  if (errors.length > 0) {
    return sendError(res, 400, errors.join('. ') + '.');
  }

  let user = await User.findById(req.user._id);
  let emailChanged = false;

  if (nameToUse || email) {
    if (nameToUse) user.full_name = nameToUse;
    if (email && email.toLowerCase() !== user.email) {
      user.email = email.toLowerCase();
      emailChanged = true;
    }
    await user.save();
    if (emailChanged) {
      sendAccountConfirmationEmail(user.email, user.full_name);
    }
  }

  const company = await EmployerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      company_name: nameToUse || user.full_name,
      industry,
      website,
      description,
      location,
    },
    { new: true, upsert: true }
  );

  const companyObj = {
    ...company.toObject(),
    companyName: company.company_name,
  };

  return sendSuccess(
    res,
    200,
    {
      company: companyObj,
      profile: companyObj,
      user: { _id: user._id, name: user.full_name, email: user.email },
    },
    'Company profile updated successfully'
  );
});

// GET /api/employer/jobs
const getEmployerJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employerId: req.user._id }).sort('-createdAt');

  const jobsWithCount = await Promise.all(
    jobs.map(async (job) => {
      const count = await Application.countDocuments({ jobId: job._id });
      return {
        ...job.toObject(),
        applicantCount: count,
      };
    })
  );

  return sendSuccess(res, 200, { jobs: jobsWithCount });
});

// POST /api/employer/jobs
const createJob = asyncHandler(async (req, res) => {
  const { title, description, requirements, location, type, salary, skills } = req.body;

  if (!title || !title.trim()) {
    return sendError(res, 400, 'Job title is required');
  }
  if (!description || !description.trim()) {
    return sendError(res, 400, 'Job description is required');
  }

  // Validate employer profile is complete before posting
  const companyProfile = await EmployerProfile.findOne({ userId: req.user._id });
  if (!companyProfile || !companyProfile.company_name || !companyProfile.company_name.trim()) {
    return sendError(res, 400, 'Please complete your company profile (company name is required) before posting a job.');
  }

  const job = await Job.create({
    employerId: req.user._id,
    title,
    description,
    requirements,
    location,
    job_type: type,
    salary,
    skills_required: Array.isArray(skills) ? skills : (skills || '').split(',').map((s) => s.trim()).filter(Boolean),
  });

  return sendSuccess(res, 201, { job }, 'Job posted successfully');
});

// PUT /api/employer/jobs/:id
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, employerId: req.user._id });
  if (!job) return sendError(res, 404, 'Job not found');

  const updates = { ...req.body };
  if (updates.type !== undefined) {
    updates.job_type = updates.type;
    delete updates.type;
  }
  if (updates.skills !== undefined) {
    updates.skills_required = Array.isArray(updates.skills)
      ? updates.skills
      : (updates.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
    delete updates.skills;
  }

  Object.assign(job, updates);
  await job.save();

  return sendSuccess(res, 200, { job }, 'Job updated successfully');
});

// DELETE /api/employer/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, employerId: req.user._id });
  if (!job) return sendError(res, 404, 'Job not found');

  // Cascade delete applications
  await Application.deleteMany({ jobId: req.params.id });

  return sendSuccess(res, 200, {}, 'Job and associated applications deleted');
});

// GET /api/employer/jobs/:id/applicants
const getApplicantsForJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, employerId: req.user._id });
  if (!job) return sendError(res, 404, 'Job not found');

  const applications = await Application.find({ jobId: job._id })
    .populate('jobSeekerId', 'full_name email avatar')
    .sort('-match_score');

  const formatted = await Promise.all(
    applications.map(async (app) => {
      let resumeUrl = app.resume_url;
      if (!resumeUrl && app.jobSeekerId?._id) {
        const prof = await JobSeekerProfile.findOne({ userId: app.jobSeekerId._id }).select('resume_url');
        resumeUrl = prof?.resume_url || '';
      }
      return {
        _id: app._id,
        applicant: {
          _id: app.jobSeekerId?._id,
          name: app.jobSeekerId?.full_name,
          email: app.jobSeekerId?.email,
          avatar: app.jobSeekerId?.avatar,
          resumeUrl,
        },
        resumeUrl,
        status: app.status,
        matchScore: app.match_score,
        matchedSkills: app.matched_skills,
        createdAt: app.createdAt,
      };
    })
  );

  const ranked = await rankApplicants(formatted, job);

  return sendSuccess(res, 200, { applications: ranked });
});

// PATCH /api/employer/applications/:id/status
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason, constructiveAdvice } = req.body;
  const application = await Application.findById(req.params.id)
    .populate('jobId', 'title')
    .populate('analysisId');

  if (!application) return sendError(res, 404, 'Application not found');

  const Notification = require('../models/Notification');
  const Analysis = require('../models/Analysis');

  application.status = status;

  if (status === 'rejected') {
    const reasons = rejectionReason ? [rejectionReason] : (application.rejectionExplanation?.reasons?.length ? application.rejectionExplanation.reasons : ['Did not meet the role criteria and candidate threshold.']);
    const advice = constructiveAdvice || application.rejectionExplanation?.constructiveAdvice || 'Consider expanding technical projects and gaining hands-on production experience.';

    application.rejectionExplanation = {
      headline: `Your application was not shortlisted for ${application.jobId?.title || 'this position'}.`,
      matchScore: application.match_score || 50,
      threshold: 70,
      difference: (application.match_score || 50) - 70,
      reasons,
      strengths: application.matched_skills || [],
      improvementAreas: application.missing_skills || [],
      constructiveAdvice: advice
    };

    if (application.analysisId) {
      await Analysis.updateOne(
        { _id: application.analysisId },
        {
          status: 'Not Shortlisted',
          rejectionExplanation: application.rejectionExplanation
        }
      );
    }

    // Create Notification for candidate
    await Notification.create({
      userId: application.jobSeekerId,
      type: 'rejection_explanation',
      title: `Application Update: ${application.jobId?.title || 'Position'}`,
      message: `Your application for ${application.jobId?.title || 'the position'} has been evaluated. Review your personalized feedback and growth areas.`,
      data: {
        applicationId: application._id,
        jobId: application.jobId?._id,
        analysisId: application.analysisId?._id,
        matchScore: application.match_score,
        threshold: 70,
        status: 'rejected',
        reasons,
        strengths: application.matched_skills || [],
        improvementAreas: application.missing_skills || []
      }
    });
  } else if (status === 'shortlisted') {
    if (application.analysisId) {
      await Analysis.updateOne({ _id: application.analysisId }, { status: 'Shortlisted' });
    }

    await Notification.create({
      userId: application.jobSeekerId,
      type: 'application_status',
      title: `🎉 Congratulations! You are shortlisted for ${application.jobId?.title || 'Position'}`,
      message: `The employer has shortlisted your profile for ${application.jobId?.title || 'this role'}. Be ready for upcoming interviews!`,
      data: {
        applicationId: application._id,
        jobId: application.jobId?._id,
        status: 'shortlisted'
      }
    });
  }

  await application.save();

  return sendSuccess(res, 200, { application }, 'Status updated successfully');
});

// PUT /api/employer/applications/:id/interview
const scheduleInterview = asyncHandler(async (req, res) => {
  const { date, time, type, location, notes } = req.body;
  const application = await Application.findById(req.params.id).populate('jobId', 'title');
  if (!application) return sendError(res, 404, 'Application not found');

  const Notification = require('../models/Notification');

  application.status = 'interview';
  application.interview_date = date;
  application.interview_time = time;
  application.interview_type = type;
  application.interview_location = location;
  application.interview_notes = notes;
  await application.save();

  await Notification.create({
    userId: application.jobSeekerId,
    type: 'application_status',
    title: `📅 Interview Scheduled: ${application.jobId?.title || 'Position'}`,
    message: `An interview has been scheduled on ${new Date(date).toLocaleDateString()} at ${time} via ${type}. Check details in My Applications.`,
    data: {
      applicationId: application._id,
      jobId: application.jobId?._id,
      status: 'interview'
    }
  });

  return sendSuccess(res, 200, { application }, 'Interview scheduled successfully');
});

// GET /api/employer/candidates/:id
const getCandidateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return sendError(res, 404, 'Candidate not found');

  const profile = await JobSeekerProfile.findOne({ userId: user._id }).select('+resume_text');

  return sendSuccess(res, 200, {
    user: {
      _id: user._id,
      name: user.full_name,
      email: user.email,
      avatar: user.avatar,
      resumeUrl: profile?.resume_url,
      resumeText: profile?.resume_text,
      profile: profile || {},
    },
  });
});

// GET /api/employer/dashboard/stats
const getEmployerStats = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employerId: req.user._id });
  const jobIds = jobs.map((j) => j._id);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'open').length;
  const totalApplicants = await Application.countDocuments({ jobId: { $in: jobIds } });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newApplicants = await Application.countDocuments({
    jobId: { $in: jobIds },
    createdAt: { $gte: sevenDaysAgo },
  });

  return sendSuccess(res, 200, {
    totalJobs,
    activeJobs,
    totalApplicants,
    newApplicants,
  });
});

module.exports = {
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
};
