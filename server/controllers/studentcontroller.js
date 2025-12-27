const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const VerifierApplication = require('../models/Hospitalapplyform');
const Scholarship = require('../models/GrantingPayment');
const Hospital = require('../models/hospital');
const AdminDonor = require('../models/AdminDonor');
const EMIPayment = require('../models/EMI');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const Razorpay = require('razorpay');
const { verifyGoogleIdToken, generateJwt } = require('../services/authService');
const Transaction = require('../models/transaction');

// ✅ Generate Token
const generateToken = (id) => {
  return generateJwt({ id, role: 'student' });
};

// ✅ Student Registration
exports.registerStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dob,
      gender,
      mobileNo,
      address,
      parentAddress,
      institution,
      classOrYear,
      marksPercentage,
      familyIncome,
      hasIncomeCertificate,
    } = req.body;

    if (!email || !name || !password || !dob || !gender || !institution) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // ✅ Hash password manually
    const hashedPassword = await bcrypt.hash(password, 10);

    const student = new User({
      name,
      email,
      password: hashedPassword, // save hashed password
      dob,
      gender,
      mobileNo,
      address,
      parentAddress,
      institution,
      classOrYear,
      marksPercentage,
      familyIncome,
      hasIncomeCertificate,
    });

    await student.save();

    const token = generateToken(student._id);
    res.status(201).json({
      message: 'Student registered successfully.',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        institution: student.institution,
        verifiedByInstitution: student.verifiedByInstitution,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering student', error: error.message });
  }
};

// ✅ Student Login
exports.loginStudent = async (req, res) => {
const { email, password, googleToken } = req.body;
  if (!email || (!password && !googleToken)) {
    return res.status(400).json({ error: 'Email and password/token required' });
  }
  const token = Buffer.from(JSON.stringify({ email, role: 'patient', timestamp: Date.now() })).toString('base64');
  res.json({ success: true, user: { email, role: 'patient', id: 'patient-' + Math.random() }, token });
};


