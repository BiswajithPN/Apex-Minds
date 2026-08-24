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
    profile = await JobSeekerProfile.create({ userId: req.user._id, full_name: req.user.full_name });
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

  // Validate required fields are not empty
  const errors = [];
  if (!name || !String(name).trim()) errors.push('Full name is required');
  if (!phone || !String(phone).trim()) errors.push('Phone number is required');
  if (!location || !String(location).trim()) errors.push('Location is required');
  const parsedSkills = Array.isArray(skills) ? skills : (skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (parsedSkills.length === 0) errors.push('At least one skill is required');
  if (!experience || !String(experience).trim()) errors.push('Experience is required');
  if (!education || !String(education).trim()) errors.push('Education is required');

  if (errors.length > 0) {
    return sendError(res, 400, errors.join('. ') + '.');
  }

  let user = await User.findById(req.user._id);
  let emailChanged = false;

  if (name || email) {
    if (name) user.full_name = name.trim();
    if (email && email.toLowerCase() !== user.email) {
      user.email = email.toLowerCase();
      emailChanged = true;
    }
    await user.save();
    if (emailChanged) {
      sendAccountConfirmationEmail(user.email, user.full_name);
    }
  }

  const profile = await JobSeekerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      full_name: name.trim() || user.full_name,
      phone: phone.trim(),
      location: location.trim(),
      skills: parsedSkills,
      experience: experience.trim(),
      education: education.trim(),
      certifications: certifications || [],
    },
    { new: true, upsert: true }
  );

  return sendSuccess(res, 200, { profile, user: { _id: user._id, name: user.full_name, email: user.email } }, 'Profile updated successfully');
});

// POST /api/jobseeker/resume/upload or /api/resume/upload
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'Please upload a resume file (PDF, JPEG, or PNG)');
  }

  const path = require('path');
  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `resume_${req.user._id}_${Date.now()}${ext || '.pdf'}`;
  const resumeUrl = await saveFile(req.file.buffer, filename, 'hirehub/resumes');

  let resumeText = '';
  let analysis = {};
  const isImage = req.file.mimetype.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext);

  if (isImage) {
    // Image — stored on Cloudinary, no local OCR
    resumeText = `Uploaded resume image: ${req.file.originalname}`;
    analysis = {
      skills: [],
      experienceYears: 0,
      education: '',
      completeness: 30,
      imageOnly: true,
      note: 'Image resume uploaded. Text extraction requires a PDF for best analysis.',
    };
  } else {
    // PDF — extract text with pdf-parse
    const { parseResume } = require('../services/resumeParserService');
    const { extractCandidateSkills } = require('../services/multiCriteriaScoringService');
    try {
      const result = await parseResume(req.file.buffer);
      resumeText = result.resumeText || '';
      const detectedSkills = extractCandidateSkills(resumeText);
      analysis = {
        skills: detectedSkills.length > 0 ? detectedSkills : (result.analysis?.skills || []),
        experienceYears: 2,
        completeness: resumeText.length > 100 ? 85 : 40,
      };
    } catch (e) {
      console.warn('[Resume Parser Warning]', e.message);
      const { extractTextFromBuffer } = require('../services/ocrService');
      resumeText = await extractTextFromBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
      const detectedSkills = extractCandidateSkills(resumeText);
      analysis = { skills: detectedSkills, experienceYears: 1, completeness: 50 };
    }
  }

  const existing = await JobSeekerProfile.findOne({ userId: req.user._id });
  const mergedSkills = [...new Set([...(existing?.skills || []), ...(analysis.skills || [])])];

  const profile = await JobSeekerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      resume_url: resumeUrl,
      resume_text: resumeText,
      parsed_resume_data: analysis,
      skills: mergedSkills,
    },
    { new: true, upsert: true }
  );

  return sendSuccess(
    res,
    200,
    {
      profile,
      resumeUrl,
      parsedData: analysis,
    },
    'Resume uploaded and parsed successfully'
  );
});

// GET /api/jobseeker/resume/analysis or /api/resume/analysis
const getResumeAnalysis = asyncHandler(async (req, res) => {
  const profile = await JobSeekerProfile.findOne({ userId: req.user._id }).select('+resume_text');
  if (!profile) {
    return sendSuccess(res, 200, { resumeUrl: null, analysis: null });
  }

  return sendSuccess(res, 200, {
    resumeUrl: profile.resume_url,
    resumeText: profile.resume_text,
    analysis: profile.parsed_resume_data || {
      skills: profile.skills || [],
      experienceYears: profile.experience ? 3 : 0,
      completeness: 85,
    },
  });
});

