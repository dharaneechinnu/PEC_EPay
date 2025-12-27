// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentcontroller');
const upload = require('../middleware/upload');

// 🟢 Public: Student registration & login
router.post('/register', studentController.registerStudent);
router.post('/login', studentController.loginStudent);
// Status by application number (GET) - example: /student/applicationstatus/APP-12345
router.get('/applicationstatus/:applicationNo', studentController.Applicationstatus);
// Also allow query: /student/applicationstatus?applicationNo=...
router.get('/applicationstatus', studentController.Applicationstatus);

// Public scholarships listing
router.get('/scholarships', studentController.getScholarships);

// Patient creates funding request
router.post('/create-funding-request', studentController.createFundingRequest);

// Patient uploads documents (FIR, accident proof, etc.)
router.post('/upload-documents/:requestId', upload.array('documents', 10), studentController.uploadDocuments);

// Get patient's requests
router.get('/my-requests', studentController.getMyRequests);

// Quick status by application id: /patient/requeststatus/:id
router.get('/requeststatus/:id', studentController.getRequestStatusById);

// EMI Routes
router.post('/generate-emi-pdf', studentController.generateEMIPDF);
router.post('/create-emi-payment-order', studentController.createEMIPaymentOrder);
router.post('/verify-emi-payment', studentController.verifyEMIPayment);
router.get('/emi-history/:requestId', studentController.getEMIHistory);

// Test routes
router.get('/test-razorpay', studentController.testRazorpay);

module.exports = router;
