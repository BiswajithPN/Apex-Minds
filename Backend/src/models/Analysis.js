const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },

    // Component Scores (0–100)
    skillScore: { type: Number, default: 0, min: 0, max: 100 },
    experienceScore: { type: Number, default: 0, min: 0, max: 100 },
    projectScore: { type: Number, default: 0, min: 0, max: 100 },
    educationScore: { type: Number, default: 0, min: 0, max: 100 },
    semanticScore: { type: Number, default: 0, min: 0, max: 100 },

    // Configurable Multi-Criteria Rubric Weights
    rubricWeights: {
      skillWeight: { type: Number, default: 0.40 },
      experienceWeight: { type: Number, default: 0.25 },
      semanticWeight: { type: Number, default: 0.20 },
      projectWeight: { type: Number, default: 0.10 },
      educationWeight: { type: Number, default: 0.05 },
    },

    // Final Normalized Score (0–100)
    finalScore: { type: Number, required: true, min: 0, max: 100 },

    // Confidence Level & Score
    confidenceScore: { type: Number, default: 80, min: 0, max: 100 },
    confidenceLevel: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Insufficient'],
      default: 'High',
    },
    confidenceFactors: {
      resumeCompleteness: { type: Number, default: 80 },
      detectedSkillsCount: { type: Number, default: 0 },
      hasExperienceInfo: { type: Boolean, default: true },
      hasProjectInfo: { type: Boolean, default: true },
      hasEducationInfo: { type: Boolean, default: true },
      componentsConsistency: { type: Number, default: 85 },
    },

    // Skills Categorization Matrix
    matchedSkills: [{ type: String }],
    partiallyMatchedSkills: [
      {
        wanted: String,
        have: String,
        similarity: Number,
        reason: String,
      },
    ],
    missingSkills: [{ type: String }],
    additionalSkills: [{ type: String }],
    skillMatchPercentage: { type: Number, default: 0 },

    // Experience Details
    experienceAnalysis: {
      totalYears: { type: Number, default: 0 },
      requiredYears: { type: Number, default: 0 },
      meetsRequirement: { type: Boolean, default: false },
      detectedRoles: [{ type: String }],
      technologiesUsed: [{ type: String }],
      responsibilitiesSummary: { type: String, default: '' },
    },

    // Projects Relevance
    projectAnalysis: {
      projectScore: { type: Number, default: 0 },
      relevantProjects: [
        {
          title: String,
          technologies: [String],
          relevanceRationale: String,
        },
      ],
      irrelevantProjects: [
        {
          title: String,
          technologies: [String],
        },
      ],
    },

    // Education Matching
    educationAnalysis: {
      degree: { type: String, default: '' },
      field: { type: String, default: '' },
      institution: { type: String, default: '' },
      graduationYear: { type: String, default: '' },
      specialization: { type: String, default: '' },
      meetsRequirement: { type: Boolean, default: false },
      educationMatch: { type: String, default: 'Relevant' },
    },

    // Qualitative Strengths & Growth Areas
    strengths: [{ type: String }],
    improvementAreas: [{ type: String }],
    explanation: { type: String, default: '' },

    // Threshold & Status
    threshold: { type: Number, default: 70 },
    thresholdPassed: { type: Boolean, default: false },
    scoreDifference: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Shortlisted', 'Not Shortlisted', 'Under Review'],
      default: 'Under Review',
    },

    // Constructive Rejection Explanation
    rejectionExplanation: {
      headline: { type: String, default: '' },
      matchScore: { type: Number, default: 0 },
      threshold: { type: Number, default: 70 },
      difference: { type: Number, default: 0 },
      reasons: [{ type: String }],
      strengths: [{ type: String }],
      improvementAreas: [{ type: String }],
      constructiveAdvice: { type: String, default: '' },
    },

    // Fairness Audit Layer
    fairnessAudit: {
      status: { type: String, default: 'Passed' },
      isAnonymized: { type: Boolean, default: true },
      redactedFieldsCount: { type: Number, default: 0 },
      redactionLog: [{ type: String }],
      flags: [{ type: String }],
    },

    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
analysisSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
analysisSchema.index({ jobId: 1, finalScore: -1 });
analysisSchema.index({ applicationId: 1 });

module.exports = mongoose.model('Analysis', analysisSchema);
