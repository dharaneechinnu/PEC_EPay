// controllers/adminController.js
const AdminDonor = require('../models/AdminDonor');
const Scholarship = require('../models/GrantingPayment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { verifyGoogleIdToken, generateJwt } = require('../services/authService');
const { default: mongoose } = require('mongoose');
const VerifierApplication = require('../models/Hospitalapplyform');
const Transaction = require('../models/transaction');

const { createPayout, createOrder, capturePayment, createContact, createFundAccount } = require('../services/razorpayService');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const stream = require('stream');
const { sendReceiptEmailUsingGmail } = require('../utils/email');


exports.registerAdminDonorRequest = async (req, res) => {
  try {
    console.log("DEBUG: Starting AdminDonor registration process");
    
    const {
      orgName,
      AdminDonorType,
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

    console.log("DEBUG: Checking for existing AdminDonor with email:", contactEmail);
    const existing = await AdminDonor.findOne({ contactEmail: contactEmail });
    console.log("DEBUG: Existing AdminDonor check result:", existing);
    if (existing) {
      console.log("DEBUG: Email already exists in database");
      return res.status(400).json({ 
        message: 'Email already registered',
        debug: 'Duplicate email check failed'
      });
    }

    console.log("DEBUG: Hashing password");

    console.log("DEBUG: Creating new AdminDonor object");

    // Generate a temporary password for AdminDonor login (will be hashed by User pre-save hook)
    const tempPassword = crypto.randomBytes(6).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').slice(0,12);

    const AdminDonor = new AdminDonor({
      // Required User fields (provide safe defaults)
      name: contactPerson || orgName,
      email: contactEmail,
      password: tempPassword,
      dob: req.body.dob ? new Date(req.body.dob) : new Date('1900-01-01'),
      gender: req.body.gender || 'other',
      institution: orgName || req.body.institution || 'AdminDonorOrg',

      // AdminDonor-specific fields
      orgName,
      AdminDonorType,
      contactPerson,
      contactEmail,
      website,
      requestMessage,
      approved: false,
      status: 'pending',
    });

    console.log("DEBUG: Saving AdminDonor to database");
    await AdminDonor.save();
    console.log("DEBUG: AdminDonor saved successfully with ID:", AdminDonor._id);

    res.status(201).json({
      message: 'Registration request submitted successfully. Awaiting Super Admin approval.',
      AdminDonor: {
        id: AdminDonor._id,
        orgName: AdminDonor.orgName,
        status: AdminDonor.status,
      },
      debug: 'Registration completed successfully'
    });
  } catch (error) {
    console.error("DEBUG: Error in registerAdminDonorRequest:", error);
    console.error("DEBUG: Error stack:", error.stack);
    res.status(500).json({ 
      message: 'registerAdminDonorRequest Error submitting request', 
      error: error.message,
      debug: {
        errorName: error.name,
        errorCode: error.code,
        errorStack: error.stack
      }
    });
  }
};


exports.Loginadmin = async (req, res) => {
  try {
    const { email, password, googleToken } = req.body;

    if (!email || (!password && !googleToken)) {
      return res.status(400).json({
        success: false,
        error: 'Email and password or google token required'
      });
    }

    // MOCK authentication (replace with DB / OAuth validation later)
    const tokenPayload = {
      email,
      role: 'admin',
      timestamp: Date.now()
    };

    const token = Buffer
      .from(JSON.stringify(tokenPayload))
      .toString('base64');

    return res.status(200).json({
      success: true,
      user: {
        id: `admin-${Date.now()}`,
        email,
        role: 'admin'
      },
      token
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
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
      createdBy // optional AdminDonor id (if authentication not wired)
    } = req.body;

    // ✅ Basic validation
    if (!scholarshipName || !providerName || !description || !applicationDeadline || !scholarshipAmount) {
      return res.status(400).json({
        message:
          'Missing required fields. Required: scholarshipName, providerName, description, applicationDeadline, scholarshipAmount',
      });
    }

    // ✅ Get AdminDonor ID (from auth or body)
    const AdminDonorId = req.user?.id || createdBy;
    if (!AdminDonorId) {
      return res.status(400).json({
        message: 'AdminDonor id (createdBy) is required. Provide it in request body or via authentication.',
      });
    }

    // ✅ Validate AdminDonor existence
    const AdminDonor = await AdminDonor.findById(AdminDonorId);
    if (!AdminDonor) {
      return res.status(404).json({ message: 'AdminDonor not found' });
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
      createdBy: AdminDonor._id,
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

// --- Admin UI helper endpoints used by client app
// GET /admin/getAllRequests
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await VerifierApplication.find({ status: { $in: ['submitted', 'pending'] } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return res.status(200).json({ count: requests.length, requests });
  } catch (err) {
    console.error('getAllRequests error', err);
    return res.status(500).json({ message: 'Failed to fetch requests', error: err.message });
  }
};

// PATCH /admin/requests/:id/approve
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const app = await VerifierApplication.findById(id);
    if (!app) return res.status(404).json({ message: 'Request not found' });
    app.AdminDonorDecision = 'approved';
    app.status = 'approved';
    app.AdminDonorActionAt = new Date();
    // if no approvedAmount set, set to requestedAmount
    if (!app.approvedAmount || app.approvedAmount <= 0) app.approvedAmount = app.requestedAmount || app.estimatedTreatmentCost || 0;
    await app.save();
    return res.status(200).json({ message: 'Request approved', application: app });
  } catch (err) {
    console.error('approveRequest error', err);
    return res.status(500).json({ message: 'Failed to approve request', error: err.message });
  }
};

// PATCH /admin/requests/:id/reject
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const app = await VerifierApplication.findById(id);
    if (!app) return res.status(404).json({ message: 'Request not found' });
    app.AdminDonorDecision = 'rejected';
    app.status = 'rejected';
    app.AdminDonorActionAt = new Date();
    if (remarks) app.AdminDonorRemarks = remarks;
    await app.save();
    return res.status(200).json({ message: 'Request rejected', application: app });
  } catch (err) {
    console.error('rejectRequest error', err);
    return res.status(500).json({ message: 'Failed to reject request', error: err.message });
  }
};

// GET /admin/getApprovedRequests
exports.getApprovedRequests = async (req, res) => {
  try {
    const requests = await VerifierApplication.find({ AdminDonorDecision: { $in: ['approved', 'funded', 'disbursed'] } })
      .sort({ AdminDonorActionAt: -1 })
      .limit(200)
      .lean();
    return res.status(200).json({ count: requests.length, requests });
  } catch (err) {
    console.error('getApprovedRequests error', err);
    return res.status(500).json({ message: 'Failed to fetch approved requests', error: err.message });
  }
};

// POST /admin/requests/:id/disburse
exports.disburseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const app = await VerifierApplication.findById(id);
    if (!app) return res.status(404).json({ message: 'Request not found' });
    const amount = app.approvedAmount || app.requestedAmount || app.estimatedTreatmentCost || 0;
    app.disbursedAmount = amount;
    app.status = 'disbursed';
    app.AdminDonorDecision = 'disbursed';
    app.fundsDisbursedat = new Date();
    app.AdminDonorActionAt = new Date();
    await app.save();
    return res.status(200).json({ message: 'Disbursed', application: app });
  } catch (err) {
    console.error('disburseRequest error', err);
    return res.status(500).json({ message: 'Failed to disburse', error: err.message });
  }
};

