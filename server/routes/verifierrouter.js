// routes/verifierRoutes.js
const express = require('express');
const router = express.Router();
const verifierController = require('../controllers/verifiercontroller');
const upload = require('../middleware/upload');



router.post('/register', verifierController.registerVerifierRequest);
router.post('/login', verifierController.loginVerifier);
router.get('/getallscholarships', verifierController.viewAllScholarships);
// Apply for scholarship with JSON data only (no files)
router.post('/applyscholarship', verifierController.applyForScholarship);
router.get('/viewapplicationbyid', verifierController.viewapplicationbyid);
// Get applications by verifierId or applicationId (supports pagination)
router.get('/getapplicationstatus', verifierController.getApplicationStatus);
// Upload documents for an existing application (form-data with files)
// Use path param for application id: /uploaddocuments/:applicationId
router.post('/uploaddocuments/:applicationId', upload.array('documents', 10), verifierController.uploadDocuments);

module.exports = router;
