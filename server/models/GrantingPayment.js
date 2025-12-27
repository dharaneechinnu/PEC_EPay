// models/scholarship.js - Granting Payment (Emergency Medical Credit Products)
// Note: This file historically used the 'Scholarship' model name for compatibility.
// Now it also registers a 'GrantingPayment' model alias to reflect the domain term.
const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
  // Emergency Credit Product Information
  scholarshipName: {
      type: String,
      required: true,
      trim: true,
      // Examples: "Emergency Cardiac Surgery Credit", "Critical Care Emergency Fund"
      },
      providerName: {
      type: String,
      required: true,
      trim: true,
      // NBFC Partner providing the emergency credit
      },
      description: {
      type: String,
      required: true,
      // Credit product description and terms
      },
      
      // Emergency Credit Eligibility (replaces academic criteria)
      eligibilityCriteria: {
      // Medical Emergency Criteria
      emergencyType: {
        type: [String],
        enum: ['cardiac', 'trauma', 'surgery', 'icu', 'cancer', 'neurological', 'pediatric', 'any'],
        default: ['any']
      },
      minCreditScore: {
        type: Number,
        min: 300,
        max: 850,
        default: null,
      },
      maxPatientAge: {
        type: Number,
        default: null,
      },
      minPatientIncome: {
        type: Number,
        default: null,
      },
      maxPatientIncome: {
        type: Number,
        default: null,
      },
      insuranceRequired: {
        type: Boolean,
        default: false,
      },
      collateralRequired: {
        type: Boolean,
        default: false, // Emergency loans typically uncollateralized
      },
      guarantorRequired: {
        type: Boolean,
        default: false,
      },
      employmentStatus: {
        type: [String],
        enum: ['employed', 'self-employed', 'unemployed', 'student', 'retired', 'any'],
        default: ['any'],
      },
      medicalHistory: {
        type: [String],
        enum: ['none', 'pre-existing-conditions', 'chronic-illness', 'any'],
        default: ['any'],
      },
      creditHistory: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'any'],
        default: 'any',
      },
      
      },
      applicationDeadline: {
      type: Date,
      required: true,
      },
      scholarshipAmount: {
      type: Number,
      required: true,
      },

    // ✅ Link to NBFC/Credit Provider (Who created this credit product)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminDonor', // Maintains compatibility - represents NBFC partner
      required: true,
    },
    
    // Emergency Credit Product Status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Credit Product Availability
    availableAmount: {
      type: Number,
      default: function() { return this.scholarshipAmount; }, // Initially equals max amount
    },
    
    // Product Limits
    maxRequestsPerHospital: {
      type: Number,
      default: 10, // Max simultaneous requests per hospital
    },
    dailyCreditLimit: {
      type: Number,
      default: 5000000, // Daily disbursement limit in paise (50 lakh INR)
    },
  },
  { timestamps: true }
);


// Register the schema with both names for compatibility
let GrantingPayment;
let Scholarship;
try {
  GrantingPayment = mongoose.model('GrantingPayment');
} catch (e) {
  GrantingPayment = mongoose.model('GrantingPayment', scholarshipSchema);
}

try {
  Scholarship = mongoose.model('Scholarship');
} catch (e) {
  Scholarship = mongoose.model('Scholarship', scholarshipSchema);
}

module.exports = GrantingPayment;