// POST /admin/funds
exports.createFund = async (req, res) => {
  try {
    const { name, description, amount, createdBy } = req.body;
    if (!name || !amount) return res.status(400).json({ message: 'name and amount are required' });
    // resolve admin creator
    let creator = null;
    if (createdBy && mongoose.Types.ObjectId.isValid(createdBy)) {
      creator = await AdminDonor.findById(createdBy);
    }
    if (!creator) {
      creator = await AdminDonor.findOne();
    }
    if (!creator) {
      // create a lightweight system admin donor if none exists
      const tmp = new AdminDonor({ name: 'System Admin', email: 'system@local', password: crypto.randomBytes(8).toString('hex'), orgName: 'System', approved: true });
      await tmp.save();
      creator = tmp;
    }

    const scholarship = new Scholarship({
      scholarshipName: name,
      providerName: creator.orgName || creator.name || 'Admin',
      description: description || '',
      scholarshipAmount: Number(amount),
      createdBy: creator._id,
      isActive: true,
    });
    await scholarship.save();
    return res.status(201).json({ message: 'Funding program created', fund: scholarship });
  } catch (err) {
    console.error('createFund error', err);
    return res.status(500).json({ message: 'Failed to create fund', error: err.message });
  }
};

// Hospital verification management for admin
exports.getPendingHospitalVerifications = async (req, res) => {
  try {
    // include unverified and pending records
    const pending = await require('../models/hospital').find({ verificationStatus: { $in: ['pending', 'unverified'] } }).select('-verificationDocuments').sort({ verificationSubmittedAt: -1 }).lean();
    return res.status(200).json({ count: pending.length, hospitals: pending });
  } catch (err) {
    console.error('getPendingHospitalVerifications error', err);
    return res.status(500).json({ message: 'Failed to fetch pending verifications', error: err.message });
  }
};

