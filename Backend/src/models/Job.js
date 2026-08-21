const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Job title must be at least 3 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      minlength: [10, 'Job description must be at least 10 characters'],
    },
    requirements: { type: String, default: '' },
    skills_required: {
      type: [String],
      default: [],
    },
    location: { type: String, trim: true, default: '' },
    job_type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote', null],
      default: null,
    },
    salary: { type: String, default: '' },
    experience_level: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    // Configurable Candidate Screening Threshold (0-100)
    threshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    // Configurable Multi-Criteria Rubric Weights (must sum to 1.0)
    rubricWeights: {
      skillWeight: { type: Number, default: 0.40 },
      experienceWeight: { type: Number, default: 0.25 },
      semanticWeight: { type: Number, default: 0.20 },
      projectWeight: { type: Number, default: 0.10 },
      educationWeight: { type: Number, default: 0.05 },
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flag_reason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Indexes
jobSchema.index({ employerId: 1 });
jobSchema.index({ status: 1, flagged: 1 });
jobSchema.index({ title: 'text', description: 'text', skills_required: 'text' });

// Pre-save hook: Normalize empty strings to null for job_type & experience_level
jobSchema.pre('save', function (next) {
  if (this.job_type === '' || this.job_type === undefined) this.job_type = null;
  if (this.experience_level === '' || this.experience_level === undefined) this.experience_level = null;
  if (typeof this.skills_required === 'string') {
    this.skills_required = this.skills_required.split(',').map((s) => s.trim()).filter(Boolean);
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);
