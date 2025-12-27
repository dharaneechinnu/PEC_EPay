const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const verifierApplication = require('../models/Hospitalapplyform');
const Scholarship = require('../models/GrantingPayment');
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
    const application = await verifierApplication.findOne({ ApplicationNo: applicationNo }).select(
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
