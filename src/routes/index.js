const express = require('express');
const router = express.Router();
const templateRoutes = require('./templateRoutes');
const invitationRoutes = require('./invitationRoutes');
const authRoutes = require('./authRoutes');

const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/invitations', invitationRoutes);
router.use('/reseller', require('./resellerRoutes'));
router.use('/admin', adminRoutes);
router.use('/analytics', adminRoutes);

module.exports = router;