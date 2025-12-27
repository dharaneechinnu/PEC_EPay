// controllers/adminController.js
const Donor = require('../models/donor');
const Scholarship = require('../models/scholarship');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { default: mongoose } = require('mongoose');
const VerifierApplication = require('../models/verifierapplyform');
const Transaction = require('../models/transaction');
const { createPayout, createOrder, capturePayment, createContact, createFundAccount } = require('../services/razorpayService');
const { createBlock, generateSecureTransactionId } = require('../services/blockchainService');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const stream = require('stream');
const { sendReceiptEmailUsingGmail } = require('../utils/email');


exports.registerDonorRequest = async (req, res) => {
  try {
    console.log("DEBUG: Starting donor registration process");
    
    const {
      orgName,
      donorType,
      contactPerson,
      contactEmail,
      website,
      requestMessage,
    } = req.body;
    
    console.log("DEBUG: Request Body received:", req.body);

    // Validate required fields
    if (!orgName || !contactEmail) {
      console.log("DEBUG: Missing required fields - orgName or contactEmail");
      return res.status(400).json({
        message: 'Organization name and contact email are required',
        debug: 'Missing required fields validation failed'
      });
    }

    console.log("DEBUG: Checking for existing donor with email:", contactEmail);
    const existing = await Donor.findOne({ contactEmail: contactEmail });
    console.log("DEBUG: Existing donor check result:", existing);
    if (existing) {
      console.log("DEBUG: Email already exists in database");
      return res.status(400).json({ 
        message: 'Email already registered',
        debug: 'Duplicate email check failed'
      });
    }

    console.log("DEBUG: Hashing password");

    console.log("DEBUG: Creating new donor object");

    // Generate a temporary password for donor login (will be hashed by User pre-save hook)
    const tempPassword = crypto.randomBytes(6).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').slice(0,12);

    const donor = new Donor({
      // Required User fields (provide safe defaults)
      name: contactPerson || orgName,
      email: contactEmail,
      password: tempPassword,
      dob: req.body.dob ? new Date(req.body.dob) : new Date('1900-01-01'),
      gender: req.body.gender || 'other',
      institution: orgName || req.body.institution || 'DonorOrg',

      // Donor-specific fields
      orgName,
      donorType,
      contactPerson,
      contactEmail,
      website,
      requestMessage,
      approved: false,
      status: 'pending',
    });

    console.log("DEBUG: Saving donor to database");
    await donor.save();
    console.log("DEBUG: Donor saved successfully with ID:", donor._id);

    res.status(201).json({
      message: 'Registration request submitted successfully. Awaiting Super Admin approval.',
      donor: {
        id: donor._id,
        orgName: donor.orgName,
        status: donor.status,
      },
      debug: 'Registration completed successfully'
    });
  } catch (error) {
    console.error("DEBUG: Error in registerDonorRequest:", error);
    console.error("DEBUG: Error stack:", error.stack);
    res.status(500).json({ 
      message: 'registerDonorRequest Error submitting request', 
      error: error.message,
      debug: {
        errorName: error.name,
        errorCode: error.code,
        errorStack: error.stack
      }
    });
  }
};


exports.Loginadmin = async (req,res) =>{
try {
  const{username,password}= req.body;

  if(!username||!password){
    console.log("username and password are missing");
    res.status(404).json({"message":"username and Password are missing"});
  }
  const admin = await Donor.findOne({username:username});

  const ismatch =  bcrypt.compare(password,admin.password);
  if(!ismatch){
    res.status(400).json({"Message":"Password Incorrect"});
  }
  const token = jwt.sign({ id:admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
   const { password: _, ...adminWithoutPassword } = admin.toObject();

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: adminWithoutPassword,
    });
} catch (error) {
  console.log(error);
}
};

exports.createScholarship = async (req, res) => {
  try {
    console.log('DEBUG: createScholarship called with body:', req.body);

    const {
      scholarshipName,
      providerName,
      description,
      eligibilityCriteria,
      applicationDeadline,
      scholarshipAmount,
      isActive,
      createdBy // optional donor id (if authentication not wired)
    } = req.body;

    // ✅ Basic validation
    if (!scholarshipName || !providerName || !description || !applicationDeadline || !scholarshipAmount) {
      return res.status(400).json({
        message:
          'Missing required fields. Required: scholarshipName, providerName, description, applicationDeadline, scholarshipAmount',
      });
    }

    // ✅ Get donor ID (from auth or body)
    const donorId = req.user?.id || createdBy;
    if (!donorId) {
      return res.status(400).json({
        message: 'Donor id (createdBy) is required. Provide it in request body or via authentication.',
      });
    }

    // ✅ Validate donor existence
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // ✅ Prepare scholarship data
    const scholarshipData = {
      scholarshipName,
      providerName,
      description,
      eligibilityCriteria: {
        tenthMarks: eligibilityCriteria?.tenthMarks || null,
        twelfthMarks: eligibilityCriteria?.twelfthMarks || null,
        collegeCGPA: eligibilityCriteria?.collegeCGPA || null,
        maxParentIncome: eligibilityCriteria?.maxParentIncome || null,
        womenPreference: eligibilityCriteria?.womenPreference || false,
        academicPerformance: eligibilityCriteria?.academicPerformance || 'Any',
        disabilityAllowed: eligibilityCriteria?.disabilityAllowed || ['None'],
        extracurricular: eligibilityCriteria?.extracurricular || [],
        firstGenGraduate: eligibilityCriteria?.firstGenGraduate || false,
        specialCategory: eligibilityCriteria?.specialCategory || [],
      },
      applicationDeadline: new Date(applicationDeadline),
      scholarshipAmount,
      createdBy: donor._id,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    };

    // ✅ Save to DB
    const scholarship = new Scholarship(scholarshipData);
    await scholarship.save();

    console.log('DEBUG: Scholarship created with ID:', scholarship._id);

    // ✅ Send response
    res.status(201).json({
      message: 'Scholarship created successfully 🎓',
      scholarship,
    });
  } catch (error) {
    console.error('❌ Error in createScholarship:', error.message);
    res.status(500).json({ message: 'Error creating scholarship', error: error.message });
  }
};

