const fs = require('fs');
const path = require('path');
const { redactIdentityFields, screenResumeLocal, generateDecision } = require('../services/screenerService');
const {
  extractTextFromFile,
  preprocessImageFast,
  runOCR,
  cleanOCRText,
  asyncPool,
  getTempDir
} = require('../services/ocrService');
const { auditJobDescription } = require('../services/biasAuditService');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Helper to safely delete file
 */
function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // Ignore cleanup error
  }
}

/**
 * Screen a single uploaded resume (Image or PDF)
 * POST /api/screener/screen-resume
 */
const screenResumeFile = async (req, res, next) => {
  const filesToCleanup = [];

  try {
    const jobDescription = req.body.jobDescription || '';
    if (!jobDescription.trim()) {
      return sendError(res, 400, 'Job description is required.');
    }

    if (!req.file) {
      return sendError(res, 400, 'Resume file (image or PDF) is required.');
    }

    filesToCleanup.push(req.file.path);

    // 1. Extract text from file (Image OCR or PDF Parse)
    console.log(`[Screener] Processing single file: ${req.file.originalname}`);
    const extractedRawText = await extractTextFromFile(req.file.path, req.file.mimetype);

    if (!extractedRawText || extractedRawText.trim().length < 20) {
      return sendError(
        res,
        400,
        'Could not extract sufficient text from the file. Please upload a higher resolution or clearer document.'
      );
    }

    // 2. Identity Redaction (Fair Hiring / Zero Demographic Bias)
    const { redactedText, redactionLog } = redactIdentityFields(extractedRawText);

    // 3. Algorithmic Screening
    const screeningResult = screenResumeLocal(jobDescription, redactedText, redactionLog);

    // 4. Decision & Narrative
    const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

    return sendSuccess(res, 200, {
      data: {
        ...screeningResult,
        filename: req.file.originalname,
        decision,
        reasons,
        comprehensiveReport,
        extractedText: redactedText
      }
    }, 'Resume screened successfully');

  } catch (err) {
    console.error('[screenResumeFile Error]', err);
    return next(err);
  } finally {
    filesToCleanup.forEach(safeUnlink);
  }
};

/**
 * Screen raw pasted resume text
 * POST /api/screener/screen-text
 */
const screenResumeText = async (req, res, next) => {
  try {
    const { jobDescription, resumeText } = req.body;

    if (!jobDescription || !jobDescription.trim()) {
      return sendError(res, 400, 'Job description is required.');
    }
    if (!resumeText || !resumeText.trim()) {
      return sendError(res, 400, 'Resume text is required.');
    }

    // 1. Identity Redaction
    const { redactedText, redactionLog } = redactIdentityFields(resumeText);

    // 2. Algorithmic Screening
    const screeningResult = screenResumeLocal(jobDescription, redactedText, redactionLog);

    // 3. Decision & Narrative
    const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

    return sendSuccess(res, 200, {
      data: {
        ...screeningResult,
        decision,
        reasons,
        comprehensiveReport,
        extractedText: redactedText
      }
    }, 'Resume text screened successfully');

  } catch (err) {
    console.error('[screenResumeText Error]', err);
    return next(err);
  }
};

/**
 * Batch screen multiple resumes (10 to 150 resumes)
 * POST /api/screener/screen-batch
 */
