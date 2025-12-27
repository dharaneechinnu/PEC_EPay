// routes/hospitalrouter.js - Emergency Medical Credit Platform
const express = require('express');
const router = express.Router();
const verifierController = require('../controllers/Hospitalcontroller'); // Hospital controller (reusing verifier logic)
const upload = require('../middleware/upload');



// Hospital registration with emergency credit platform
router.post('/register', verifierController.registerHospital);

// Hospital authentication
router.post('/login', verifierController.loginHospital);

// Emergency Credit Request Management
router.get('/emergency-credit-options', verifierController.listGrantingPayments); // View available credit products

// Initiate emergency credit request for patient treatment
router.post('/emergency-credit-request', verifierController.createEmergencyRequest);

// Check emergency credit request status
router.get('/credit-request/:requestId', verifierController.getRequestById);

// Get all credit requests by hospital (with pagination)
router.get('/credit-requests', verifierController.getRequestStatus);

// Upload patient documents, medical records for credit approval
router.post('/upload-medical-docs/:requestId', upload.array('documents', 10), verifierController.uploadMedicalDocs);

// Patient upload documents (FIR, accident proof, etc.) - Alias for upload-medical-docs
router.post('/upload-patient-docs/:requestId', upload.array('documents', 10), verifierController.uploadMedicalDocs);

// Emergency Credit Workflow Endpoints
router.get('/credit-status/:requestId', verifierController.getRequestStatus);
router.post('/credit-disbursement-confirm/:requestId', verifierController.createEmergencyRequest);
router.get('/repayment-schedule/:requestId', verifierController.getRequestById);

module.exports = router;