// Admin: view all scholarship applications (with optional filters)
exports.viewAllApplications = async (req, res) => {
  try {
    const { scholarshipId, status, page = 1, limit = 25 } = req.query;
    const filter = {};

    if (scholarshipId) {
      if (!mongoose.Types.ObjectId.isValid(scholarshipId)) return res.status(400).json({ message: 'Invalid scholarshipId' });
      filter.scholarshipId = scholarshipId;
    }
    if (status) {
      filter.status = status;
    }

    const skip = (Math.max(parseInt(page, 10), 1) - 1) * Math.max(parseInt(limit, 10), 1);

    const [total, applications] = await Promise.all([
      VerifierApplication.countDocuments(filter),
      VerifierApplication.find(filter)
        .populate('scholarshipId', 'scholarshipName title')
        .populate('verifierId', 'institutionName contactEmail')
        .populate('studentid', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
    ]);

    res.status(200).json({ total, page: parseInt(page, 10), limit: parseInt(limit, 10), applications });
  } catch (error) {
    console.error('Error in viewAllApplications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: get single application details
exports.getApplicationDetails = async (req, res) => {
  try {
    const applicationId = req.params.applicationId || req.query.applicationId;
    if (!applicationId) return res.status(400).json({ message: 'applicationId is required' });
    if (!mongoose.Types.ObjectId.isValid(applicationId)) return res.status(400).json({ message: 'Invalid applicationId' });
console.log("Application ID:", applicationId);
    const application = await VerifierApplication.findById(applicationId)
      .populate('scholarshipId')
      .populate('verifierId', 'institutionName contactEmail')
      .populate('studentid', 'name email');

    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.status(201).json({ "applicationLength": application.length, "application": application });
  } catch (error) {
    console.error('Error in getApplicationDetails:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};





// Admin: update a document inside an application (mark verified/unverified or change docType)
// PATCH /admin/applications/:applicationId/documents/:documentId
exports.updateApplicationDocumentandapplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    // status should be 'approved' or 'rejected' (string)
    if (!applicationId) return res.status(400).json({ message: 'applicationId is required in URL' });
    if (!mongoose.Types.ObjectId.isValid(applicationId)) return res.status(400).json({ message: 'Invalid applicationId' });

    const application = await VerifierApplication.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

   
    
    // Set application status if provided and valid
    if (status === 'approved' || status === 'rejected') {
      application.status = status;
      application.donorDecision = status;
    }

    await application.save();

    res.status(200).json({ message: 'Document verified and application status updated', applicationStatus: application.status });
  } catch (error) {
    console.error('Error in updateApplicationDocumentandapplication:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Make payment to verifier using Razorpay payoutDetails
exports.makePayoutToVerifier = async (req, res) => {
  try {
    const { applicationId } = req.params;
    console.debug('makePayoutToVerifier called for applicationId=', applicationId);
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: 'Valid applicationId required in URL' });
    }

    const application = await VerifierApplication.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const payout = application.payoutDetails || null;
    if (!payout || !payout.beneficiaryId) {
      return res.status(400).json({ message: 'No payoutDetails/beneficiaryId found for this application' });
    }

    // Resolve scholarship id (could be populated or just id)
    const scholarshipId = application.scholarshipId && application.scholarshipId._id ? application.scholarshipId._id : application.scholarshipId;
    if (!scholarshipId || !mongoose.Types.ObjectId.isValid(scholarshipId)) {
      return res.status(400).json({ message: 'Invalid scholarshipId associated with application' });
    }

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    const scholarshipAmount = Number(scholarship.scholarshipAmount || 0);
    if (Number.isNaN(scholarshipAmount) || scholarshipAmount <= 0) {
      return res.status(400).json({ message: 'Invalid scholarship amount' });
    }

    const amount = Math.round(scholarshipAmount * 100); // INR to paise

    // Prepare payout payload
    const referenceId = `app_${application._id}`;
    const studentName = application.studentname || application.studentName || application.student?.name || 'student';

    // Basic validation: prefer Razorpay fund_account ids (fa_), but allow legacy beneficiary ids (bene_)
    // If neither format, log and return a helpful error.
    const bid = payout.beneficiaryId;
    if (typeof bid !== 'string' || !(bid.startsWith('fa_') || bid.startsWith('bene_'))) {
      const msg = 'Invalid beneficiaryId for payouts. Expected a Razorpay fund_account id (starts with "fa_") or legacy beneficiary id (starts with "bene_"). Please create/store a correct beneficiary id in application.payoutDetails.beneficiaryId.';
      console.error('Payout aborted - invalid beneficiaryId:', bid);
      // Log a failed transaction record for visibility
      try {
        // resolve admin id from application or scholarship
        const adminIdForTxn = application.adminId || (scholarship && scholarship.createdBy) || undefined;
        const txnPayloadFailed = {
          applicationId: application._id,
          beneficiaryId: bid,
          amount,
          currency: 'INR',
          status: 'failed',
          failureReason: msg,
          payoutDetails: payout,
          rawResponse: { note: 'invalid beneficiaryId' },
        };
        if (adminIdForTxn) txnPayloadFailed.adminid = adminIdForTxn;
        await Transaction.create(txnPayloadFailed);
      } catch (logErr) {
        console.error('Failed to log failed transaction (invalid beneficiary):', logErr);
      }

      return res.status(400).json({ message: msg, beneficiaryId: bid });
    }

    let payoutResp;
    try {
      payoutResp = await createPayout({
        beneficiaryId: payout.beneficiaryId,
        amount,
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'scholarship',
        referenceId,
        narration: `Scholarship payout for ${studentName}`,
      });
      console.debug('createPayout response:', payoutResp);
    } catch (err) {
      // Log full error object for debugging
      console.error('createPayout error object:', err && err.response ? err.response : err);

      // Derive a useful message and details
      const errMsg = err && (err.message || (err.response && (typeof err.response === 'string' ? err.response : JSON.stringify(err.response))) || JSON.stringify(err));
      const errDetails = err && err.response ? err.response : err;

      // Log failed transaction with a readable failureReason
      try {
        const adminIdForTxn = application.adminId || (scholarship && scholarship.createdBy) || undefined;
        const txnPayloadFailed = {
          applicationId: application._id,
          beneficiaryId: payout.beneficiaryId,
          amount,
          currency: 'INR',
          status: 'failed',
          failureReason: errMsg,
          payoutDetails: payout,
          rawResponse: errDetails,
        };
        if (adminIdForTxn) txnPayloadFailed.adminid = adminIdForTxn;
        await Transaction.create(txnPayloadFailed);
      } catch (logErr) {
        console.error('Failed to log failed transaction:', logErr);
      }

      return res.status(500).json({ message: 'Razorpay payout failed', error: errMsg, details: errDetails });
    }

    // Create transaction record (be defensive about payoutResp shape)
    const txnPayload = {
      applicationId: application._id,
      beneficiaryId: payout.beneficiaryId,
      amount,
      currency: 'INR',
      status: payoutResp?.status || 'processing',
      transferId: payoutResp?.id || payoutResp?.transfer_id || null,
      initiatedAt: payoutResp?.created_at ? new Date(Number(payoutResp.created_at) * 1000) : new Date(),
      payoutDetails: payout,
      rawResponse: payoutResp,
    };
    // attach admin id if resolvable
    const adminIdForTxnMain = application.adminId || (scholarship && scholarship.createdBy) || undefined;
    if (adminIdForTxnMain) txnPayload.adminid = adminIdForTxnMain;

    let txn;
    try {
      if (!txnPayload.adminid) {
        // admin id is mandatory for transactions
        return res.status(500).json({ message: 'Admin id not found for this application; cannot create transaction record' });
      }
      txn = await Transaction.create(txnPayload);
    } catch (txErr) {
      console.error('Failed to create transaction record:', txErr);
      // continue - we still want to return payout response
    }

    // Update application status/history
    try {
      application.status = 'funded';
      application.payoutHistory = application.payoutHistory || [];
      application.payoutHistory.push({
        transferId: txnPayload.transferId,
        amount,
        currency: 'INR',
        status: txnPayload.status,
        initiatedAt: txnPayload.initiatedAt,
        completedAt: payoutResp?.funded_at ? new Date(Number(payoutResp.funded_at) * 1000) : undefined,
        failureReason: payoutResp?.failure_reason,
      });
      // Also mark donorDecision as funded and record action time
      try {
        application.donorDecision = 'funded';
        application.donorActionAt = new Date();
        // Update fundedraised (store in rupees, add to existing if present)
        const paidPaise = amount || (txnPayload && txnPayload.amount) || 0;
        const paidRupees = Number((paidPaise / 100).toFixed(2));
        application.fundedraised = (Number(application.fundedraised || 0) + paidRupees);
      } catch (setErr) {
        console.warn('Could not update donorDecision/fundedraised on application:', setErr);
      }
      await application.save();
    } catch (appErr) {
      console.error('Failed to update application payout history:', appErr);
    }

    return res.status(200).json({ message: 'Payout initiated', transaction: txn || null, payoutResponse: payoutResp });
  } catch (error) {
    console.error('Error in makePayoutToVerifier:', error);
    return res.status(500).json({ message: 'Server error', error: error && error.message ? error.message : String(error) });
  }
};

// Create a Razorpay order for frontend Checkout and record an 'order_created' transaction
exports.createOrderForApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) return res.status(400).json({ message: 'Valid applicationId required in URL' });

    const application = await VerifierApplication.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const scholarshipId = application.scholarshipId && application.scholarshipId._id ? application.scholarshipId._id : application.scholarshipId;
    if (!scholarshipId || !mongoose.Types.ObjectId.isValid(scholarshipId)) return res.status(400).json({ message: 'Invalid scholarshipId associated with application' });

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    const scholarshipAmount = Number(scholarship.scholarshipAmount || 0);
    if (Number.isNaN(scholarshipAmount) || scholarshipAmount <= 0) {
      return res.status(400).json({ message: 'Invalid scholarship amount' });
    }

    // If the application already has a fundedraised value set, prefer that as the amount
    // fundedraised is stored in rupees (Number). Otherwise fall back to scholarship amount.
    let amountRupees = scholarshipAmount;
    if (typeof application.fundedraised !== 'undefined' && application.fundedraised !== null) {
      const fr = Number(application.fundedraised);
      if (!Number.isNaN(fr) && fr > 0) {
        amountRupees = fr;
      }
    }

    const amount = Math.round(amountRupees * 100); // convert rupees to paise


    // Ensure payout beneficiary exists on application (required to create transaction)
    const payout = application.payoutDetails || null;
    if (!payout || !payout.beneficiaryId) {
      return res.status(400).json({ message: 'No payoutDetails/beneficiaryId found for this application' });
    }

    // Create Razorpay order
    const order = await createOrder({ amount, currency: 'INR', receipt: `app_${application._id}`, notes: { applicationId: application._id.toString() } });

    // Record a transaction tied to this application and order (include beneficiaryId)
    const adminIdForOrder = application.adminId || (scholarship && scholarship.createdBy) || undefined;
    const txnPayloadOrder = {
      applicationId: application._id,
      beneficiaryId: payout.beneficiaryId,
      amount,
      currency: 'INR',
      status: 'order_created',
      orderId: order.id,
      rawResponse: order,
    };
    if (adminIdForOrder) txnPayloadOrder.adminid = adminIdForOrder;
    if (!txnPayloadOrder.adminid) {
      return res.status(500).json({ message: 'Admin id not found for this application; cannot create order transaction' });
    }
    const txn = await Transaction.create(txnPayloadOrder);

    // Return order and transaction along with publishable key for frontend
    const key = process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_here';

    return res.status(201).json({ message: 'Order created', order, transaction: txn, key });
  } catch (error) {
    console.error('Error in createOrderForApplication:', error);
    return res.status(500).json({ message: 'Server error', error: error && error.message ? error.message : String(error) });
  }
};

// Verify Razorpay payment signature and mark transaction as paid
exports.verifyPaymentForApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) return res.status(400).json({ message: 'Valid applicationId required in URL' });
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) return res.status(400).json({ message: 'Missing payment fields' });

    // Choose secret depending on test mode flag (mirror service logic)
    const IS_TEST_MODE = process.env.RAZORPAY_TEST_MODE === 'true';
    const RAZORPAY_KEY_SECRET = IS_TEST_MODE ? process.env.RAZORPAY_TEST_KEY_SECRET : process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_SECRET) return res.status(500).json({ message: 'Razorpay secret not configured' });

    const generated_signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Optionally capture payment if needed (most flows use payment_capture=1 so it's already captured)
    // We'll attempt to capture if capturePayment is available and desired; skip otherwise.

    // Fetch application to get beneficiary/amount if needed
    const application = await VerifierApplication.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const payout = application.payoutDetails || null;
    if (!payout || !payout.beneficiaryId) {
      return res.status(400).json({ message: 'No payoutDetails/beneficiaryId found for this application' });
    }

    const scholarshipId = application.scholarshipId && application.scholarshipId._id ? application.scholarshipId._id : application.scholarshipId;
    let amount = undefined;
    if (scholarshipId && mongoose.Types.ObjectId.isValid(scholarshipId)) {
      const scholarship = await Scholarship.findById(scholarshipId);
      const scholarshipAmount = Number(scholarship?.scholarshipAmount || 0);
      if (!Number.isNaN(scholarshipAmount) && scholarshipAmount > 0) {
        amount = Math.round(scholarshipAmount * 100);
      }
    }

    // Update transaction record
  const txn = await Transaction.findOne({ applicationId, orderId: razorpay_order_id });
    if (!txn) {
      // Generate secure transaction ID using blockchain service
      const secureTransactionId = generateSecureTransactionId(applicationId, razorpay_payment_id);
      
      // Create a transaction if missing (include beneficiaryId and amount if available)
      const adminIdForPaidTxn = application.adminId || (scholarship && scholarship.createdBy) || undefined;
      const newTxnPayload = {
        applicationId,
        beneficiaryId: payout.beneficiaryId,
        amount: amount || 0,
        currency: 'INR',
        status: 'paid',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paidAt: new Date(),
        hashedTransactionId: secureTransactionId,
        rawResponse: req.body,
      };
      if (adminIdForPaidTxn) newTxnPayload.adminid = adminIdForPaidTxn;
      if (!newTxnPayload.adminid) {
        return res.status(500).json({ message: 'Admin id not found for this application; cannot create transaction record' });
      }
      const newTxn = await Transaction.create(newTxnPayload);

      // Create blockchain block for this transaction
      try {
        const blockData = {
          applicationId: applicationId,
          transactionId: newTxn._id.toString(),
          userId: application.studentid || 'anonymous',
          amount: amount || 0,
          currency: 'INR',
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
        };

        const block = await createBlock(blockData);
        
        // Update transaction with block reference
        newTxn.blockId = block._id;
        await newTxn.save();
        
        console.log(`Blockchain block created for transaction ${newTxn._id}: ${block.hash}`);
      } catch (blockError) {
        console.error('Error creating blockchain block:', blockError);
        // Continue execution even if blockchain fails
      }

      return res.status(200).json({ message: 'Payment verified', transaction: newTxn });
    }

    // Generate secure transaction ID if not present
    if (!txn.hashedTransactionId) {
      txn.hashedTransactionId = generateSecureTransactionId(applicationId, razorpay_payment_id);
    }

    // Ensure adminid exists on existing transaction (populate from application or scholarship)
    try {
      if (!txn.adminid) {
        const possibleAdmin = application.adminId || (scholarship && scholarship.createdBy) || undefined;
        if (possibleAdmin) txn.adminid = possibleAdmin;
      }
    } catch (e) {
      // non-fatal
    }

    txn.status = 'paid';
    txn.paymentId = razorpay_payment_id;
    txn.paidAt = new Date();
    txn.rawResponse = txn.rawResponse || {};
    txn.rawResponse.paymentVerification = req.body;
    
    // Create blockchain block for existing transaction if not already created
    if (!txn.blockId) {
      try {
        const blockData = {
          applicationId: applicationId,
          transactionId: txn._id.toString(),
          userId: application.studentid || 'anonymous',
          amount: amount || txn.amount || 0,
          currency: 'INR',
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
        };

        const block = await createBlock(blockData);
        txn.blockId = block._id;
        
        console.log(`Blockchain block created for existing transaction ${txn._id}: ${block.hash}`);
      } catch (blockError) {
        console.error('Error creating blockchain block for existing transaction:', blockError);
        // Continue execution even if blockchain fails
      }
    }
    
    await txn.save();
    // Mark application as funded (donor decision) and record action time
    try {
      application.donorDecision = 'funded';
      application.donorActionAt = new Date();
      // Record funded amount on application (convert paise -> rupees)
      try {
        const paidPaise = (typeof amount !== 'undefined' && amount) ? amount : (txn && txn.amount ? txn.amount : 0);
        application.fundedraised = Number((paidPaise / 100).toFixed(2));
      } catch (setAmtErr) {
        console.warn('Could not set application.fundedraised:', setAmtErr);
      }
      await application.save();
      console.debug('Application donorDecision updated to funded for', applicationId);
    } catch (appUpdateErr) {
      console.error('Failed to update application donorDecision to funded:', appUpdateErr);
    }

    // Send receipt emails to student and verifier (best-effort) with PDF attachment
    (async function sendReceiptsWithPdf() {
      try {
        // Pull latest application with verifier populated for emails
        const appPop = await VerifierApplication.findById(applicationId).populate('verifierId', 'contactEmail contactperson');

        const studentEmail = appPop?.studentemail || appPop?.student?.email || (appPop?.studentid && appPop.studentid.email);
        const verifierEmail = appPop?.payoutDetails?.email || appPop?.verifierId?.contactEmail;
  console.log('DEBUG txn.amount (paise):', txn.amount);
  // txn.amount is stored in the smallest currency unit (paise). Convert to rupees for display.
  const amountDisplay = Number(((txn.amount || 0) / 100).toFixed(2));
        const date = new Date().toLocaleString();

        const subject = `Scholarship payment receipt — Application ${applicationId}`;
        const plainText = `Payment successful for Application ${applicationId}\n\nTransaction ID: ${txn._id || txn.paymentId}\nPayment ID: ${txn.paymentId || razorpay_payment_id}\nOrder ID: ${txn.orderId || razorpay_order_id}\nAmount: ₹${amountDisplay}\nDate: ${date}\n\nIf you have questions, contact support.`;

        // Generate PDF receipt as a Buffer
        const generatePdfBuffer = () => new Promise((resolve, reject) => {
          try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];
            const passthrough = new stream.PassThrough();
            doc.pipe(passthrough);
            passthrough.on('data', (chunk) => chunks.push(chunk));
            passthrough.on('end', () => resolve(Buffer.concat(chunks)));

            // Header
            doc.fontSize(18).text('Payment Receipt', { align: 'center' });
            doc.moveDown();

            // Application / Transaction details
            doc.fontSize(12).text(`Application ID: ${applicationId}`);
            doc.text(`Transaction ID: ${txn._id || txn.paymentId || 'N/A'}`);
            doc.text(`Payment ID: ${txn.paymentId || razorpay_payment_id || 'N/A'}`);
            doc.text(`Order ID: ${txn.orderId || razorpay_order_id || 'N/A'}`);
            doc.text(`Date: ${date}`);
            doc.moveDown();

            // Payer / Payee
            const payerName = appPop?.studentname || appPop?.student?.name || appPop?.studentid?.name || 'Student';
            const payeeName = appPop?.verifierId?.contactperson || appPop?.payoutDetails?.accountHolderName || 'Verifier';
            doc.text(`Payer (Student): ${payerName}`);
            doc.text(`Payer Email: ${studentEmail || 'N/A'}`);
            doc.moveDown();
            doc.text(`Payee (Verifier): ${payeeName}`);
            doc.text(`Payee Email: ${verifierEmail || 'N/A'}`);
            doc.moveDown();

            // Amount
            doc.fontSize(14).text(`Amount Paid: ₹${amountDisplay}`, { continued: false });
            doc.moveDown(2);

            // Footer / notes
            doc.fontSize(10).text('Thank you for using our scholarship disbursement service.', { align: 'left' });
            doc.text('This is a computer-generated receipt.', { align: 'left' });

            doc.end();
          } catch (e) {
            reject(e);
          }
        });

        const pdfBuffer = await generatePdfBuffer();

        // Send via Gmail helper (uses GMAIL_USER + PASS env vars). Falls back to error if creds missing.
        const sentRecipients = [];
        if (studentEmail) {
          try {
            await sendReceiptEmailUsingGmail({ to: studentEmail, subject, text: plainText, attachments: [{ filename: `receipt_${applicationId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }] });
            console.debug('Receipt email (pdf) sent to student:', studentEmail);
            sentRecipients.push(studentEmail);
          } catch (err) {
            console.error('Failed to send student receipt (pdf):', err);
          }
        }

        // Optionally send to verifier if available and different from student
        if (verifierEmail && verifierEmail !== studentEmail) {
          try {
            await sendReceiptEmailUsingGmail({ to: verifierEmail, subject, text: plainText, attachments: [{ filename: `receipt_${applicationId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }] });
            console.debug('Receipt email (pdf) sent to verifier:', verifierEmail);
            sentRecipients.push(verifierEmail);
          } catch (err) {
            console.error('Failed to send verifier receipt (pdf):', err);
          }
        }

        // Print a consolidated success message after attempting sends
        if (sentRecipients.length > 0) {
          console.info(`Receipt email(s) successfully sent for application ${applicationId} to: ${sentRecipients.join(', ')}`);
        } else {
          console.warn(`No receipt emails were sent for application ${applicationId}. Check SMTP/Gmail configuration.`);
        }
      } catch (mailErr) {
        console.error('Error sending receipts (pdf):', mailErr);
      }
    })();

    return res.status(200).json({ message: 'Payment verified', transaction: txn });
  } catch (error) {
    console.error('Error in verifyPaymentForApplication:', error);
    return res.status(500).json({ message: 'Server error', error: error && error.message ? error.message : String(error) });
  }
};

