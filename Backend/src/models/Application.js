const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    jobSeekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      alias: 'applicantId',
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'interview', 'accepted', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    match_score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    confidence_level: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Insufficient', null],
      default: null,
    },
    matched_skills: {
      type: [String],
      default: [],
    },
    missing_skills: {
      type: [String],
      default: [],
    },
    cover_letter: {
      type: String,
      default: '',
    },
    resume_url: {
      type: String,
      default: '',
    },
    // Constructive explanation stored directly on application for fast candidate viewing
    rejectionExplanation: {
      headline: { type: String, default: '' },
      matchScore: { type: Number, default: 0 },
      threshold: { type: Number, default: 70 },
      difference: { type: Number, default: 0 },
      reasons: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      improvementAreas: { type: [String], default: [] },
      suggestedResources: { type: [String], default: [] },
      alternativeRoles: { type: [String], default: [] },
    },
    // Interview Scheduling Details
    interview_date: { type: Date, default: null },
    interview_time: { type: String, default: null },
    interview_type: { type: String, enum: ['video', 'in-person', 'phone', null], default: null },
    interview_location: { type: String, default: '' },
    interview_notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound Unique Index: Prevent duplicate applications for the same job
applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Application', applicationSchema);
