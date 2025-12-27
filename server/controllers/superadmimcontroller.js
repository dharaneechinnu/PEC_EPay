const Verifier = require('../models/verifier');
const Donor = require('../models/donor');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const PASS = process.env.PASS;

// ------------------ Helper: Generate Credentials ------------------
function generateCredentials(name) {
  const rnd = crypto.randomBytes(3).toString('hex'); // 6 random chars
  const safeName = (name || 'user').toString().toLowerCase();
  const username = `${safeName}${rnd}`;
  const password = crypto
    .randomBytes(6)
    .toString('base64')
    .replace(/\+/g, 'A')
    .replace(/\//g, 'B')
    .slice(0, 12);
  return { username, password };
}

// ------------------ Helper: Send Credentials Email ------------------
async function sendCredentialsEmail({ to, name, username, password, role }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "dharaneedharanchinnusamy@gmail.com",
      pass: PASS,
    },
  });

  const mailOptions = {
    from: "dharaneedharanchinnusamy@gmail.com",
    to,
    subject: "🎉 Congratulations! Your Account Credentials",
    text: `Hello ${name},

Your ${role} account has been successfully approved! Here are your login credentials:

Username: ${username}
Password: ${password}

(Please change your password after your first login.)

Best regards,
The Scholarship Platform Team`,
  };

  return transporter.sendMail(mailOptions);
}

// ------------------ Review Donor Request ------------------
exports.reviewDonorRequest = async (req, res) => {
  try {
    const { status } = req.body;

    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    donor.status = status;
    donor.approved = status === 'approved';

    if (status === 'approved') {
      const { username, password } = generateCredentials(donor.orgName);

      // ✅ Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      donor.username = username;
      donor.password = hashedPassword;

      await donor.save();

      // ✅ Send credentials email with the plain password
      await sendCredentialsEmail({
        to: donor.contactEmail,
        name: donor.contactPerson || donor.orgName || "Donor",
        username,
        password,
        role: "Donor",
      });

      return res.status(200).json({ message: "Donor approved, credentials saved & emailed", donor });
    } else {
     
      return res.status(200).json({ message: "Donor request rejected", donor });
    }
  } catch (error) {
    console.error("Error reviewing donor:", error);
    res.status(500).json({ message: "Error reviewing donor request", error: error.message });
  }
};

// ------------------ Review Verifier Request ------------------
exports.reviewVerifierRequest = async (req, res) => {
  try {
    const { status } = req.body;

    const verifier = await Verifier.findById(req.params.id);
    if (!verifier) return res.status(404).json({ message: 'Verifier not found' });

    verifier.status = status;
    verifier.approved = status === 'approved';

    if (status === 'approved') {
      const { username, password } = generateCredentials(verifier.Inititutename);

      // ✅ Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      verifier.username = username;
      verifier.password = hashedPassword;

      await verifier.save();

      // ✅ Send credentials email
      await sendCredentialsEmail({
        to: verifier.contactEmail,
        name: verifier.contactperson || verifier.contactEmail || "Verifier",
        username,
        password,
        role: "Verifier",
      });

      return res.status(200).json({ message: "Verifier approved, credentials saved & emailed", verifier });
    } else {
    
      return res.status(200).json({ message: "Verifier request rejected", verifier });
    }
  } catch (error) {
    console.error("Error reviewing verifier:", error);
    res.status(500).json({ message: "Error reviewing verifier request", error: error.message });
  }
};

// List pending donor requests (paginated)
exports.listPendingDonors = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 25, 1);
    const skip = (page - 1) * limit;

    const filter = { status: 'pending' };
    const [total, donors] = await Promise.all([
      Donor.countDocuments(filter),
      Donor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({ total, page, limit, donors });
  } catch (error) {
    console.error('Error in listPendingDonors:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// List pending verifier requests (paginated)
exports.listPendingVerifiers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 25, 1);
    const skip = (page - 1) * limit;

    const filter = { status: 'pending' };
    const [total, verifiers] = await Promise.all([
      Verifier.countDocuments(filter),
      Verifier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.status(200).json({ total, page, limit, verifiers });
  } catch (error) {
    console.error('Error in listPendingVerifiers:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