// Create a Razorpay contact + fund_account for an application and save fa_ id
exports.createBeneficiaryForApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) return res.status(400).json({ message: 'Valid applicationId required in URL' });

    const application = await VerifierApplication.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Expect bank details in body
    const { name, email, contact, account_number, ifsc } = req.body;
    if (!name || !account_number || !ifsc) return res.status(400).json({ message: 'Missing required bank details: name, account_number, ifsc' });

    // Create contact
    const contactResp = await createContact({ name, email, contact, type: 'employee' });

    // Create fund_account
    const faResp = await createFundAccount({
      contact_id: contactResp.id,
      account_type: 'bank_account',
      bank_account: {
        name,
        ifsc,
        account_number,
      },
    });

    // Save on application.payoutDetails
    application.payoutDetails = application.payoutDetails || {};
    application.payoutDetails.beneficiaryId = faResp.id;
    application.payoutDetails.accountHolderName = name;
    application.payoutDetails.maskedAccountNumber = account_number.slice(-4).padStart(account_number.length, '*');
    application.payoutDetails.ifsc = ifsc;
    application.payoutDetails.email = email || application.payoutDetails.email;
    application.payoutDetails.beneficiaryVerified = true;
    await application.save();

    return res.status(201).json({ message: 'Beneficiary created', fundAccount: faResp, contact: contactResp, application });
  } catch (error) {
    console.error('Error in createBeneficiaryForApplication:', error);
    return res.status(500).json({ message: 'Server error', error: error && error.message ? error.message : String(error) });
  }
};



