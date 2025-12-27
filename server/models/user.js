const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  role: { type: String, enum: ['student'], default: 'student' },

  dob: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  mobileNo: { type: String, trim: true },
  address: { type: String, trim: true },
  parentAddress: { type: String, trim: true },

  // Academic Info
  institution: { type: String, required: true, trim: true },
  classOrYear: { type: String, trim: true },
  marksPercentage: { type: Number, min: 0, max: 100 },
  familyIncome: { type: Number, default: 0 },
  hasIncomeCertificate: { type: Boolean, default: false },
  alternateProof: { type: String, trim: true },

  // Scholarship Flow
  eligibilityScore: { type: Number, default: 0 },
  verifiedByInstitution: { type: Boolean, default: false },
  approvedByDonor: { type: Boolean, default: false },
  applicationStatus: {
    type: String,
    enum: ['pending', 'verified', 'approved', 'funded', 'rejected'],
    default: 'pending',
  },
  appliedScholarships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }],

  // OTP & Reset
  otpToken: { type: String, default: null },
  otpExpire: { type: Date, default: null },
  resetPwdToken: { type: String, default: null },
  resetPwdExpire: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.model('UsersLogins', userSchema);
module.exports = User;
