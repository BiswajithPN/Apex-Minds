const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  issuer: { type: String, trim: true },
  year: { type: String, trim: true },
  credential_id: { type: String, default: '' },
  description: { type: String, default: '' },
  cert_url: { type: String, default: '' },
});

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    full_name: { type: String, trim: true },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Allows standard 10-15 digit numbers, international + prefix, dashes, spaces, parentheses
          return !v || /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(v.trim());
        },
        message: 'Please enter a valid phone number (e.g. +1 555-123-4567 or 9876543210)',
      },
    },
    location: { type: String, trim: true },
    skills: {
      type: [String],
      default: [],
    },
    experience: { type: String, default: '' },
    education: { type: String, default: '' },
    resume_url: { type: String, default: '' },
    resume_text: {
      type: String,
      select: false, // Excluded from default queries, must use .select('+resume_text')
    },
    parsed_resume_data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);
