// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const admincontroller = require("../controllers/admincontroller")


// Donor registration, admin login, create scholarship
router.post('/register', admincontroller.registerDonorRequest);
router.post('/login', admincontroller.Loginadmin);
router.post('/createscholarship', admincontroller.createScholarship);
router.get('/getAllApplications/:adminId', admincontroller.getAllApplications);

// Get applications by admin (donor) who created the scholarship
// GET /admin/applications/by-admin/:adminId?page=1&limit=25&status=&scholarshipId=
router.get('/applications/by-admin/:adminId', admincontroller.getApplicationsByAdminId);

// Get single application by id but ensure it belongs to the admin
router.get('/applications/by-admin/:adminId/:applicationId', admincontroller.getApplicationByAdminAndId);


// View all scholarship applications (with optional filters)
// GET /admin/applications?scholarshipId=...&status=...&page=1&limit=25
router.get('/applications', admincontroller.viewAllApplications);

// Get single application details
// GET /admin/applications/:applicationId
router.get('/applications/:applicationId', admincontroller.getApplicationDetails);

// Update a document inside an application (mark verified true and set application status)
// PATCH /admin/applications/:applicationId/documents/:documentId
router.patch('/applications/:applicationId/documents/:documentId', admincontroller.updateApplicationDocumentandapplication);


// Make payout to verifier for a specific application
// PATCH /admin/applications/:applicationId/makepayout
router.patch('/applications/:applicationId/makepayout', admincontroller.makePayoutToVerifier);

// Resend/send receipts (PDF) for an application
// POST /admin/applications/:applicationId/send-receipts
router.post('/applications/:applicationId/send-receipts', admincontroller.resendReceipt);

// Create a Razorpay order for an application (frontend will open checkout)
// POST /admin/applications/:applicationId/create-order
router.post('/applications/:applicationId/create-order', admincontroller.createOrderForApplication);

// Verify payment from Razorpay and mark transaction as paid
// POST /admin/applications/:applicationId/verify-payment
router.post('/applications/:applicationId/verify-payment', admincontroller.verifyPaymentForApplication);

// Search transactions (admin) - flexible filters
// GET /admin/transactions/search?q=&adminId=&applicationId=&status=&page=&limit=
router.get('/transactions/search', admincontroller.searchTransactions);

// GET transactions for a specific admin (donor)
// Example: GET /admin/transactions/admin/:adminId?q=transfer_123&page=1&limit=25
router.get('/transactions/admin/:adminId', admincontroller.getTransactionsByAdminId);

// Create beneficiary (contact + fund_account) for application
// POST /admin/applications/:applicationId/create-beneficiary
router.post('/applications/:applicationId/create-beneficiary', admincontroller.createBeneficiaryForApplication);

module.exports = router;
