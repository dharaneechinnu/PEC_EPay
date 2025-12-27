const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const VerifierApplication = require('../models/Hospitalapplyform');
const Scholarship = require('../models/GrantingPayment');
const Hospital = require('../models/hospital');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const { verifyGoogleIdToken, generateJwt } = require('../services/authService');

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

    // Required fields (keep minimal so patient can raise request easily)
    const required = ['scholarshipId', 'studentname', 'studentemail', 'gender', 'institutionname', 'familyIncome', 'requestedAmount', 'payoutDetails'];
    for (const f of required) {
      if (!data[f]) return res.status(400).json({ message: `${f} is required` });
    }

    if (!mongoose.Types.ObjectId.isValid(data.scholarshipId)) {
      return res.status(400).json({ message: 'Invalid scholarshipId' });
    }

    const scholarship = await Scholarship.findById(data.scholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

    // Find or create a hospital/verifier
    // Try to find by institution name, or get first approved hospital, or create a placeholder
    let verifierId = null;
    if (data.hospitalName || data.institutionname) {
      const hospitalName = data.hospitalName || data.institutionname;
      let hospital = await Hospital.findOne({ institutionName: hospitalName, approved: true });
      if (!hospital) {
        hospital = await Hospital.findOne({ approved: true }); // Get any approved hospital
      }
      if (hospital) {
        verifierId = hospital._id;
      }
    }

    // If still no verifier, create a system placeholder or use first available
    if (!verifierId) {
      let hospital = await Hospital.findOne({ approved: true });
      if (!hospital) {
        // Create a system placeholder hospital if none exists
        hospital = new Hospital({
          institutionName: data.institutionname || 'System Hospital',
          institutionType: 'hospital',
          institutionCode: 'SYS-' + Date.now(),
          contactEmail: 'system@epay.com',
          contactPerson: 'System Admin',
          approved: true,
          status: 'approved',
        });
        await hospital.save();
      }
      verifierId = hospital._id;
    }

    // Get AdminDonorid from scholarship
    const AdminDonorid = scholarship.createdBy || data.AdminDonorid;
    if (!AdminDonorid) {
      return res.status(400).json({ message: 'AdminDonorid is required' });
    }

    // Generate ApplicationNo
    let applicationNo;
    for (let attempt = 0; attempt < 5; attempt++) {
      const ts = new Date().toISOString().replace(/[-:.TZ]/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      applicationNo = `FS_${ts}_${rand}`;
      const exists = await VerifierApplication.findOne({ ApplicationNo: applicationNo });
      if (!exists) break;
      applicationNo = undefined;
    }
    if (!applicationNo) {
      return res.status(500).json({ message: 'Could not generate unique ApplicationNo, try again' });
    }

    // Ensure new mandatory emergency fields on model are populated with safe defaults
    const estimatedCost = Number(
      typeof data.estimatedTreatmentCost !== 'undefined' && data.estimatedTreatmentCost !== null
        ? data.estimatedTreatmentCost
        : data.requestedAmount || 0
    );

    const applicationPayload = {
      ApplicationNo: applicationNo,
      verifierId,
      scholarshipId: data.scholarshipId,
      adminId: scholarship.createdBy || undefined,
      AdminDonorid,
      studentname: data.studentname,
      studentemail: data.studentemail,
      gender: data.gender,
      institutionname: data.institutionname,
      classoryear: data.classoryear || '',
      // Emergency medical fields (use defaults so request doesn't fail)
      emergencyType: data.emergencyType || 'other',
      medicalCondition: data.medicalCondition || 'Not specified',
      treatmentRequired: data.treatmentRequired || 'Not specified',
      urgencyLevel: data.urgencyLevel || 'urgent',
      estimatedTreatmentCost: estimatedCost,
      familyIncome: Number(data.familyIncome),
      fundedraised: Number(data.fundedraised || data.requestedAmount || 0),
      requestedAmount: Number(data.requestedAmount),
      firstGenGraduate: data.firstGenGraduate || false,
      documents: [],
      remarks: data.remarks || '',
      status: 'submitted',
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

    const app = new VerifierApplication(applicationPayload);
    await app.save();

    res.status(201).json({
      message: 'Funding request created successfully',
      application: app,
      applicationNo,
      note: 'You can now upload documents using /Patient/upload-documents/' + app._id,
    });
  } catch (error) {
    console.error('Error in createFundingRequest:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    const { studentemail } = req.query;
    if (!studentemail) {
      return res.status(400).json({ message: 'studentemail is required' });
    }

    const applications = await VerifierApplication.find({ studentemail })
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
