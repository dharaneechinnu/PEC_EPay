/**
 * Transaction Receipt Trigger Service
 * Automatically sends professional receipts when payment status changes
 */

const { generateProfessionalReceipt, generateReceiptNumber } = require('./receiptService');
const { sendPaymentReceipts } = require('../utils/email');
const VerifierApplication = require('../models/Hospitalapplyform');

/**
 * Check if a transaction status change should trigger receipt sending
 */
function shouldSendReceipt(oldStatus, newStatus) {
  const receiptTriggers = ['paid', 'processed', 'funded', 'disbursed'];
  const nonReceiptStatuses = ['failed', 'cancelled', 'order_created', 'processing', 'queued'];
  
  // Send receipt only if:
  // 1. Status changed to a success status
  // 2. Previous status was not already a success status
  return receiptTriggers.includes(newStatus) && !receiptTriggers.includes(oldStatus);
}

/**
 * Send professional receipt for a transaction
 */
async function sendTransactionReceipt(transaction) {
  try {
    console.log(`📧 Preparing receipt for transaction: ${transaction._id}`);

    // Get application details
    const appPop = await VerifierApplication.findById(transaction.applicationId)
      .populate('verifierId', 'contactEmail contactperson institutionname');

    if (!appPop) {
      console.warn(`⚠️ Application not found for transaction: ${transaction._id}`);
      return { success: false, error: 'Application not found' };
    }

    const patientEmail = appPop.patientemail || appPop.studentemail || appPop.student?.email;
    const hospitalEmail = appPop.payoutDetails?.email || appPop.verifierId?.contactEmail;

    if (!patientEmail && !hospitalEmail) {
      console.warn(`⚠️ No email addresses found for transaction: ${transaction._id}`);
      return { success: false, error: 'No email addresses available' };
    }

    // Generate receipt data
    const receiptNumber = generateReceiptNumber(transaction._id);
    const receiptData = {
      receiptNumber,
      transactionId: String(transaction._id),
      paymentId: transaction.paymentId || transaction.transferId || 'N/A',
      applicationNumber: appPop.ApplicationNo || String(transaction.applicationId).slice(-8),
      amount: transaction.amount || 0, // Amount in paise
      
      // Patient information
      patientName: appPop.patientname || appPop.studentname || 'Patient',
      patientEmail: patientEmail || 'N/A',
      emergencyType: appPop.emergencyType || 'Medical Emergency',
      
      // Hospital information
      hospitalName: appPop.institutionname || appPop.verifierId?.institutionname || 'Hospital',
      hospitalEmail: hospitalEmail || 'N/A',
      accountHolderName: appPop.payoutDetails?.accountHolderName || 'N/A',
      maskedAccountNumber: appPop.payoutDetails?.accountNumber ? 
        `****${appPop.payoutDetails.accountNumber.slice(-4)}` : 'N/A',
      ifscCode: appPop.payoutDetails?.ifsc || 'N/A'
    };

    // Generate PDF
    const pdfBuffer = await generateProfessionalReceipt(receiptData);

    // Send emails
    const emailResults = await sendPaymentReceipts(receiptData, pdfBuffer);

    console.log(`✅ Receipt generation completed for ${receiptNumber}`);
    return { 
      success: true, 
      receiptNumber, 
      emailResults 
    };

  } catch (error) {
    console.error(`❌ Error sending receipt for transaction ${transaction._id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Middleware to automatically send receipts on transaction status changes
 */
function setupTransactionReceiptHooks() {
  const Transaction = require('../models/transaction');

  // Post-save hook to check for status changes
  Transaction.schema.post('save', async function(doc, next) {
    try {
      // Check if this is an update (not new creation)
      if (!doc.isNew && doc.isModified('status')) {
        const originalDoc = await Transaction.findById(doc._id);
        const oldStatus = originalDoc?.status;
        const newStatus = doc.status;

        if (shouldSendReceipt(oldStatus, newStatus)) {
          console.log(`🎯 Status change detected: ${oldStatus} → ${newStatus}. Sending receipt...`);
          
          // Send receipt asynchronously (don't block the save)
          setImmediate(async () => {
            await sendTransactionReceipt(doc);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error in transaction receipt hook:', error);
    }
    next();
  });

  console.log('📧 Transaction receipt hooks initialized');
}

module.exports = {
  shouldSendReceipt,
  sendTransactionReceipt,
  setupTransactionReceiptHooks
};