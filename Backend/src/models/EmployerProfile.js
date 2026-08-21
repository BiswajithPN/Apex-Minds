const mongoose = require('mongoose');

const employerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    company_name: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    company_size: { type: String, default: '' },
    description: { type: String, default: '' },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);
