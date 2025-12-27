// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentcontroller');

// 🟢 Public: Student registration & login
router.post('/register', studentController.registerStudent);
router.post('/login', studentController.loginStudent);
// Status by application number (GET) - example: /student/applicationstatus/APP-12345
router.get('/applicationstatus/:applicationNo', studentController.Applicationstatus);
// Also allow query: /student/applicationstatus?applicationNo=...
router.get('/applicationstatus', studentController.Applicationstatus);

// Public scholarships listing
router.get('/scholarships', studentController.getScholarships);


module.exports = router;
