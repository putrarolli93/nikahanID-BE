const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public tracking endpoint
router.post('/track', adminController.trackPageView);

// Protected Admin routes
router.get('/analytics', authMiddleware, adminMiddleware, adminController.getAnalyticsSummary);
router.get('/users', authMiddleware, adminMiddleware, adminController.getUsersList);

module.exports = router;
