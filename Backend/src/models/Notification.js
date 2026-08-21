const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['application_status', 'analysis_completed', 'rejection_explanation', 'job_alert', 'system'],
      default: 'application_status',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      analysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis' },
      matchScore: Number,
      threshold: Number,
      status: String,
      reasons: [String],
      strengths: [String],
      improvementAreas: [String],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
