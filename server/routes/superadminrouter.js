// routes/superAdminRoutes.js
const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superadmimcontroller');

// ✅ Middleware: Only Super Admin can access these routes
//    verifyToken → checks valid JWT
//    authorizeRoles('super_admin') → allows only super admin role access



// 🟢 2️⃣ Review Donor Request (Approve / Reject)
router.put(
  '/review-donor/:id',
 
  superAdminController.reviewDonorRequest
);
router.put(
  '/review-verifier/:id',
 
  superAdminController.reviewVerifierRequest
);

// List pending donors and verifiers
router.get('/pending-donors', superAdminController.listPendingDonors);
router.get('/pending-verifiers', superAdminController.listPendingVerifiers);


module.exports = router;