// Update hospital verification (approve/reject)
// PATCH /admin/hospital-verifications/:hospitalId
exports.updateHospitalVerification = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    // Accept action from multiple possible request shapes (action, status, state, type)
    let { action, remarks, status, state, type } = req.body || {};
    action = action || status || state || type || req.query.action;
    console.log('DEBUG updateHospitalVerification request:', { hospitalId, body: req.body, query: req.query });
    if (!hospitalId) return res.status(400).json({ message: 'hospitalId is required' });
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) return res.status(400).json({ message: 'Invalid hospitalId' });
    // Normalize common action values
    const act = (action || '').toString().toLowerCase();
    let normalizedAction = null;
    const approveVals = new Set(['approve', 'approved', 'verify', 'verified', 'accept', 'accepted']);
    const rejectVals = new Set(['reject', 'rejected']);
    if (approveVals.has(act)) normalizedAction = 'approve';
    if (rejectVals.has(act)) normalizedAction = 'reject';
    if (!normalizedAction) {
      console.warn('updateHospitalVerification - invalid action value received:', action);
      return res.status(400).json({ message: 'Invalid action. Use approve or reject.' });
    }
    const Hospital = require('../models/hospital');
    console.log('DEBUG normalizedAction:', normalizedAction);
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    if (normalizedAction === 'approve') {
      hospital.verificationStatus = 'verified';
      hospital.approved = true;
      hospital.verificationCompletedAt = new Date();
      hospital.verificationRemarks = remarks || 'Approved by admin';
    } else if (normalizedAction === 'reject') {
      hospital.verificationStatus = 'rejected';
      hospital.approved = false;
      hospital.verificationCompletedAt = new Date();
      hospital.verificationRemarks = remarks || 'Rejected by admin';
    }

    await hospital.save();
    return res.status(200).json({ message: 'Hospital verification updated', hospital });
  } catch (err) {
    console.error('updateHospitalVerification error', err);
    return res.status(500).json({ message: 'Failed to update verification', error: err.message });
  }
};

