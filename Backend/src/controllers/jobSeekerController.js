const JobSeekerProfile = require('../models/JobSeekerProfile');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { parseResume } = require('../services/resumeParserService');
const { getRecommendations } = require('../services/recommendationService');
const { isPdfMagicBytes, saveFile } = require('../middleware/uploadMiddleware');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const { sendAccountConfirmationEmail } = require('../services/emailService');

// GET /api/jobseeker/profile
const getProfile = asyncHandler(async (req, res) => {
  let profile = await JobSeekerProfile.findOne({ userId: req.user._id });
  if (!profile) {
    profile = {
      userId: req.user._id,
      full_name: req.user.full_name,
      skills: [],
      experience: '',
      education: '',
      certifications: [],
    };
  }

  const appCount = await Application.countDocuments({ jobSeekerId: req.user._id });
  const interviewCount = await Application.countDocuments({ jobSeekerId: req.user._id, status: 'interview' });

  // Calculate profile completeness score
  let fields = 0;
  if (profile.full_name) fields++;
  if (profile.phone) fields++;
  if (profile.location) fields++;
  if (profile.skills?.length > 0) fields++;
  if (profile.experience) fields++;
  if (profile.education) fields++;
  if (profile.resume_url) fields++;
  const profileScore = Math.round((fields / 7) * 100);

  return sendSuccess(res, 200, {
    profile,
    applicationCount: appCount,
    interviewCount,
    profileScore,
    aiMatchCount: Math.max(1, Math.round(appCount * 1.5)),
  });
});

// PUT /api/jobseeker/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, location, skills, experience, education, certifications } = req.body;

  let user = await User.findById(req.user._id);
  let emailChanged = false;

  if (name || email) {
    if (name) user.full_name = name;
    if (email && email.toLowerCase() !== user.email) {
      user.email = email.toLowerCase();
      emailChanged = true;
    }
    await user.save();
    if (emailChanged) {
      sendAccountConfirmationEmail(user.email, user.full_name);
    }
  }

  const formattedSkills = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean)
    : typeof skills === 'string'
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const profile = await JobSeekerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      full_name: name || user.full_name,
      phone: phone || '',
      location: location || '',
      skills: formattedSkills,
      experience: experience || '',
      education: education || '',
      certifications: certifications || [],
    },
    { new: true, upsert: true }
  );

  return sendSuccess(res, 200, { profile, user: { _id: user._id, name: user.full_name, email: user.email } }, 'Profile updated successfully');
});

// POST /api/jobseeker/resume/upload
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'Please upload a PDF resume file');
  }

  if (!isPdfMagicBytes(req.file.buffer)) {
    return sendError(res, 400, 'Invalid PDF file header');
  }

  const filename = `resume_${req.user._id}_${Date.now()}.pdf`;
  const resumeUrl = await saveFile(req.file.buffer, filename, 'hirehub/resumes');

  // Trigger Gemini resume parser
  const { resumeText, analysis } = await parseResume(req.file.buffer);

  const profile = await JobSeekerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      resume_url: resumeUrl,
      resume_text: resumeText,
      parsed_resume_data: analysis,
      skills: [...new Set([...(analysis.skills || []), ...(analysis.matchedSkills || [])])],
    },
    { new: true, upsert: true }
  );

  return sendSuccess(res, 200, {
    resumeUrl: profile.resume_url,
    analysis,
  }, 'Resume uploaded and analyzed successfully');
});

// POST /api/jobseeker/certification/upload
const uploadCertificationPdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'Please upload a PDF certification file');
  }

  if (!isPdfMagicBytes(req.file.buffer)) {
    return sendError(res, 400, 'Invalid PDF file header');
  }

  const filename = `cert_${req.user._id}_${Date.now()}.pdf`;
  const certUrl = await saveFile(req.file.buffer, filename, 'hirehub/certifications');

  const title = req.body.title || 'Certification Document';
  const issuer = req.body.issuer || '';
  const year = req.body.year || new Date().getFullYear().toString();

  const profile = await JobSeekerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      $push: {
        certifications: {
          title,
          issuer,
          year,
          cert_url: certUrl,
        },
      },
    },
    { new: true, upsert: true }
  );

  return sendSuccess(res, 200, {
    certUrl,
    profile,
  }, 'Certification uploaded to Cloudinary successfully');
});

// GET /api/jobseeker/recommendations
const getJobRecommendations = asyncHandler(async (req, res) => {
  const profile = await JobSeekerProfile.findOne({ userId: req.user._id });
  const openJobs = await Job.find({ status: 'open', flagged: false }).populate('employerId', 'full_name');

  const recommendations = await getRecommendations(profile, openJobs);

  return sendSuccess(res, 200, {
    recommendations,
    hasProfile: !!profile,
  });
});

// GET /api/jobseeker/applications
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ jobSeekerId: req.user._id })
    .populate('jobId')
    .sort('-createdAt');

  const formatted = applications.map((app) => ({
    _id: app._id,
    job: app.jobId,
    status: app.status,
    matchScore: app.match_score,
    interview: app.interview_date
      ? {
          date: app.interview_date,
          time: app.interview_time,
          type: app.interview_type,
          location: app.interview_location,
          notes: app.interview_notes,
        }
      : null,
    createdAt: app.createdAt,
  }));

  return sendSuccess(res, 200, { applications: formatted });
});

// GET /api/jobseeker/applications/check/:jobId
const checkApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    jobSeekerId: req.user._id,
    jobId: req.params.jobId,
  }).select('_id status createdAt');

  return sendSuccess(res, 200, {
    hasApplied: !!application,
    application: application || null,
  });
});

// DELETE /api/jobseeker/applications/:id
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    jobSeekerId: req.user._id,
  });

  if (!application) {
    return sendError(res, 404, 'Application not found');
  }

  if (['shortlisted', 'interview', 'accepted'].includes(application.status)) {
    return sendError(res, 400, 'Cannot withdraw application in current status');
  }

  application.status = 'withdrawn';
  await application.save();

  return sendSuccess(res, 200, { application }, 'Application withdrawn');
});

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  uploadCertificationPdf,
  getJobRecommendations,
  getMyApplications,
  checkApplicationStatus,
  withdrawApplication,
};
