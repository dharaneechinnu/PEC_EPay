const mongoose = require('mongoose');

const emiPaymentSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerifierApplication',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersLogins',
    required: false // Optional - may not be linked to user account
  },
  patientEmail: {
    type: String,
    required: false // May not always have email
  },
  
  // EMI Details
  principalAmount: {
    type: Number,
    required: true
  },
  emiAmount: {
    type: Number,
    required: true
  },
  totalMonths: {
    type: Number,
    required: true
  },
  currentMonth: {
    type: Number,
    required: true,
    default: 1
  },
  interestRate: {
    type: Number,
    required: true,
    default: 1 // 1% per month
  },
  
  // Payment Details
  paymentId: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  signature: {
    type: String,
    required: true
  },
  
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Dates
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  
  // Additional Info
  lateFees: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
emiPaymentSchema.index({ requestId: 1, currentMonth: 1 });
emiPaymentSchema.index({ patientEmail: 1, status: 1 });
emiPaymentSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('EMIPayment', emiPaymentSchema);