const screenBatchResumes = async (req, res, next) => {
  const filesToCleanup = [];

  try {
    const jobDescription = req.body.jobDescription || '';
    const topK = parseInt(req.body.topK) || 10;

    if (!jobDescription.trim()) {
      return sendError(res, 400, 'Job description is required.');
    }
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'At least one resume file is required.');
    }

    console.log(`[Batch Screener] Starting batch of ${req.files.length} resumes...`);
    const startTime = Date.now();

    // 1. Parallel Fast Preprocessing
    const itemsToProcess = req.files.map((file) => {
      filesToCleanup.push(file.path);
      return {
        path: file.path,
        originalname: file.originalname,
        mimetype: file.mimetype
      };
    });

    // 2. Concurrency-limited processing
    const CONCURRENCY_LIMIT = 4;
    const results = await asyncPool(CONCURRENCY_LIMIT, itemsToProcess, async (item) => {
      let tempPass = null;
      try {
        let rawText = '';
        if (item.mimetype === 'application/pdf' || item.originalname.toLowerCase().endsWith('.pdf')) {
          rawText = await extractTextFromFile(item.path, item.mimetype);
        } else {
          tempPass = await preprocessImageFast(item.path);
          filesToCleanup.push(tempPass);
          const ocrText = await runOCR(tempPass);
          rawText = cleanOCRText(ocrText);
        }

        if (!rawText || rawText.trim().length < 20) {
          return { filename: item.originalname, error: 'Insufficient text extracted' };
        }

        const { redactedText, redactionLog } = redactIdentityFields(rawText);
        const screeningResult = screenResumeLocal(jobDescription, redactedText, redactionLog);
        const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

        return {
          filename: item.originalname,
          matchScore: screeningResult.matchScore,
          decision,
          reasons,
          comprehensiveReport,
          matchedSkills: screeningResult.matchedSkills,
          adjacentSkills: screeningResult.adjacentSkills,
          missingSkills: screeningResult.missingSkills,
          experience: screeningResult.experience,
          education: screeningResult.education,
          biasFlags: screeningResult.biasFlags
        };
      } catch (err) {
        return { filename: item.originalname, error: err.message };
      } finally {
        if (tempPass && tempPass !== item.path) safeUnlink(tempPass);
      }
    });

    // 3. Sort descending by score, slice topK
    const validResults = results.filter((r) => !r.error);
    const errors = results.filter((r) => r.error);

    validResults.sort((a, b) => b.matchScore - a.matchScore);
    const topCandidates = validResults.slice(0, topK);

    const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

    return sendSuccess(res, 200, {
      data: {
        totalProcessed: req.files.length,
        successCount: validResults.length,
        errorCount: errors.length,
        processingTimeSeconds: durationSeconds,
        topCandidates,
        allResults: validResults,
        errors
      }
    }, 'Batch screening complete');

  } catch (err) {
    console.error('[screenBatchResumes Error]', err);
    return next(err);
  } finally {
    filesToCleanup.forEach(safeUnlink);
  }
};

/**
 * Audit Job Description for Inclusivity
 * POST /api/screener/audit-jd
 */
const auditJD = async (req, res, next) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || !jobDescription.trim()) {
      return sendError(res, 400, 'Job description text is required.');
    }

    const auditResult = auditJobDescription(jobDescription);
    return sendSuccess(res, 200, { data: auditResult }, 'Job description audited');
  } catch (err) {
    console.error('[auditJD Error]', err);
    return next(err);
  }
};

/**
 * Screen an existing HireHub Application
 * POST /api/screener/screen-application/:id
 */
const screenApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate('job').populate('applicant');

    if (!application) {
      return sendError(res, 400, 'Application not found');
    }

    const job = application.job;
    if (!job) {
      return sendError(res, 400, 'Associated job not found');
    }

    const jobDescription = `${job.title}\n${job.description}\nRequired Skills: ${(job.skills_required || []).join(', ')}`;

    let candidateText = '';
    if (application.applicant) {
      const p = application.applicant;
      candidateText += `Skills: ${(p.skills || []).join(', ')}\n`;
      candidateText += `Experience: ${p.experience || ''}\n`;
      candidateText += `Education: ${p.education || ''}\n`;
      candidateText += `Bio: ${p.bio || ''}\n`;
    }
    if (application.resume_text) {
      candidateText += `\n${application.resume_text}`;
    }

    const { redactedText, redactionLog } = redactIdentityFields(candidateText);
    const screeningResult = screenResumeLocal(jobDescription, redactedText, redactionLog);
    const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

    application.match_score = screeningResult.matchScore;
    application.ai_evaluation = comprehensiveReport;
    await application.save();

    return sendSuccess(res, 200, {
      data: {
        ...screeningResult,
        decision,
        reasons,
        comprehensiveReport,
        applicationId: application._id
      }
    }, 'Application screened with Bias-Aware AI');

  } catch (err) {
    console.error('[screenApplication Error]', err);
    return next(err);
  }
};

/**
 * Automatically gathers requirements from a specific Job Post
 * and screens/ranks all applied resumes by Job Seekers
 * POST /api/screener/job/:jobId/screen-all
 * GET  /api/screener/job/:jobId/screen-all
 */
const screenJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job) {
      return sendError(res, 404, 'Job post not found');
    }

    // Automatically build the job description and requirements directly from the Job post
    const jobRequirementsText = [
      `Job Title: ${job.title}`,
      `Description: ${job.description}`,
      job.requirements ? `Requirements:\n${job.requirements}` : '',
      job.skills_required && job.skills_required.length ? `Required Skills: ${job.skills_required.join(', ')}` : '',
      job.experience_level ? `Experience Level: ${job.experience_level}` : '',
      job.job_type ? `Job Type: ${job.job_type}` : ''
    ].filter(Boolean).join('\n\n');

    // Audit the job description for inclusivity
    const jdInclusivity = auditJobDescription(jobRequirementsText);

    // Fetch all applications submitted for this specific job
    const applications = await Application.find({ jobId: job._id }).populate('jobSeekerId', 'full_name email avatar');
    const JobSeekerProfile = require('../models/JobSeekerProfile');

    const screenedApplicants = await Promise.all(
      applications.map(async (app) => {
        const user = app.jobSeekerId;
        if (!user) return null;

        // Fetch candidate profile with hidden resume_text
        const profile = await JobSeekerProfile.findOne({ userId: user._id }).select('+resume_text');

        let candidateText = '';
        if (profile?.resume_text && profile.resume_text.trim().length > 30) {
          candidateText = profile.resume_text;
        } else {
          candidateText = [
            `Name: ${user.full_name}`,
            profile?.location ? `Location: ${profile.location}` : '',
            profile?.skills?.length ? `Technical Skills: ${profile.skills.join(', ')}` : '',
            profile?.experience ? `Work Experience: ${profile.experience}` : '',
            profile?.education ? `Education: ${profile.education}` : '',
            profile?.certifications?.length ? `Certifications: ${profile.certifications.map(c => c.title || c.name).join(', ')}` : ''
          ].filter(Boolean).join('\n');
        }

        // Demographically blind PII scrubbing
        const { redactedText, redactionLog } = redactIdentityFields(candidateText);

        // Algorithmic evaluation against the specific job post
        const screeningResult = screenResumeLocal(jobRequirementsText, redactedText, redactionLog);
        const { decision, reasons, comprehensiveReport } = generateDecision(screeningResult);

        // Update application match score & matched skills in MongoDB
        app.match_score = screeningResult.matchScore;
        app.matched_skills = screeningResult.matchedSkills.map((s) => s.skill);
        app.missing_skills = screeningResult.missingSkills.map((s) => s.skill);
        await app.save();

        return {
          applicationId: app._id,
          applicantId: user._id,
          name: user.full_name,
          email: user.email,
          avatar: user.avatar,
          status: app.status,
          appliedAt: app.createdAt,
          matchScore: screeningResult.matchScore,
          decision,
          reasons,
          comprehensiveReport,
          resumeText: candidateText,
          profileSkills: profile?.skills || [],
          profileExperience: profile?.experience || '',
          profileEducation: profile?.education || '',
          profileLocation: profile?.location || '',
          resumeUrl: profile?.resume_url || '',
          matchedSkills: screeningResult.matchedSkills,
          adjacentSkills: screeningResult.adjacentSkills,
          missingSkills: screeningResult.missingSkills,
          experience: screeningResult.experience,
          education: screeningResult.education,
          certifications: screeningResult.certifications,
          biasFlags: screeningResult.biasFlags
        };
      })
    );

    const validApplicants = screenedApplicants.filter(Boolean);
    validApplicants.sort((a, b) => b.matchScore - a.matchScore);

    return sendSuccess(res, 200, {
      data: {
        job: {
          _id: job._id,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills_required: job.skills_required,
          experience_level: job.experience_level,
          location: job.location,
          job_type: job.job_type,
          status: job.status
        },
        jobRequirementsText,
        jdInclusivity,
        totalApplicants: validApplicants.length,
        applicants: validApplicants
      }
    }, `Successfully screened ${validApplicants.length} applicants for "${job.title}"`);

  } catch (err) {
    console.error('[screenJobApplicants Error]', err);
    return next(err);
  }
};

/**
 * Get all employer jobs with applicant counts for easy selection in Screener UI
 * GET /api/screener/jobs-list
 */
const getJobsListForScreener = async (req, res, next) => {
  try {
    const jobs = await Job.find().sort('-createdAt');
    const jobsWithStats = await Promise.all(
      jobs.map(async (j) => {
        const count = await Application.countDocuments({ jobId: j._id });
        return {
          _id: j._id,
          title: j.title,
          description: j.description,
          requirements: j.requirements,
          skills_required: j.skills_required || [],
          experience_level: j.experience_level,
          location: j.location,
          job_type: j.job_type,
          applicantCount: count,
        };
      })
    );

    return sendSuccess(res, 200, { data: jobsWithStats }, 'Jobs list fetched for screener');
  } catch (err) {
    console.error('[getJobsListForScreener Error]', err);
    return next(err);
  }
};

module.exports = {
  screenResumeFile,
  screenResumeText,
  screenBatchResumes,
  auditJD,
  screenApplication,
  screenJobApplicants,
  getJobsListForScreener
};
