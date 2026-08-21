const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    jobSeekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'interview', 'accepted', 'withdrawn'],
      default: 'pending',
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
      reasons: [{ type: String }],
      strengths: [{ type: String }],
      improvementAreas: [{ type: String }],
      constructiveAdvice: { type: String, default: '' },
    },
    interview_date: {
      type: Date,
      default: null,
    },
    interview_time: {
      type: String,
      default: '',
    },
    interview_type: {
      type: String,
      enum: ['in-person', 'video', 'phone', ''],
      default: '',
    },
    interview_location: {
      type: String,
      default: '',
    },
    interview_notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes
applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });
applicationSchema.index({ jobSeekerId: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ analysisId: 1 });

module.exports = mongoose.model('Application', applicationSchema);
