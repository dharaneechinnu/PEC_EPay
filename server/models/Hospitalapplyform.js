// models/verifierApplicationModel.js - Emergency Medical Credit Requests
// Note: Maintaining model structure for API compatibility
// but now represents Emergency Medical Credit Requests from Hospitals
const mongoose = require("mongoose");

const verifierApplicationSchema = new mongoose.Schema(
  {
    // Hospital Information (was verifierId)
    verifierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital", // Hospital making the emergency credit request
      required: true,
    },
    ApplicationNo:{
      type: String,
      required: true,
      unique: true,
      // Format: EMC-YYYYMMDD-XXXXX (Emergency Medical Credit)
    },
    // NBFC/Credit Provider Information
    AdminDonorid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminAdminDonor", // NBFC providing emergency credit
      required: true,
    },
    // adminId: reference to the NBFC admin who manages this credit product
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminDonor',
      required: false,
    },
    // Emergency Credit Product Reference
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship", // Emergency Credit Product
      required: true,
    },
    
    // Patient Information (was student fields)
    studentname: { type: String, required: true, trim: true }, // Patient Name
    studentemail: { type: String, required: true, trim: true }, // Patient Email
    studentid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsersLogins", // Patient User Account
    },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    
    // Hospital & Medical Information
    institutionname: { type: String, required: true, trim: true }, // Hospital Name
    classoryear: { type: String, required: true, trim: true }, // Department/Ward
    
    // Emergency Medical Details (replacing academic fields)
    emergencyType: {
      type: String,
      enum: ['cardiac', 'trauma', 'surgery', 'icu', 'cancer', 'neurological', 'pediatric', 'other'],
      required: true
    },
    medicalCondition: { type: String, required: true, trim: true }, // Diagnosis
    treatmentRequired: { type: String, required: true, trim: true }, // Treatment plan
    urgencyLevel: {
      type: String,
      enum: ['critical', 'urgent', 'moderate'],
      required: true,
      default: 'urgent'
    },
    estimatedTreatmentCost: { type: Number, required: true }, // Expected cost
    
    // Patient Financial Information
    patientAge: { type: Number, min: 0, max: 120 },
    patientIncome: { type: Number }, // Monthly income
    familyIncome: { type: Number, required: true }, // Family monthly income
    insuranceStatus: {
      type: String,
      enum: ['insured', 'uninsured', 'partial'],
      default: 'uninsured'
    },
    insuranceProvider: { type: String, trim: true },
    insurancePolicyNumber: { type: String, trim: true },
    insuranceClaimAmount: { type: Number, default: 0 },
    
    // Credit Assessment (replacing academic fields)
    creditScore: { type: Number, min: 300, max: 850 },
    employmentStatus: {
      type: String,
      enum: ['employed', 'self-employed', 'unemployed', 'student', 'retired'],
      default: 'employed'
    },
    employerName: { type: String, trim: true },
    monthlyIncome: { type: Number },
    
    // Legacy fields for backward compatibility
    tenthMarks: { type: Number, min: 0, max: 100 },
    twelfthMarks: { type: Number, min: 0, max: 100 },
    semesterCgpa: [
      {
        semester: { type: Number, min: 1 },
        cgpa: { type: Number, min: 0, max: 10 },
      },
    ],
    firstGenGraduate: { type: Boolean, default: false },
    documents: [
      {
        docType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        // mark uploaded documents as unverified by default; verifier/admin can verify later
        verified: { type: Boolean, default: false },
      },
    ],
    // Payment and payout information for Razorpay integration
    // NOTE: do NOT store full sensitive data (like raw bank account numbers) in plain text in production.
    // Consider encrypting these fields or storing only masked values and a provider-side beneficiary id.
    razorpay: {
      // Order created on Razorpay (when requesting payment)
      orderId: { type: String },
      // Successful payment details (filled after payment/webhook verification)
      paymentId: { type: String },
      signature: { type: String },
      amount: { type: Number }, // amount in smallest currency unit (e.g., paise)
      currency: { type: String, default: 'INR' },
      paymentStatus: { type: String }, // e.g., 'created', 'authorized', 'captured', 'failed'
      paymentMethod: { type: String }, // e.g., 'card', 'upi', 'netbanking'
      paymentAt: { type: Date },
      // Razorpay contact/customer id (optional)
      contactId: { type: String },
    },

    // Payout/beneficiary details (for sending scholarship funds to student)
    payoutDetails: {
      // RazorpayX / recipient id assigned by Razorpay for this beneficiary (safe to store)
      beneficiaryId: { type: String },
      // Basic beneficiary info — in production mask or encrypt accountNumber
      accountHolderName: { type: String },
      accountNumber: { type: String },
      maskedAccountNumber: { type: String },
      ifsc: { type: String },
      bankName: { type: String },
      email: { type: String },
      phone: { type: String },
      beneficiaryVerified: { type: Boolean, default: false },
    },

    // History of payouts/transfer attempts to this application/student
    payoutHistory: [
      {
        transferId: { type: String }, // transfer/payout id returned by Razorpay
        amount: { type: Number }, // in smallest currency unit
        currency: { type: String, default: 'INR' },
        status: { type: String }, // e.g., 'queued','processing','processed','failed'
        initiatedAt: { type: Date },
        completedAt: { type: Date },
        failureReason: { type: String },
      },
    ],
    // Emergency Credit Request Status
    status: {
      type: String,
      enum: ["pending", "submitted", "risk-assessment", "nbfc-review", "approved", "funded", "disbursed", "rejected", "expired"],
      default: "submitted",
    },
    remarks: { type: String, trim: true }, // Hospital remarks
    
    // Credit Amount & Funding
    fundedraised:{
        type: Number,
        required: true,
        default:0
    },
    requestedAmount: { type: Number, required: true }, // Amount requested by hospital
    approvedAmount: { type: Number, default: 0 }, // Amount approved by NBFC
    disbursedAmount: { type: Number, default: 0 }, // Amount actually disbursed
    
    // NBFC Decision (was AdminDonor decision)
    AdminDonorRemarks: { type: String, trim: true }, // NBFC remarks
    AdminDonorDecision: {
      type: String,
      enum: ["pending", "risk-approved", "approved", "rejected", "funded", "disbursed"],
      default: "pending",
    },
    AdminDonorActionAt: { type: Date }, // NBFC decision timestamp
    
    // Emergency Credit Workflow Timestamps
    emergencyRequestedAt: { type: Date, default: Date.now },
    riskAssessmentCompletedAt: { type: Date },
    nbfcApprovedAt: { type: Date },
    fundsDisbursedat: { type: Date },
    
    // Repayment Information
    repaymentSchedule: {
      emiAmount: { type: Number },
      numberOfEmi: { type: Number },
      emiStartDate: { type: Date },
      interestRate: { type: Number },
      processingFee: { type: Number }
    },
    
    // EMI Payment tracking
    emiPayments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EMIPayment'
    }],
    emiStatus: {
      type: String,
      enum: ['not-applicable', 'active', 'completed', 'defaulted'],
      default: 'not-applicable'
    },
    totalEMIPaid: { type: Number, default: 0 },
    remainingEMIAmount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const VerifierApplication = mongoose.model(
  "VerifierApplication",
  verifierApplicationSchema
);

module.exports = VerifierApplication;
