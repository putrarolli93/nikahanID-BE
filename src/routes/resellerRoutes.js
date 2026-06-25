const express = require('express');
const router = express.Router();
const resellerController = require('../controllers/resellerController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadProof = require('../middleware/proofUploadMiddleware');

// Public route to check promo code validity during checkout
router.get('/check-promo/:code', authMiddleware, resellerController.checkPromo);

// Protected routes for reseller dashboard
router.get('/dashboard', authMiddleware, resellerController.getDashboard);
router.post('/update-profile', authMiddleware, resellerController.updateProfile);
router.post('/withdraw', authMiddleware, resellerController.withdraw);

// Reset komisi (Admin API)
router.post('/:id/reset-commission', uploadProof.single('proof_image'), resellerController.resetCommission);

// Get detail reseller (Admin API)
router.get('/:id/detail', resellerController.getResellerDetail);

module.exports = router;
