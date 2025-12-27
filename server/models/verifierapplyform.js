// models/verifierApplicationModel.js
const mongoose = require("mongoose");

const verifierApplicationSchema = new mongoose.Schema(
  {
    verifierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "verifier",
      required: true,
    },
    ApplicationNo:{
      type: String,
      required: true,
      unique: true,
    },
     donorid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donor",
      required: true,
    },
    // adminId: reference to the donor/admin who created the scholarship
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: false,
    },
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },
    studentname: { type: String, required: true, trim: true },
    studentemail: { type: String, required: true, trim: true },
    studentid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsersLogins",
    
    },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    institutionname: { type: String, required: true, trim: true },
    classoryear: { type: String, required: true, trim: true },
    tenthMarks: { type: Number, min: 0, max: 100 },
    twelfthMarks: { type: Number, min: 0, max: 100 },
    semesterCgpa: [
      {
        semester: { type: Number, min: 1 },
        cgpa: { type: Number, min: 0, max: 10 },
      },
    ],
    familyIncome: { type: Number, required: true },
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
    status: {
      type: String,
      enum: ["pending", "submitted", "approved", "funded", "rejected"],
      default: "submitted",
    },
    remarks: { type: String, trim: true },
    fundedraised:{
        type: Number,
        required: true,
        default:0
    },
    // Donor review fields
    
   
    donorRemarks: { type: String, trim: true },
    donorDecision: {
      type: String,
      enum: ["pending", "approved", "rejected", "funded"],
      default: "pending",
    },
    donorActionAt: { type: Date },
  },
  { timestamps: true }
);

const VerifierApplication = mongoose.model(
  "VerifierApplication",
  verifierApplicationSchema
);

module.exports = VerifierApplication;
