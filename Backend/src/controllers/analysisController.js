/**
 * analysisController.js — Controller for Multi-Criteria AI Recruitment Analysis & Ranking
 */

const asyncHandler = require('../utils/asyncHandler');
const Analysis = require('../models/Analysis');
const Application = require('../models/Application');
const Job = require('../models/Job');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { performMultiCriteriaAnalysis } = require('../services/multiCriteriaScoringService');
const { calculateAggregateFairnessMetrics } = require('../services/fairnessAuditService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * POST /api/analysis/analyze/:applicationId
 * Run or update multi-criteria AI analysis for a specific application
 */
const analyzeApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { forceReanalyze = false } = req.body;

  const application = await Application.findById(applicationId)
    .populate('jobId')
    .populate('jobSeekerId', 'full_name email');

  if (!application) {
    return sendError(res, 404, 'Application not found');
  }

  const job = application.jobId;
  const candidateUser = application.jobSeekerId;

  // Authorization: Candidate can trigger for themselves; Employer can trigger for their job
  const isCandidate = req.user._id.toString() === candidateUser._id.toString();
  const isEmployer = req.user._id.toString() === job.employerId.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCandidate && !isEmployer && !isAdmin) {
    return sendError(res, 403, 'Unauthorized to analyze this application');
  }

  // Check for cached analysis unless forceReanalyze is set
  if (!forceReanalyze) {
    const existingAnalysis = await Analysis.findOne({ applicationId });
    if (existingAnalysis) {
      return sendSuccess(res, 200, { analysis: existingAnalysis, cached: true });
    }
  }

  // Get candidate resume text
  const profile = await JobSeekerProfile.findOne({ userId: candidateUser._id }).select('+resume_text');
  const resumeText = profile?.resume_text || application.cover_letter || `${candidateUser.full_name} Developer with technical skills and software engineering experience.`;

  // Perform multi-criteria analysis
  const analysisResult = await performMultiCriteriaAnalysis({
    job,
    resumeText,
    candidateUser,
    applicationId: application._id,
    customRubricWeights: job.rubricWeights,
    customThreshold: job.threshold
  });

  // Persist or update Analysis document in MongoDB
  const savedAnalysis = await Analysis.findOneAndUpdate(
    { jobId: job._id, candidateId: candidateUser._id },
    { ...analysisResult, applicationId: application._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Update Application model fields
  application.analysisId = savedAnalysis._id;
  application.match_score = savedAnalysis.finalScore;
  application.confidence_level = savedAnalysis.confidenceLevel;
  application.matched_skills = savedAnalysis.matchedSkills;
  application.missing_skills = savedAnalysis.missingSkills;
  application.rejectionExplanation = savedAnalysis.rejectionExplanation;

  // Update application status based on threshold if currently pending
  if (application.status === 'pending' || application.status === 'reviewing') {
    application.status = savedAnalysis.thresholdPassed ? 'shortlisted' : 'rejected';
  }

  await application.save();

  // Create In-App Notification for Candidate
  const notificationTitle = savedAnalysis.thresholdPassed
    ? `Great news! You have been shortlisted for ${job.title}`
    : `Application Update: ${job.title}`;

  const notificationMsg = savedAnalysis.thresholdPassed
    ? `Your profile strongly matched the requirements for ${job.title} with a ${savedAnalysis.finalScore}% match score.`
    : `Your application for ${job.title} has been evaluated. Review your personalized feedback and growth areas.`;

  await Notification.create({
    userId: candidateUser._id,
    type: savedAnalysis.thresholdPassed ? 'application_status' : 'rejection_explanation',
    title: notificationTitle,
    message: notificationMsg,
    data: {
      applicationId: application._id,
      jobId: job._id,
      analysisId: savedAnalysis._id,
      matchScore: savedAnalysis.finalScore,
      threshold: savedAnalysis.threshold,
      status: application.status,
      reasons: savedAnalysis.rejectionExplanation.reasons,
      strengths: savedAnalysis.rejectionExplanation.strengths,
      improvementAreas: savedAnalysis.rejectionExplanation.improvementAreas
    }
  });

  return sendSuccess(res, 200, { analysis: savedAnalysis, cached: false }, 'Analysis completed successfully');
});

/**
 * GET /api/analysis/:applicationId
 * Get complete AI analysis document for an application
 */