// POST /api/jobseeker/certifications/upload or /api/certifications/upload
const uploadCertification = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'Please select a certificate document or image (PDF, JPEG, PNG)');
  }

  const path = require('path');
  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `cert_${req.user._id}_${Date.now()}${ext || '.pdf'}`;

  // Upload to Cloudinary folder hirehub/certifications
  const certUrl = await saveFile(req.file.buffer, filename, 'hirehub/certifications');

  return sendSuccess(
    res,
    200,
    {
      certUrl,
      cert_url: certUrl,
      filename: req.file.originalname,
    },
    'Certificate uploaded to Cloudinary successfully'
  );
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
  const Analysis = require('../models/Analysis');
  const applications = await Application.find({ jobSeekerId: req.user._id })
    .populate('jobId')
    .populate('analysisId')
    .sort('-createdAt');

  const formatted = await Promise.all(
    applications.map(async (app) => {
      let score = app.match_score;
      let explanation = app.rejectionExplanation;

      if (app.analysisId) {
        score = app.analysisId.finalScore || score;
        explanation = app.analysisId.rejectionExplanation || explanation;
        if (app.match_score !== score) {
          app.match_score = score;
          await app.save();
        }
      } else {
        const analysis = await Analysis.findOne({ applicationId: app._id });
        if (analysis) {
          score = analysis.finalScore;
          explanation = analysis.rejectionExplanation;
          app.analysisId = analysis._id;
          app.match_score = score;
          await app.save();
        }
      }

      return {
        _id: app._id,
        job: app.jobId,
        status: app.status,
        matchScore: score,
        rejectionExplanation: explanation,
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
      };
    })
  );

  return sendSuccess(res, 200, { applications: formatted });
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

// POST /api/applications or /api/jobseeker/applications
const applyForJob = asyncHandler(async (req, res) => {
  const { jobId, coverLetter } = req.body;
  if (!jobId) {
    return sendError(res, 400, 'Job ID is required');
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return sendError(res, 404, 'Job posting not found');
  }

  // Validate profile is complete before applying
  const profileCheck = await JobSeekerProfile.findOne({ userId: req.user._id });
  if (!profileCheck) {
    return sendError(res, 400, 'Please complete your profile before applying to jobs.');
  }
  if (!profileCheck.skills || profileCheck.skills.length === 0) {
    return sendError(res, 400, 'Please add at least one skill to your profile before applying.');
  }

  const existingApp = await Application.findOne({
    jobId,
    jobSeekerId: req.user._id,
  });

  if (existingApp) {
    return sendSuccess(res, 200, { application: existingApp }, 'Already applied for this position');
  }

  const profile = await JobSeekerProfile.findOne({ userId: req.user._id }).select('+resume_text');

  // Build comprehensive candidate text from profile and resume
  const candidateText = [
    profile?.resume_text,
    `Candidate: ${req.user.full_name}`,
    profile?.skills?.length ? `Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}` : '',
    profile?.experience ? `Experience: ${profile.experience}` : '',
    profile?.education ? `Education: ${profile.education}` : '',
    profile?.certifications?.map((c) => c.title || c.name).join(', ')
  ].filter(Boolean).join('\n\n');

  const { performMultiCriteriaAnalysis } = require('../services/multiCriteriaScoringService');
  const Analysis = require('../models/Analysis');
  const Notification = require('../models/Notification');

  const analysisResult = await performMultiCriteriaAnalysis({
    job,
    resumeText: candidateText || `${req.user.full_name} Technical Profile`,
    candidateUser: req.user
  });

  const application = await Application.create({
    jobId,
    jobSeekerId: req.user._id,
    employerId: job.employerId,
    status: 'pending',
    match_score: analysisResult.finalScore,
    confidence_level: analysisResult.confidenceLevel,
    matched_skills: analysisResult.matchedSkills,
    missing_skills: analysisResult.missingSkills,
    rejectionExplanation: analysisResult.rejectionExplanation,
    cover_letter: coverLetter || '',
    resume_url: profile?.resume_url || '',
  });

  const savedAnalysis = await Analysis.findOneAndUpdate(
    { jobId: job._id, candidateId: req.user._id },
    { ...analysisResult, applicationId: application._id },
    { upsert: true, new: true }
  );

  application.analysisId = savedAnalysis._id;
  await application.save();

  // If below threshold, create notification with constructive explanation
  if (!analysisResult.thresholdPassed) {
    await Notification.create({
      userId: req.user._id,
      type: 'rejection_explanation',
      title: `Application Feedback: ${job.title}`,
      message: `Your application for ${job.title} was evaluated (${analysisResult.finalScore}% vs ${analysisResult.threshold}% threshold). Review your personalized feedback and growth areas.`,
      data: {
        applicationId: application._id,
        jobId: job._id,
        analysisId: savedAnalysis._id,
        matchScore: analysisResult.finalScore,
        threshold: analysisResult.threshold,
        status: 'pending',
        reasons: analysisResult.rejectionExplanation.reasons,
        strengths: analysisResult.rejectionExplanation.strengths,
        improvementAreas: analysisResult.rejectionExplanation.improvementAreas
      }
    });
  }

  return sendSuccess(res, 201, { application, analysis: savedAnalysis }, 'Application submitted successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  uploadCertification,
  getResumeAnalysis,
  getJobRecommendations,
  getMyApplications,
  applyForJob,
  withdrawApplication,
};