// Get hospital verification details including uploaded documents
exports.getHospitalVerificationDetails = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) return res.status(400).json({ message: 'Invalid hospitalId' });
    const Hospital = require('../models/hospital');
    const hospital = await Hospital.findById(hospitalId).lean();
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    // Map stored document info to public URLs served at /uploads/verifier
    const path = require('path');
    const host = req.get && req.get('host') ? req.get('host') : process.env.HOST || `localhost:${process.env.PORT || 3500}`;
    const protocol = req.protocol || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
    const docs = (hospital.verificationDocuments || []).map(doc => {
      const filename = doc.filename || (doc.path ? path.basename(doc.path) : null);
      const url = filename ? `${protocol}://${host}/uploads/verifier/${filename}` : null;
      return {
        originalname: doc.originalname || filename,
        filename,
        url,
        uploadedAt: doc.uploadedAt || doc.uploadedAt
      };
    });

    // Return hospital info with mapped documents
    hospital.verificationDocuments = docs;
    return res.status(200).json({ hospital });
  } catch (err) {
    console.error('getHospitalVerificationDetails error', err);
    return res.status(500).json({ message: 'Failed to fetch hospital details', error: err.message });
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
      application.AdminDonorDecision = status;
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
      // Also mark AdminDonorDecision as funded and record action time
      try {
        // If payout is successful, mark as disbursed instead of just funded
        if (payoutResp?.status === 'processed' || payoutResp?.status === 'funded') {
          application.AdminDonorDecision = 'disbursed';
          application.status = 'disbursed';
          application.fundsDisbursedat = new Date();
        } else {
          application.AdminDonorDecision = 'funded';
        }
        application.AdminDonorActionAt = new Date();
        // Update fundedraised (store in rupees, add to existing if present)
        const paidPaise = amount || (txnPayload && txnPayload.amount) || 0;
        const paidRupees = Number((paidPaise / 100).toFixed(2));
        application.fundedraised = (Number(application.fundedraised || 0) + paidRupees);
        // Set disbursed amount if successful payout
        if (payoutResp?.status === 'processed' || payoutResp?.status === 'funded') {
          application.disbursedAmount = (Number(application.disbursedAmount || 0) + paidRupees);
        }
      } catch (setErr) {
        console.warn('Could not update AdminDonorDecision/fundedraised on application:', setErr);
      }
      await application.save();
    } catch (appErr) {
      console.error('Failed to update application payout history:', appErr);
    }

    // Send professional receipt for direct payout (if successful)
    if (payoutResp?.status === 'processed' || payoutResp?.status === 'funded') {
      (async function sendPayoutReceipts() {
        try {
          const { generateProfessionalReceipt, generateReceiptNumber } = require('../services/receiptService');
          const { sendPaymentReceipts } = require('../utils/email');

          // Pull latest application with verifier populated for emails
          const appPop = await VerifierApplication.findById(application._id)
            .populate('verifierId', 'contactEmail contactperson institutionname');

          const patientEmail = appPop?.patientemail || appPop?.studentemail || appPop?.student?.email;
          const hospitalEmail = appPop?.payoutDetails?.email || appPop?.verifierId?.contactEmail;

          // Generate receipt number for payout
          const receiptNumber = generateReceiptNumber(txn?._id || payoutResp?.id);

          // Prepare receipt data for payout
          const receiptData = {
            receiptNumber,
            transactionId: String(txn?._id || payoutResp?.id || 'DIRECT_PAYOUT'),
            paymentId: payoutResp?.id || 'N/A',
            applicationNumber: appPop?.ApplicationNo || String(application._id).slice(-8),
            amount: amount || 0, // Amount in paise
            
            // Patient information
            patientName: appPop?.patientname || appPop?.studentname || 'Patient',
            patientEmail: patientEmail || 'N/A',
            emergencyType: appPop?.emergencyType || 'Medical Emergency',
            
            // Hospital information
            hospitalName: appPop?.institutionname || appPop?.verifierId?.institutionname || 'Hospital',
            hospitalEmail: hospitalEmail || 'N/A',
            accountHolderName: appPop?.payoutDetails?.accountHolderName || 'N/A',
            maskedAccountNumber: appPop?.payoutDetails?.accountNumber ? 
              `****${appPop.payoutDetails.accountNumber.slice(-4)}` : 'N/A',
            ifscCode: appPop?.payoutDetails?.ifsc || 'N/A'
          };

          console.log('📧 Generating payout receipt for:', receiptData.receiptNumber);

          // Generate professional PDF receipt
          const pdfBuffer = await generateProfessionalReceipt(receiptData);

          // Send receipts to both patient and hospital
          const emailResults = await sendPaymentReceipts(receiptData, pdfBuffer);

          if (emailResults.success.length > 0) {
            console.log(`✅ Payout receipts sent successfully to: ${emailResults.success.map(r => r.email).join(', ')}`);
          }
          
          if (emailResults.failed.length > 0) {
            console.warn(`⚠️ Failed to send payout receipts to: ${emailResults.failed.map(r => r.email).join(', ')}`);
          }

        } catch (receiptError) {
          console.error('❌ Error sending payout receipts:', receiptError);
        }
      })();
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
        rawResponse: req.body,
      };
      if (adminIdForPaidTxn) newTxnPayload.adminid = adminIdForPaidTxn;
      if (!newTxnPayload.adminid) {
        return res.status(500).json({ message: 'Admin id not found for this application; cannot create transaction record' });
      }
      const newTxn = await Transaction.create(newTxnPayload);

      return res.status(200).json({ message: 'Payment verified', transaction: newTxn });
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
    
    // blockchain integration removed: no block is created for transactions
    
    await txn.save();
    // Mark application as funded (AdminDonor decision) and record action time
    try {
      application.AdminDonorDecision = 'funded';
      application.AdminDonorActionAt = new Date();
      // Record funded amount on application (convert paise -> rupees)
      try {
        const paidPaise = (typeof amount !== 'undefined' && amount) ? amount : (txn && txn.amount ? txn.amount : 0);
        application.fundedraised = Number((paidPaise / 100).toFixed(2));
      } catch (setAmtErr) {
        console.warn('Could not set application.fundedraised:', setAmtErr);
      }
      await application.save();
      console.debug('Application AdminDonorDecision updated to funded for', applicationId);
    } catch (appUpdateErr) {
      console.error('Failed to update application AdminDonorDecision to funded:', appUpdateErr);
    }

    // Send professional receipt emails to patient and hospital (best-effort) with PDF attachment
    (async function sendProfessionalReceipts() {
      try {
        const { generateProfessionalReceipt, generateReceiptNumber } = require('../services/receiptService');
        const { sendPaymentReceipts } = require('../utils/email');

        // Pull latest application with verifier populated for emails
        const appPop = await VerifierApplication.findById(applicationId)
          .populate('verifierId', 'contactEmail contactperson institutionname');

        const patientEmail = appPop?.patientemail || appPop?.studentemail || appPop?.student?.email || (appPop?.studentid && appPop.studentid.email);
        const hospitalEmail = appPop?.payoutDetails?.email || appPop?.verifierId?.contactEmail;

        // Generate receipt number
        const receiptNumber = generateReceiptNumber(txn._id);

        // Prepare receipt data
        const receiptData = {
          receiptNumber,
          transactionId: String(txn._id),
          paymentId: razorpay_payment_id,
          applicationNumber: appPop?.ApplicationNo || String(applicationId).slice(-8),
          amount: txn.amount || 0, // Amount in paise
          
          // Patient information
          patientName: appPop?.patientname || appPop?.studentname || appPop?.student?.name || 'Patient',
          patientEmail: patientEmail || 'N/A',
          emergencyType: appPop?.emergencyType || 'Medical Emergency',
          
          // Hospital information
          hospitalName: appPop?.institutionname || appPop?.verifierId?.institutionname || 'Hospital',
          hospitalEmail: hospitalEmail || 'N/A',
          accountHolderName: appPop?.payoutDetails?.accountHolderName || appPop?.verifierId?.contactperson || 'N/A',
          maskedAccountNumber: appPop?.payoutDetails?.accountNumber ? 
            `****${appPop.payoutDetails.accountNumber.slice(-4)}` : 'N/A',
          ifscCode: appPop?.payoutDetails?.ifsc || 'N/A'
        };

        console.log('📧 Generating professional receipt for:', receiptData.receiptNumber);

        // Generate professional PDF receipt
        const pdfBuffer = await generateProfessionalReceipt(receiptData);

        // Send receipts to both patient and hospital
        const emailResults = await sendPaymentReceipts(receiptData, pdfBuffer);

        if (emailResults.success.length > 0) {
          console.log(`✅ Professional receipts sent successfully to: ${emailResults.success.map(r => r.email).join(', ')}`);
        }
        
        if (emailResults.failed.length > 0) {
          console.warn(`⚠️ Failed to send receipts to: ${emailResults.failed.map(r => r.email).join(', ')}`);
        }

      } catch (receiptError) {
        console.error('❌ Error sending professional receipts:', receiptError);
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

    // Create contact and fund account with Razorpay. If Razorpay is not configured or API fails,
    // fallback to simulated responses (useful for local development).
    let contactResp;
    let faResp;
    try {
      contactResp = await createContact({ name, email, contact, type: 'employee' });
      faResp = await createFundAccount({
        contact_id: contactResp.id,
        account_type: 'bank_account',
        bank_account: {
          name,
          ifsc,
          account_number,
        },
      });
    } catch (rpErr) {
      console.warn('Razorpay contact/fund_account creation failed, falling back to simulated beneficiary:', rpErr && rpErr.message ? rpErr.message : rpErr);
      // Simulate contact + fund account responses
      contactResp = { id: 'contact_sim_' + Date.now(), name, email, contact };
      faResp = { id: 'fa_sim_' + Date.now(), contact_id: contactResp.id, bank_account: { name, ifsc, account_number } };
    }

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


// New: Get paginated applications for an admin (AdminDonor) resolved via adminId stored on applications
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
    const subject = `payment receipt — Application ${applicationId}`;
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
        doc.text(`Payer: ${payerName}`);
        doc.text(`Payer Email: ${studentEmail || 'N/A'}`);
        doc.moveDown();
        doc.text(`Payee : ${payeeName}`);
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

    if (applicationId && mongoose.Types.ObjectId.isValid(applicationId)) filter.applicationId = applicationId;
    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) filter.adminid = adminId;
    if (transferId) filter.transferId = transferId;
    if (paymentId) filter.paymentId = paymentId;
    if (orderId) filter.orderId = orderId;
    if (status) filter.status = status;
    if (beneficiaryId) filter.beneficiaryId = beneficiaryId;

    // Free text query: try matching transferId/paymentId/orderId
    if (q && typeof q === 'string' && q.trim().length > 0) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { transferId: regex },
        { paymentId: regex },
        { orderId: regex },
      ];
    }

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.max(parseInt(limit, 10) || 25, 1);
    const skip = (p - 1) * l;

    // Get transactions without population first
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l);

    // Manually populate applicationId if needed
    const enhancedTransactions = [];
    for (const txn of transactions) {
      const txnObj = txn.toObject();
      
      // Try to get application details if applicationId exists
      if (txnObj.applicationId) {
        try {
          const application = await VerifierApplication.findById(txnObj.applicationId).select(
            'ApplicationNo studentname studentemail patientname patientemail institutionname emergencyType requestedamount payoutDetails'
          );
          if (application) {
            txnObj.applicationId = application;
          }
        } catch (appError) {
          console.log('Could not populate application:', appError.message);
          // Keep the original applicationId as ObjectId
        }
      }

      // Try to get admin details if adminid exists
      if (txnObj.adminid) {
        try {
          const AdminDonor = require('../models/AdminDonor');
          const admin = await AdminDonor.findById(txnObj.adminid).select(
            'orgName contactEmail name email'
          );
          if (admin) {
            txnObj.adminid = admin;
          }
        } catch (adminError) {
          console.log('Could not populate admin:', adminError.message);
          // Keep the original adminid as ObjectId
        }
      }

      // Add payout details if available from transaction or fallback to application
      if (txnObj.payoutDetails) {
        txnObj.payoutDetails = {
          ...txnObj.payoutDetails,
          maskedAccountNumber: txnObj.payoutDetails.accountNumber ? 
            '****' + txnObj.payoutDetails.accountNumber.slice(-4) : undefined
        };
      } else if (txnObj.applicationId && typeof txnObj.applicationId === 'object' && txnObj.applicationId.payoutDetails) {
        // Fallback to application's payout details if transaction doesn't have them
        const appPayoutDetails = txnObj.applicationId.payoutDetails;
        txnObj.payoutDetails = {
          accountHolderName: appPayoutDetails.accountHolderName,
          accountNumber: appPayoutDetails.accountNumber,
          maskedAccountNumber: appPayoutDetails.accountNumber ? 
            '****' + appPayoutDetails.accountNumber.slice(-4) : undefined,
          ifsc: appPayoutDetails.ifsc,
          bankName: appPayoutDetails.bankName,
          email: appPayoutDetails.email,
          phone: appPayoutDetails.phone,
        };
      }
      
      // Add completion timestamps
      if (txnObj.status === 'processed' || txnObj.status === 'paid' || txnObj.status === 'funded') {
        txnObj.completedAt = txnObj.updatedAt;
      }
      if (txnObj.paymentId && txnObj.status !== 'failed') {
        txnObj.paidAt = txnObj.updatedAt;
      }
      
      enhancedTransactions.push(txnObj);
    }

    return res.status(200).json({ 
      total, 
      page: p, 
      limit: l, 
      transactions: enhancedTransactions 
    });
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

