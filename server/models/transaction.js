// models/transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerifierApplication',
    required: true,
  },
  adminid:{ type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
  beneficiaryId: { type: String, required: true },
  amount: { type: Number, required: true }, // in paise
  currency: { type: String, default: 'INR' },
  status: { type: String, required: true ,default: 'paid'}, // e.g., 'queued','processing','processed','failed'
  transferId: { type: String }, // Razorpay payout/transfer id
  initiatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  failureReason: { type: String },
  payoutDetails: {
    accountHolderName: String,
    accountNumber: String,
    maskedAccountNumber: String,
    ifsc: String,
    bankName: String,
    email: String,
    phone: String,
  },
  rawResponse: { type: Object }, // Store full Razorpay response for audit/debug
  
  // Blockchain-related fields
  blockId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Block',
    required: false 
  },
  hashedTransactionId: { 
    type: String, 
    required: false,
    unique: true,
    sparse: true // Allows multiple null values
  },
  paymentId: { type: String }, // Razorpay payment id
  orderId: { type: String }, // Razorpay order id
  paidAt: { type: Date }, // When payment was verified
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
