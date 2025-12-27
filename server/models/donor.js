// models/donorModel.js
const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  orgName: { type: String, required: true, trim: true },
  username: { type: String, trim: true },
  password: { type: String, },
  donorType: { type: String, enum: ['NGO', 'CSR', 'Individual'], required: true },
  contactPerson: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: true, lowercase: true },
  website: { type: String, trim: true },
  approved: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestMessage: { type: String, trim: true },
  totalDisbursed: { type: Number, default: 0 },
  scholarshipsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }],
}, { timestamps: true });

const Donor = mongoose.model('Donor', donorSchema);
module.exports = Donor;
