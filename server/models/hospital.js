// models/verifier.js - Hospital model for Emergency Medical Credit Platform
const mongoose = require('mongoose');

const verifierSchema = new mongoose.Schema({
  // Hospital Information
  institutionName: { type: String, required: true, trim: true }, // Hospital Name
  username: { type: String, trim: true },
  password: { type: String },
  institutionType: { 
    type: String, 
    enum: ['hospital', 'clinic', 'healthcare-center', 'emergency-care', 'specialty-hospital'], 
    required: true 
  },
  institutionCode: { type: String, required: true }, // Hospital Registration/License Number
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  contactPerson: { type: String, required: true, trim: true }, // Hospital Admin Contact
  requestMessage: { type: String, trim: true },
  website: { type: String, trim: true },
  
  // Emergency Credit Platform Status
  approved: { type: Boolean, default: false }, // Platform approval status
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  
  // Emergency Credit History
  creditRequestsInitiated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }], // Emergency credit requests
  
  // Hospital Verification Details
  hospitalLicenseNumber: { type: String, trim: true },
  emergencyLicenseVerified: { type: Boolean, default: false },
  creditLimit: { type: Number, default: 0 }, // Maximum emergency credit limit
  availableCredit: { type: Number, default: 0 }, // Available credit balance
  
  // Hospital Verification for Patient Access
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified', 'rejected'], 
    default: 'unverified' 
  },
  verificationDocuments: [{
    type: { type: String, enum: ['license', 'registration', 'address_proof', 'other'] },
    filename: String,
    originalname: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  hospitalAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  verificationSubmittedAt: Date,
  verificationCompletedAt: Date,
  verificationRemarks: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminDonor' },
  
  // Emergency Response Capability
  emergencyServices: [{ 
    type: String, 
    enum: ['cardiac', 'trauma', 'pediatric', 'neurology',  'icu', 'surgery','other'] 
  }],
  operatingHours: {
    emergency24x7: { type: Boolean, default: true },
    regularHours: { type: String }
  },

  // Backwards-compatible legacy fields (maintaining API compatibility)
  Inititutename: { type: String, trim: true }, // Legacy institution name
  contactperson: { type: String, trim: true }, // Legacy contact person
  scholarshipsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }], // Legacy scholarship references (now credit products)
}, { timestamps: true });

// Register model as 'Hospital' for the Emergency Medical Credit Platform
// Export as `Hospital` model; file kept as verifier.js for compatibility
const Hospital = mongoose.model('Hospital', verifierSchema);
module.exports = Hospital;
