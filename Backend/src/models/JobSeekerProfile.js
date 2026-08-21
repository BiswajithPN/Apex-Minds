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
    },
    full_name: { type: String, trim: true },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: 'Phone number must be exactly 10 digits',
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
