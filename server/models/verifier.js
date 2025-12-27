// models/verifier.js
const mongoose = require('mongoose');

const verifierSchema = new mongoose.Schema({
  // Preferred (current) field names
  institutionName: { type: String, required: true, trim: true },
  username: { type: String, trim: true },
  password: { type: String },
  institutionType: { type: String, enum: ['college', 'university', 'school'], required: true },
  institutionCode: { type: String, required: true },
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  requestMessage: { type: String, trim: true },
  website: { type: String, trim: true },
  approved: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  scholarshipsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }],

  // Backwards-compatible legacy fields (some code previously used these names)
  Inititutename: { type: String, trim: true },
  contactperson: { type: String, trim: true },
}, { timestamps: true });

// Register model under lowercase name 'verifier' to match schema refs elsewhere
// and also export the model object for direct requires.
const Verifier = mongoose.model('verifier', verifierSchema);
module.exports = Verifier;