// Hospital Verification Management
exports.getPendingHospitalVerifications = async (req, res) => {
  try {
    const Hospital = require('../models/hospital');
    const hospitals = await Hospital.find({ 
      verificationStatus: { $in: ['pending', 'unverified'] }
    }).select(
      'institutionName contactPerson contactEmail hospitalLicenseNumber ' +
      'hospitalAddress emergencyServices verificationSubmittedAt ' + 
      'verificationDocuments verificationStatus website'
    ).sort({ verificationSubmittedAt: -1 });

    res.status(200).json({ 
      count: hospitals.length, 
      hospitals 
    });
  } catch (error) {
    console.error('Error in getPendingHospitalVerifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateHospitalVerification = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { status, remarks } = req.body;
console.log('Updating hospital verification:', hospitalId, status);

    if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) {
      console.log('Invalid hospitalId provided:', hospitalId);
      return res.status(400).json({ message: 'Valid hospitalId is required in URL' });
    }
    if (!['verified', 'rejected'].includes(status)) {
      console.log('Invalid status provided:', status);
      return res.status(400).json({ message: 'Invalid status. Must be verified or rejected.' });
    }

    const Hospital = require('../models/hospital');
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    hospital.verificationStatus = status;
    hospital.verificationCompletedAt = new Date();
    hospital.verificationRemarks = remarks;
    
    // If verified, also set as approved for platform access
    if (status === 'verified') {
      hospital.approved = true;
      hospital.status = 'approved';
    }

    await hospital.save();

    res.status(200).json({ 
      message: `Hospital ${status} successfully`,
      hospital: {
        _id: hospital._id,
        institutionName: hospital.institutionName,
        verificationStatus: hospital.verificationStatus,
        verificationCompletedAt: hospital.verificationCompletedAt
      }
    });
  } catch (error) {
    console.error('Error in updateHospitalVerification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

