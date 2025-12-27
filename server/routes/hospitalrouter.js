// routes/hospitalrouter.js - Emergency Medical Credit Platform
const express = require('express');
const router = express.Router();
const verifierController = require('../controllers/Hospitalcontroller'); // Hospital controller (reusing verifier logic)
const upload = require('../middleware/upload');



// Hospital registration with emergency credit platform
router.post('/register', verifierController.registerVerifierRequest);

// Hospital authentication
router.post('/login', verifierController.loginVerifier);

// Emergency Credit Request Management
router.get('/emergency-credit-options', verifierController.viewAllScholarships); // View available credit products

// Initiate emergency credit request for patient treatment
router.post('/emergency-credit-request', verifierController.applyForScholarship);

// Check emergency credit request status
router.get('/credit-request/:requestId', verifierController.viewapplicationbyid);

// Get all credit requests by hospital (with pagination)
router.get('/credit-requests', verifierController.getApplicationStatus);

// Upload patient documents, medical records for credit approval
router.post('/upload-medical-docs/:requestId', upload.array('documents', 10), verifierController.uploadDocuments);

// Emergency Credit Workflow Endpoints
router.get('/credit-status/:requestId', verifierController.getApplicationStatus);
router.post('/credit-disbursement-confirm/:requestId', verifierController.applyForScholarship);
router.get('/repayment-schedule/:requestId', verifierController.viewapplicationbyid);

module.exports = router;