// Student/Verifier: apply to a scholarship (create a VerifierApplication)
// Accepts either :scholarshipId in params or scholarshipId in body
exports.applyToScholarship = async (req, res) => {
  try {
    const scholarshipId = req.params.scholarshipId || req.body.scholarshipId;
    if (!scholarshipId || !mongoose.Types.ObjectId.isValid(scholarshipId)) {
      return res.status(400).json({ message: 'Valid scholarshipId is required' });
    }

    // Validate scholarship exists
    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    // Required applicant fields
    const {
      verifierId,
      studentname,
      studentemail,
      studentid,
      gender,
      institutionname,
      classoryear,
      familyIncome,
      tenthMarks,
      twelfthMarks,
      semesterCgpa,
      documents,
      payoutDetails,
      remarks,
    } = req.body;

    // Basic validation for required fields
    if (!verifierId || !mongoose.Types.ObjectId.isValid(verifierId)) return res.status(400).json({ message: 'Valid verifierId is required' });
    if (!studentname || !studentemail || !studentid) return res.status(400).json({ message: 'studentname, studentemail and studentid are required' });
    if (!gender) return res.status(400).json({ message: 'gender is required' });
    if (!institutionname) return res.status(400).json({ message: 'institutionname is required' });
    if (typeof familyIncome === 'undefined' || familyIncome === null) return res.status(400).json({ message: 'familyIncome is required' });

    const applicationData = {
      verifierId,
      scholarshipId,
      // Resolve adminId from the scholarship (do not accept from frontend)
      adminId: scholarship.createdBy || undefined,
      studentname,
      studentemail,
      studentid,
      gender,
      institutionname,
      classoryear: classoryear || '',
      tenthMarks,
      twelfthMarks,
      semesterCgpa: Array.isArray(semesterCgpa) ? semesterCgpa : [],
      familyIncome: Number(familyIncome),
      firstGenGraduate: !!req.body.firstGenGraduate,
      documents: Array.isArray(documents) ? documents : [],
      payoutDetails: payoutDetails || {},
      remarks: remarks || '',
      status: 'submitted',
    };

    const newApp = new VerifierApplication(applicationData);
    await newApp.save();

    return res.status(201).json({ message: 'Application submitted', application: newApp });
  } catch (error) {
    console.error('Error in applyToScholarship:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get all applications for an admin
exports.getAllApplications = async (req, res) => {
  try {
    const adminId = req.params.adminId;

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: 'Valid adminId is required' });
    }

    // Fetch all verifier applications (you can filter further by admin logic if needed)
    const skip = 0;
    const applications = await VerifierApplication.find({ adminId })
      .populate('scholarshipId', 'scholarshipName providerName scholarshipAmount')
      .populate('verifierId', 'institutionname contactEmail')
      .populate('studentid', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Applications fetched successfully',
      total: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// New: Get paginated applications for an admin (donor) resolved via adminId stored on applications
exports.getApplicationsByAdminId = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 25, status, scholarshipId } = req.query;

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) return res.status(400).json({ message: 'Valid adminId is required' });

    const filter = { adminId };
    if (status) filter.status = status;
    if (scholarshipId && mongoose.Types.ObjectId.isValid(scholarshipId)) filter.scholarshipId = scholarshipId;

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (p - 1) * l;

    const [total, applications] = await Promise.all([
      VerifierApplication.countDocuments(filter),
      VerifierApplication.find(filter)
        .populate('scholarshipId', 'scholarshipName providerName scholarshipAmount applicationDeadline')
        .populate('verifierId', 'institutionname contactEmail')
        .populate('studentid', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
    ]);

    return res.status(200).json({ total, page: p, limit: l, applications });
  } catch (error) {
    console.error('Error in getApplicationsByAdminId:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// New: Get a single application that belongs to a given adminId (safety check)
exports.getApplicationByAdminAndId = async (req, res) => {
  try {
    const { adminId, applicationId } = req.params;
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) return res.status(400).json({ message: 'Valid adminId is required' });
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) return res.status(400).json({ message: 'Valid applicationId is required' });

    const application = await VerifierApplication.findOne({ _id: applicationId, adminId })
      .populate('scholarshipId')
      .populate('verifierId', 'institutionname contactEmail')
      .populate('studentid', 'name email');

    if (!application) return res.status(404).json({ message: 'Application not found for this admin' });

    return res.status(200).json({ application });
  } catch (error) {
    console.error('Error in getApplicationByAdminAndId:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin/Verifier: get all applications applied for a scholarship
// GET /admin/scholarships/:scholarshipId/applications
exports.getApplicationsForScholarship = async (req, res) => {
  try {
    const { scholarshipId } = req.params;
    if (!scholarshipId || !mongoose.Types.ObjectId.isValid(scholarshipId)) return res.status(400).json({ message: 'Valid scholarshipId required in URL' });

    const applications = await VerifierApplication.find({ scholarshipId })
      .populate('scholarshipId')
      .populate('verifierId', 'institutionName contactEmail')
      .populate('studentid', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ total: applications.length, applications });
  } catch (error) {
    console.error('Error in getApplicationsForScholarship:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Endpoint: resend receipt emails (PDF) for an application (uses latest paid transaction)
exports.resendReceipt = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!applicationId) return res.status(400).json({ message: 'applicationId is required' });

    const application = await VerifierApplication.findById(applicationId).populate('verifierId', 'contactEmail contactperson');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Find the latest transaction for this application (prefer paid)
    const TransactionModel = Transaction;
    let txn = await TransactionModel.findOne({ applicationId }).sort({ createdAt: -1 });
    if (!txn) return res.status(404).json({ message: 'No transaction found for this application' });

    // Prepare email recipients
    const studentEmail = application?.studentemail || application?.student?.email || application?.studentid?.email;
    const verifierEmail = application?.payoutDetails?.email || application?.verifierId?.contactEmail;

    const amountDisplay = (txn.amount || 0) / 100;
    const date = new Date(txn.paidAt || txn.createdAt || Date.now()).toLocaleString();
    const subject = `Scholarship payment receipt — Application ${applicationId}`;
    const plainText = `Payment record for Application ${applicationId}\n\nTransaction ID: ${txn._id}\nPayment ID: ${txn.paymentId || 'N/A'}\nOrder ID: ${txn.orderId || 'N/A'}\nAmount: ₹${amountDisplay}\nDate: ${date}\n`;

    // Generate PDF buffer
    const generatePdfBuffer = () => new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];
        const passthrough = new stream.PassThrough();
        doc.pipe(passthrough);
        passthrough.on('data', (chunk) => chunks.push(chunk));
        passthrough.on('end', () => resolve(Buffer.concat(chunks)));

        doc.fontSize(18).text('Payment Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Application ID: ${applicationId}`);
        doc.text(`Transaction ID: ${txn._id}`);
        doc.text(`Payment ID: ${txn.paymentId || 'N/A'}`);
        doc.text(`Order ID: ${txn.orderId || 'N/A'}`);
        doc.text(`Date: ${date}`);
        doc.moveDown();

        const payerName = application?.studentname || application?.studentid?.name || 'Student';
        const payeeName = application?.verifierId?.contactperson || application?.payoutDetails?.accountHolderName || 'Verifier';
        doc.text(`Payer (Student): ${payerName}`);
        doc.text(`Payer Email: ${studentEmail || 'N/A'}`);
        doc.moveDown();
        doc.text(`Payee (Verifier): ${payeeName}`);
        doc.text(`Payee Email: ${verifierEmail || 'N/A'}`);
        doc.moveDown();
        doc.fontSize(14).text(`Amount Paid: ₹${amountDisplay}`);
        doc.moveDown(2);
        doc.fontSize(10).text('This is a computer-generated receipt.', { align: 'left' });
        doc.end();
      } catch (e) { reject(e); }
    });

    const pdfBuffer = await generatePdfBuffer();

    const sent = [];
    if (studentEmail) {
      try {
        await sendReceiptEmailUsingGmail({ to: studentEmail, subject, text: plainText, attachments: [{ filename: `receipt_${applicationId}.pdf`, content: pdfBuffer }] });
        sent.push(studentEmail);
      } catch (e) {
        console.error('Failed to send receipt to student:', e);
      }
    }
    if (verifierEmail && verifierEmail !== studentEmail) {
      try {
        await sendReceiptEmailUsingGmail({ to: verifierEmail, subject, text: plainText, attachments: [{ filename: `receipt_${applicationId}.pdf`, content: pdfBuffer }] });
        sent.push(verifierEmail);
      } catch (e) {
        console.error('Failed to send receipt to verifier:', e);
      }
    }

    if (sent.length === 0) return res.status(500).json({ message: 'No receipts sent; check logs and SMTP configuration' });
    return res.status(200).json({ message: 'Receipts sent', recipients: sent });
  } catch (error) {
    console.error('Error in resendReceipt:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: search transactions by multiple fields (applicationId, adminId, transferId, paymentId, orderId, status, beneficiaryId, q)
exports.searchTransactions = async (req, res) => {
  try {
    const { applicationId, adminId, transferId, paymentId, orderId, status, beneficiaryId, q, page = 1, limit = 25 } = req.query;
    const filter = {};
    const mongoose = require('mongoose');

    if (applicationId && mongoose.Types.ObjectId.isValid(applicationId)) filter.applicationId = applicationId;
    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) filter.adminid = adminId;
    if (transferId) filter.transferId = transferId;
    if (paymentId) filter.paymentId = paymentId;
    if (orderId) filter.orderId = orderId;
    if (status) filter.status = status;
    if (beneficiaryId) filter.beneficiaryId = beneficiaryId;

    // Free text query: try matching transferId/paymentId/orderId/hashedTransactionId
    if (q && typeof q === 'string' && q.trim().length > 0) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { transferId: regex },
        { paymentId: regex },
        { orderId: regex },
        { hashedTransactionId: regex },
      ];
    }

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (p - 1) * l;

    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate('applicationId', 'ApplicationNo studentname studentemail')
        .populate('adminid', 'orgName contactEmail name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
    ]);

    return res.status(200).json({ total, page: p, limit: l, transactions });
  } catch (error) {
    console.error('Error in searchTransactions:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all transactions for a given adminId (path param) with optional q/page/limit
exports.getTransactionsByAdminId = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { q, page = 1, limit = 50 } = req.query;
    const mongoose = require('mongoose');
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) return res.status(400).json({ message: 'Valid adminId is required' });

    const filter = { adminid: adminId };
    if (q && typeof q === 'string' && q.trim().length > 0) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { transferId: regex },
        { paymentId: regex },
        { orderId: regex },
        { hashedTransactionId: regex },
        { beneficiaryId: regex },
      ];
    }

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (p - 1) * l;

    const [total, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate('applicationId', 'ApplicationNo studentname studentemail')
        .populate('adminid', 'orgName contactEmail name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
    ]);

    return res.status(200).json({ total, page: p, limit: l, transactions });
  } catch (error) {
    console.error('Error in getTransactionsByAdminId:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

