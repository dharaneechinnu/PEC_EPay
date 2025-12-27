// models/block.js
const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  index: {
    type: Number,
    required: true,
    unique: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  prevHash: {
    type: String,
    required: true,
  },
  dataHash: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
    unique: true,
  },
  nonce: {
    type: Number,
    default: 0,
  },
  data: {
    hashedApplicationId: String,
    hashedTransactionId: String,
    hashedUserId: String,
    amount: Number,
    currency: String,
    status: String,
    razorpayPaymentId: String,
    razorpayOrderId: String,
  },
  signature: {
    type: String, // Optional server signature for additional verification
  },
}, { timestamps: true });

// Index for efficient chain traversal
blockSchema.index({ prevHash: 1 });

const Block = mongoose.model('Block', blockSchema);
module.exports = Block;