const getApplicationAnalysis = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const mongoose = require('mongoose');

  if (!mongoose.isValidObjectId(applicationId)) {
    return sendError(res, 400, 'Invalid application ID');
  }

  let analysis = await Analysis.findOne({ applicationId })
    .populate('candidateId', 'full_name email')
    .populate('jobId', 'title threshold rubricWeights');

  if (!analysis) {
    // If not analyzed yet, run analysis on-the-fly
    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('jobSeekerId', 'full_name email');

    if (!application) {
      return sendError(res, 404, 'Application not found');
    }

    const job = application.jobId;
    const candidateUser = application.jobSeekerId;
    const profile = await JobSeekerProfile.findOne({ userId: candidateUser._id }).select('+resume_text');
    
    const candidateText = [
      profile?.resume_text,
      `Candidate: ${candidateUser.full_name}`,
      profile?.skills?.length ? `Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}` : '',
      profile?.experience ? `Experience: ${profile.experience}` : '',
      profile?.education ? `Education: ${profile.education}` : '',
      profile?.certifications?.map((c) => c.title || c.name).join(', ')
    ].filter(Boolean).join('\n\n');

    const resumeText = candidateText || `${candidateUser.full_name} Technical Resume`;

    const analysisResult = await performMultiCriteriaAnalysis({
      job,
      resumeText,
      candidateUser,
      applicationId: application._id
    });

    analysis = await Analysis.create({ ...analysisResult, applicationId: application._id });
    application.analysisId = analysis._id;
    application.match_score = analysis.finalScore;
    application.confidence_level = analysis.confidenceLevel;
    application.rejectionExplanation = analysis.rejectionExplanation;
    await application.save();
  }

  // Authorization check
  const candidateIdStr = (analysis.candidateId?._id || analysis.candidateId).toString();
  const isCandidate = req.user._id.toString() === candidateIdStr;
  const isRecruiter = req.user.role === 'employer' || req.user.role === 'admin';

  if (!isCandidate && !isRecruiter) {
    return sendError(res, 403, 'Unauthorized access to analysis');
  }

  return sendSuccess(res, 200, { analysis });
});

/**
 * GET /api/jobs/:jobId/rankings
 * Get ranked candidate leaderboard for a job
 */
const getJobCandidateRankings = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    return sendError(res, 404, 'Job posting not found');
  }

  // Find all applications for this job
  const applications = await Application.find({ jobId })
    .populate('jobSeekerId', 'full_name email')
    .populate('analysisId');

  const rankedCandidates = [];

  for (const app of applications) {
    let analysis = app.analysisId;

    // If application has not been analyzed yet, analyze it
    if (!analysis) {
      const profile = await JobSeekerProfile.findOne({ userId: app.jobSeekerId._id }).select('+resume_text');
      const resumeText = profile?.resume_text || `${app.jobSeekerId.full_name} Technical Profile`;

      const analysisResult = await performMultiCriteriaAnalysis({
        job,
        resumeText,
        candidateUser: app.jobSeekerId,
        applicationId: app._id
      });

      analysis = await Analysis.findOneAndUpdate(
        { jobId: job._id, candidateId: app.jobSeekerId._id },
        { ...analysisResult, applicationId: app._id },
        { upsert: true, new: true }
      );

      app.analysisId = analysis._id;
      app.match_score = analysis.finalScore;
      app.confidence_level = analysis.confidenceLevel;
      app.rejectionExplanation = analysis.rejectionExplanation;
      await app.save();
    }

    const scoreDiff = analysis.finalScore - (job.threshold || 70);

    rankedCandidates.push({
      applicationId: app._id,
      candidateId: app.jobSeekerId._id,
      name: app.jobSeekerId.full_name,
      email: app.jobSeekerId.email,
      matchScore: analysis.finalScore,
      confidenceScore: analysis.confidenceScore,
      confidenceLevel: analysis.confidenceLevel,
      status: app.status,
      thresholdPassed: analysis.finalScore >= (job.threshold || 70),
      scoreDifference: scoreDiff,
      skillScore: analysis.skillScore,
      experienceScore: analysis.experienceScore,
      semanticScore: analysis.semanticScore,
      projectScore: analysis.projectScore,
      educationScore: analysis.educationScore,
      matchedSkills: analysis.matchedSkills,
      partiallyMatchedSkills: analysis.partiallyMatchedSkills,
      missingSkills: analysis.missingSkills,
      strengths: analysis.strengths,
      appliedAt: app.createdAt,
      analysisId: analysis._id
    });
  }

  // Rank by finalScore (descending), with confidenceScore as tie-breaker
  rankedCandidates.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.confidenceScore - a.confidenceScore;
  });

  // Assign explicit rank numbers
  const rankedWithIndex = rankedCandidates.map((c, idx) => ({
    rank: idx + 1,
    ...c
  }));

  return sendSuccess(res, 200, {
    job: {
      _id: job._id,
      title: job.title,
      threshold: job.threshold || 70,
      rubricWeights: job.rubricWeights,
      applicantCount: rankedWithIndex.length
    },
    rankings: rankedWithIndex
  });
});