exports.Applicationstatus = async (req, res) => {
  try {
    // Accept application number from params or query
    const applicationNo = req.params.applicationNo || req.query.applicationNo || req.body.applicationNo;
    if (!applicationNo) return res.status(400).json({ message: 'Application number is required' });

    // Note: model stores the field as `ApplicationNo`
    const application = await VerifierApplication.findOne({ ApplicationNo: applicationNo }).select(
      'ApplicationNo status AdminDonorDecision AdminDonorRemarks AdminDonorActionAt'
    );
    if (!application) return res.status(404).json({ message: 'Application not found' });

    res.status(200).json({
      applicationNo: application.ApplicationNo,
      status: application.status,
      AdminDonorDecision: application.AdminDonorDecision,
      AdminDonorRemarks: application.AdminDonorRemarks,
      AdminDonorActionAt: application.AdminDonorActionAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application status', error: error.message });
  }
};

// GET /student/scholarships - public list for students
exports.getScholarships = async (req, res) => {
  try {
    // Return active scholarships with minimal fields for card layout
    const scholarships = await Scholarship.find({ isActive: true }).select(
      'scholarshipName providerName description scholarshipAmount applicationDeadline'
    );
    res.status(200).json({ scholarships });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scholarships', error: error.message });
  }
};

// Patient creates funding request
exports.createFundingRequest = async (req, res) => {
  try {
    const data = req.body;

    console.log('[FundingRequest] Incoming payload:', data);

    /* =========================
       1️⃣ REQUIRED FIELD CHECK
    ========================== */

    const requiredFields = [
      ['studentname', 'patientname'],
      ['studentemail', 'patientemail'],
      ['gender'],
      ['institutionname'],
      ['familyIncome'],
      ['requestedAmount'],
      ['payoutDetails'],
    ];

    for (const fieldGroup of requiredFields) {
      const isPresent = fieldGroup.some(
        (key) => data[key] !== undefined && data[key] !== null && data[key] !== ''
      );

      if (!isPresent) {
        return res.status(400).json({
          message: `${fieldGroup.join(' / ')} is required`,
        });
      }
    }

    /* =========================
       2️⃣ OPTIONAL SCHOLARSHIP
    ========================== */

    let scholarship = null;
    if (data.scholarshipId) {
      scholarship = await Scholarship.findById(data.scholarshipId);
      if (!scholarship) {
        return res.status(404).json({ message: 'Scholarship not found' });
      }
    }

    /* =========================
       3️⃣ FIND OR CREATE HOSPITAL (VERIFIER)
    ========================== */

    // Resolve hospital (verifier) — require that selected hospital is VERIFIED and approved.
    // Allow selecting by hospitalId (preferred) or by institution name (case-insensitive).
    const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');

    let hospital = null;
    // If frontend provided a hospitalId, validate and prefer it
    if (data.hospitalId && mongoose.Types.ObjectId.isValid(data.hospitalId)) {
      hospital = await Hospital.findOne({ _id: data.hospitalId, verificationStatus: 'verified', approved: true });
    }

    // Fallback: try to match by name (exact case-insensitive)
    if (!hospital && (data.hospitalName || data.institutionname)) {
      const name = data.hospitalName || data.institutionname;
      const regex = new RegExp('^' + escapeRegex(name) + '$', 'i');
      hospital = await Hospital.findOne({ institutionName: { $regex: regex }, verificationStatus: 'verified', approved: true });
    }

    // If still not found, refuse to create request — force patient to pick a verified hospital
    if (!hospital) {
      return res.status(400).json({ message: 'Selected hospital is not verified or available. Please choose a verified hospital.' });
    }

    const verifierId = hospital._id;

    /* =========================
       4️⃣ ADMIN / DONOR CHECK
    ========================== */

    // Resolve AdminDonorid: prefer scholarship.createdBy, then request fields, else find/create a system AdminDonor
    let AdminDonorid = scholarship?.createdBy || data.AdminDonorid || data.adminId;
    if (!AdminDonorid) {
      let creator = await AdminDonor.findOne();
      if (!creator) {
        const tmp = new AdminDonor({ orgName: 'System', AdminDonorType: 'Individual', contactPerson: 'System Admin', contactEmail: 'system@local', approved: true });
        await tmp.save();
        creator = tmp;
      }
      AdminDonorid = creator._id;
    }

    /* =========================
       5️⃣ UNIQUE APPLICATION NUMBER
    ========================== */

    let applicationNo;
    let retries = 0;

    while (retries < 5) {
      const ts = Date.now();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const candidate = `FS_${ts}_${rand}`;

      const exists = await VerifierApplication.findOne({
        ApplicationNo: candidate,
      });

      if (!exists) {
        applicationNo = candidate;
        break;
      }
      retries++;
    }

    if (!applicationNo) {
      return res.status(500).json({
        message: 'Unable to generate unique application number',
      });
    }

    /* =========================
       6️⃣ NORMALIZE & BUILD PAYLOAD
    ========================== */

    const estimatedTreatmentCost = Number(
      data.estimatedTreatmentCost || data.requestedAmount || 0
    );

    // Ensure scholarshipId exists: use provided scholarship, else find an active one or create a default
    let scholarshipIdToUse = scholarship?._id || data.scholarshipId;
    if (!scholarshipIdToUse) {
      let found = await Scholarship.findOne({ isActive: true });
      if (!found) {
        const tmpScholar = new Scholarship({
          scholarshipName: 'Default Emergency Fund',
          providerName: 'System',
          description: 'Auto-created default fund',
          scholarshipAmount: Number(data.requestedAmount) || 0,
          applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
          createdBy: AdminDonorid,
          isActive: true,
        });
        await tmpScholar.save();
        found = tmpScholar;
      }
      scholarshipIdToUse = found._id;
    }

    const applicationPayload = {
      ApplicationNo: applicationNo,
      verifierId,
      scholarshipId: scholarshipIdToUse,
      adminId: scholarship?.createdBy || AdminDonorid || undefined,
      AdminDonorid,

      // Patient → Student mapping
      studentname: data.studentname || data.patientname,
      studentemail: data.studentemail || data.patientemail,
      gender: data.gender,
      institutionname: data.institutionname,
      classoryear: data.classoryear || '',

      // Emergency medical fields
      emergencyType: data.emergencyType || 'other',
      medicalCondition: data.medicalCondition || 'Not specified',
      treatmentRequired: data.treatmentRequired || 'Not specified',
      urgencyLevel: data.urgencyLevel || 'urgent',
      estimatedTreatmentCost,

      // Financials
      familyIncome: Number(data.familyIncome),
      requestedAmount: Number(data.requestedAmount),
      fundedraised: Number(data.fundedraised || 0),

      // Flags
      firstGenGraduate: Boolean(data.firstGenGraduate),
      documents: [],
      remarks: data.remarks || '',

      status: 'submitted',

      // Payout details
      payoutDetails: {
        accountHolderName: data.payoutDetails.accountHolderName,
        accountNumber: data.payoutDetails.accountNumber,
        ifsc: data.payoutDetails.ifsc,
        bankName: data.payoutDetails.bankName,
        email: data.payoutDetails.email,
        phone: data.payoutDetails.phone,
        beneficiaryVerified: false,
      },
    };

    /* =========================
       7️⃣ SAVE APPLICATION
    ========================== */

    const application = await VerifierApplication.create(applicationPayload);

    /* =========================
       8️⃣ RESPONSE
    ========================== */

    return res.status(201).json({
      success: true,
      message: 'Funding request created successfully',
      applicationNo,
      application,
      nextStep: `/patient/upload-documents/${application._id}`,
    });

  } catch (error) {
    console.error('[FundingRequest ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Patient uploads documents
exports.uploadDocuments = async (req, res) => {
  try {
    const applicationId = req.params.requestId;
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: 'Valid applicationId is required' });
    }

    const application = await VerifierApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Parse optional metadata for document types (FIR, accident proof, etc.)
    let metaDocs = [];
    if (req.body.documents && typeof req.body.documents === 'string') {
      try {
        metaDocs = JSON.parse(req.body.documents);
      } catch (e) {
        // ignore invalid JSON
      }
    }

    const newDocuments = files.map((file, idx) => {
      const meta = Array.isArray(metaDocs) ? metaDocs[idx] || {} : {};
      // Auto-detect document type from filename
      let docType = meta.docType || 'Document';
      const fileName = file.originalname.toLowerCase();
      if (fileName.includes('fir')) {
        docType = 'FIR';
      } else if (fileName.includes('accident')) {
        docType = 'Accident Proof';
      } else if (fileName.includes('medical')) {
        docType = 'Medical Document';
      } else if (fileName.includes('report')) {
        docType = 'Medical Report';
      }

      const fileUrl = path.posix.join('/uploads/verifier', file.filename).replace(/\\\\/g, '/');
      return {
        docType,
        fileUrl,
        verified: false,
      };
    });

    application.documents.push(...newDocuments);
    await application.save();

    res.status(200).json({
      message: 'Documents uploaded successfully',
      uploadedDocuments: newDocuments,
      totalDocuments: application.documents.length,
    });
  } catch (error) {
    console.error('Error in uploadDocuments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get patient's requests
exports.getMyRequests = async (req, res) => {
  try {
    const { studentemail, patientemail } = req.query;
    const email = studentemail || patientemail;
    if (!email) {
      return res.status(400).json({ message: 'patientemail is required' });
    }

    const applications = await VerifierApplication.find({ studentemail: email })
      .populate('scholarshipId', 'scholarshipName providerName scholarshipAmount')
      .populate('verifierId', 'institutionName contactEmail')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Error in getMyRequests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get request status by application id for patient quick check
exports.getRequestStatusById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: 'application id is required' });

    // Accept either Mongo ObjectId or ApplicationNo (e.g., FS_...)
    let application = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      application = await VerifierApplication.findById(id).lean();
    }
    if (!application) {
      application = await VerifierApplication.findOne({ ApplicationNo: id }).lean();
    }
    if (!application) return res.status(404).json({ message: 'Application not found' });

    let payoutStatus = 'pending';
    if (application.payoutDetails && application.payoutDetails.beneficiaryId) payoutStatus = 'beneficiary_created';
    const appIdForTxn = application._id;
    const paidTxn = await Transaction.findOne({ applicationId: appIdForTxn, status: { $in: ['paid', 'processed', 'funded', 'disbursed'] } });
    if (paidTxn) payoutStatus = 'paid';

    return res.status(200).json({ requestId: application.ApplicationNo || application._id, status: application.status, payoutStatus, application });
  } catch (error) {
    console.error('Error in getRequestStatusById:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_epPmzNozAIcJcC',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'J1VLfAsjxS050ZN7Jco2SCv5'
});

// Generate EMI PDF Schedule
exports.generateEMIPDF = async (req, res) => {
  try {
    const { requestId, emiData } = req.body;

    if (!requestId || !emiData) {
      return res.status(400).json({ message: 'Request ID and EMI data are required' });
    }

    const application = await VerifierApplication.findById(requestId).lean();
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EMI_Schedule_${application.ApplicationNo}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // PDF Content
    doc.fontSize(20).text('EMI Payment Schedule', 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    
    doc.text(`Application No: ${application.ApplicationNo}`, 50, 110);
    doc.text(`Patient Name: ${application.patientname}`, 50, 130);
    doc.text(`Medical Condition: ${application.medicalCondition}`, 50, 150);
    
    doc.text(`Principal Amount: ₹${emiData.principal.toLocaleString()}`, 50, 180);
    doc.text(`Monthly EMI: ₹${emiData.emi.toLocaleString()}`, 50, 200);
    doc.text(`Total Months: ${emiData.months}`, 50, 220);
    doc.text(`Monthly Interest Rate: ${emiData.monthlyInterestRate}%`, 50, 240);
    doc.text(`Total Amount Payable: ₹${emiData.totalAmount.toLocaleString()}`, 50, 260);
    doc.text(`Total Interest: ₹${emiData.interest.toLocaleString()}`, 50, 280);

    // EMI Schedule Table
    doc.text('EMI Schedule:', 50, 320);
    
    let yPosition = 350;
    doc.text('Month', 50, yPosition);
    doc.text('Due Date', 150, yPosition);
    doc.text('EMI Amount', 250, yPosition);
    doc.text('Principal', 350, yPosition);
    doc.text('Interest', 450, yPosition);
    
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    for (let month = 1; month <= emiData.months; month++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + month);
      
      const remainingBalance = emiData.principal - ((month - 1) * (emiData.emi - (emiData.principal * emiData.monthlyInterestRate / 100)));
      const interestComponent = remainingBalance * (emiData.monthlyInterestRate / 100);
      const principalComponent = emiData.emi - interestComponent;
      
      doc.text(month.toString(), 50, yPosition);
      doc.text(dueDate.toLocaleDateString(), 150, yPosition);
      doc.text(`₹${emiData.emi.toLocaleString()}`, 250, yPosition);
      doc.text(`₹${Math.round(principalComponent).toLocaleString()}`, 350, yPosition);
      doc.text(`₹${Math.round(interestComponent).toLocaleString()}`, 450, yPosition);
      
      yPosition += 20;
      
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    }

    doc.end();

  } catch (error) {
    console.error('Error generating EMI PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
};

// Create EMI Payment Order with Razorpay
exports.createEMIPaymentOrder = async (req, res) => {
  try {
    console.log('Creating EMI payment order:', req.body);
    
    // Check Razorpay credentials first
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials');
      return res.status(500).json({ 
        message: 'Payment service not configured properly',
        error: 'Missing Razorpay credentials'
      });
    }

    const { requestId, amount } = req.body;

    // Validate input
    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    // Find and validate application
    const application = await VerifierApplication.findById(requestId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if application is eligible for EMI
    const eligibleStatuses = ['funded', 'disbursed'];
    if (!eligibleStatuses.includes(application.status?.toLowerCase())) {
      return res.status(400).json({ 
        message: `EMI not available for status: ${application.status}. Must be funded or disbursed.` 
      });
    }

    // Validate amount doesn't exceed approved amount
    if (amount > application.approvedAmount) {
      return res.status(400).json({ 
        message: `EMI amount (₹${amount}) cannot exceed approved amount (₹${application.approvedAmount})` 
      });
    }

    // Create unique receipt ID
    const receiptId = `emi_${requestId.slice(-8)}_${Date.now()}`;
    
    console.log('Creating Razorpay order with:', {
      amount: amount * 100,
      currency: 'INR',
      receipt: receiptId
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Amount in paise, ensure integer
      currency: 'INR',
      receipt: receiptId,
      notes: {
        requestId: requestId,
        applicationNo: application.ApplicationNo,
        patientEmail: application.studentemail || application.patientemail,
        medicalCondition: application.medicalCondition,
        type: 'EMI_PAYMENT'
      },
      payment_capture: true // Auto capture payment
    });

    console.log('Razorpay order created:', {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });

    // Validate order creation
    if (!order || !order.id) {
      throw new Error('Failed to create Razorpay order - no order ID returned');
    }

    const responseData = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      applicationNo: application.ApplicationNo,
      success: true
    };

    console.log('Sending order response:', responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error creating EMI payment order:', error);
    
    // Handle Razorpay specific errors
    if (error.error && error.error.code) {
      return res.status(400).json({ 
        message: 'Razorpay error: ' + error.error.description,
        code: error.error.code
      });
    }

    res.status(500).json({ 
      message: 'Error creating payment order', 
      error: error.message 
    });
  }
};

// Verify EMI Payment
exports.verifyEMIPayment = async (req, res) => {
  try {
    console.log('=== EMI Payment Verification Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);
    
    const { requestId, paymentId, orderId, signature, amount } = req.body;

    // Log each field individually
    console.log('Field validation:');
    console.log('- requestId:', requestId);
    console.log('- paymentId:', paymentId);
    console.log('- orderId:', orderId);
    console.log('- signature:', signature);
    console.log('- amount:', amount);

    // Validate required fields with detailed messages
    if (!requestId) {
      console.log('❌ Missing requestId');
      return res.status(400).json({ 
        message: 'Request ID is required',
        field: 'requestId',
        received: requestId
      });
    }
    if (!paymentId) {
      console.log('❌ Missing paymentId');
      return res.status(400).json({ 
        message: 'Payment ID is required',
        field: 'paymentId',
        received: paymentId
      });
    }
    if (!orderId) {
      console.log('❌ Missing orderId');
      return res.status(400).json({ 
        message: 'Order ID is required',
        field: 'orderId',
        received: orderId,
        hint: 'Make sure Razorpay returns razorpay_order_id'
      });
    }
    if (!signature) {
      console.log('❌ Missing signature');
      return res.status(400).json({ 
        message: 'Payment signature is required',
        field: 'signature',
        received: signature
      });
    }

    console.log('✅ All required fields present');

    // Verify payment signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('Signature verification:');
    console.log('- Body string:', body);
    console.log('- Expected signature:', expectedSignature);
    console.log('- Received signature:', signature);
    console.log('- Signatures match:', expectedSignature === signature);
    console.log('Received:', signature);
    console.log('Body string:', body);

    if (expectedSignature !== signature) {
      console.log('Signature verification failed');
      return res.status(400).json({ 
        message: 'Payment signature verification failed',
        expected: expectedSignature,
        received: signature
      });
    }

    const application = await VerifierApplication.findById(requestId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('Found application:', application.ApplicationNo);

    // Check if payment already exists
    const existingPayment = await EMIPayment.findOne({ paymentId: paymentId });
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    // Get patientId from multiple sources: application, request body, or JWT token
    let patientId = application.studentid;
    if (!patientId && req.body.patientId) {
      patientId = req.body.patientId;
    }
    if (!patientId && req.user && req.user.id) {
      patientId = req.user.id;
    }
    
    // Get patient email from multiple sources
    const patientEmail = application.studentemail || application.patientemail || req.body.patientEmail || (req.user && req.user.email) || 'unknown@email.com';
    
    console.log('Patient info:', { patientId, patientEmail });
    
    // Save EMI payment record
    const emiPayment = new EMIPayment({
      requestId: requestId,
      patientId: patientId || undefined, // Will be undefined if not found (now optional)
      patientEmail: patientEmail,
      principalAmount: application.approvedAmount,
      emiAmount: amount || 0,
      totalMonths: 12, // Default, can be dynamic
      paymentId: paymentId,
      orderId: orderId,
      signature: signature,
      status: 'successful',
      dueDate: new Date(),
      paidDate: new Date()
    });

    await emiPayment.save();
    console.log('EMI payment saved:', emiPayment._id);

    // Update application with payment info
    if (!application.emiPayments) {
      application.emiPayments = [];
    }
    if (!application.totalEMIPaid) {
      application.totalEMIPaid = 0;
    }
    
    application.emiPayments.push(emiPayment._id);
    application.totalEMIPaid += (amount || 0);
    application.emiStatus = 'active';
    await application.save();

    console.log('Application updated with EMI payment');

    res.status(200).json({
      message: 'EMI payment verified and recorded successfully',
      paymentId: paymentId,
      emiPaymentId: emiPayment._id,
      totalPaid: application.totalEMIPaid
    });

  } catch (error) {
    console.error('Error verifying EMI payment:', error);
    res.status(500).json({ 
      message: 'Error verifying payment', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get EMI Payment History
exports.getEMIHistory = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const emiPayments = await EMIPayment.find({ requestId: requestId })
      .sort({ currentMonth: 1, createdAt: 1 });

    const application = await VerifierApplication.findById(requestId).select('ApplicationNo patientname approvedAmount');

    res.status(200).json({
      application: application,
      emiPayments: emiPayments,
      totalPayments: emiPayments.length,
      totalPaid: emiPayments.reduce((sum, payment) => 
        payment.status === 'successful' ? sum + payment.emiAmount : sum, 0
      )
    });

  } catch (error) {
    console.error('Error fetching EMI history:', error);
    res.status(500).json({ message: 'Error fetching EMI history', error: error.message });
  }
};

// Test Razorpay connection
exports.testRazorpay = async (req, res) => {
  try {
    // Test creating a minimal order
    const testOrder = await razorpay.orders.create({
      amount: 100, // ₹1 in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
      notes: {
        test: true
      }
    });

    res.status(200).json({
      message: 'Razorpay connection successful',
      testOrder: {
        id: testOrder.id,
        amount: testOrder.amount,
        currency: testOrder.currency,
        status: testOrder.status
      },
      credentials: {
        key_id: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing',
        key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing'
      }
    });

  } catch (error) {
    console.error('Razorpay test failed:', error);
    res.status(500).json({
      message: 'Razorpay connection failed',
      error: error.message,
      credentials: {
        key_id: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Missing',
        key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Missing'
      }
    });
  }
};