/**
 * GET /api/jobs/:jobId/fairness
 * Get aggregate fairness metrics and audit statistics for a job
 */
const getJobFairnessAudit = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    return sendError(res, 404, 'Job posting not found');
  }

  const analyses = await Analysis.find({ jobId });
  const fairnessReport = calculateAggregateFairnessMetrics(analyses, job.threshold || 70);

  return sendSuccess(res, 200, {
    jobId: job._id,
    jobTitle: job.title,
    threshold: job.threshold || 70,
    fairnessAudit: fairnessReport
  });
});

/**
 * GET /api/applications/:applicationId/explanation
 * Candidate-facing constructive rejection & feedback explanation
 */
const getApplicationExplanation = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const application = await Application.findById(applicationId)
    .populate('jobId', 'title employerId')
    .populate('analysisId');

  if (!application) {
    return sendError(res, 404, 'Application not found');
  }

  // Authorization check
  const isCandidate = req.user._id.toString() === application.jobSeekerId.toString();
  const isEmployer = req.user._id.toString() === application.jobId?.employerId?.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCandidate && !isEmployer && !isAdmin) {
    return sendError(res, 403, 'Unauthorized access to application explanation');
  }

  const explanation = application.rejectionExplanation || application.analysisId?.rejectionExplanation || {
    headline: `Feedback for ${application.jobId?.title || 'Job'}`,
    matchScore: application.match_score || 50,
    threshold: 70,
    difference: (application.match_score || 50) - 70,
    reasons: ['Detailed feedback is being processed.'],
    strengths: application.matched_skills || [],
    improvementAreas: application.missing_skills || [],
    constructiveAdvice: 'Keep your profile updated with recent projects and skills.'
  };

  return sendSuccess(res, 200, {
    jobTitle: application.jobId?.title,
    applicationStatus: application.status,
    explanation
  });
});

/**
 * PATCH /api/jobs/:jobId/rubric
 * Update threshold and rubric weights for a job & optionally re-screen applicants
 */
const updateJobRubric = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { threshold, rubricWeights, reanalyzeAll = true } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    return sendError(res, 404, 'Job not found');
  }

  if (req.user._id.toString() !== job.employerId.toString() && req.user.role !== 'admin') {
    return sendError(res, 403, 'Unauthorized to modify this job rubric');
  }

  if (threshold !== undefined) {
    job.threshold = Math.min(100, Math.max(0, Number(threshold)));
  }

  if (rubricWeights) {
    job.rubricWeights = {
      skillWeight: rubricWeights.skillWeight ?? job.rubricWeights.skillWeight,
      experienceWeight: rubricWeights.experienceWeight ?? job.rubricWeights.experienceWeight,
      semanticWeight: rubricWeights.semanticWeight ?? job.rubricWeights.semanticWeight,
      projectWeight: rubricWeights.projectWeight ?? job.rubricWeights.projectWeight,
      educationWeight: rubricWeights.educationWeight ?? job.rubricWeights.educationWeight
    };
  }

  await job.save();

  // Optionally re-score existing analyses with the new weights/threshold
  if (reanalyzeAll) {
    const analyses = await Analysis.find({ jobId });
    for (const an of analyses) {
      const weightedSum =
        (an.skillScore * job.rubricWeights.skillWeight) +
        (an.experienceScore * job.rubricWeights.experienceWeight) +
        (an.semanticScore * job.rubricWeights.semanticWeight) +
        (an.projectScore * job.rubricWeights.projectWeight) +
        (an.educationScore * job.rubricWeights.educationWeight);

      an.finalScore = Math.min(100, Math.max(10, Math.round(weightedSum)));
      an.rubricWeights = job.rubricWeights;
      an.threshold = job.threshold;
      an.thresholdPassed = an.finalScore >= job.threshold;
      an.scoreDifference = an.finalScore - job.threshold;
      an.status = an.thresholdPassed ? 'Shortlisted' : 'Not Shortlisted';
      await an.save();

      // Sync with application
      await Application.updateOne(
        { _id: an.applicationId },
        {
          match_score: an.finalScore,
          status: an.thresholdPassed ? 'shortlisted' : 'rejected'
        }
      );
    }
  }

  return sendSuccess(res, 200, { job }, 'Job rubric and candidate rankings updated successfully');
});

/**
 * GET /api/notifications
 * Get notifications for current user
 */
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort('-createdAt')
    .limit(30);

  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

  return sendSuccess(res, 200, { notifications, unreadCount });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true },
    { new: true }
  );

  return sendSuccess(res, 200, { notification });
});

module.exports = {
  analyzeApplication,
  getApplicationAnalysis,
  getJobCandidateRankings,
  getJobFairnessAudit,
  getApplicationExplanation,
  updateJobRubric,
  getNotifications,
  markNotificationRead
};
