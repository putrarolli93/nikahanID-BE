const express = require('express');
const router = express.Router();
const templateRoutes = require('./templateRoutes');
const invitationRoutes = require('./invitationRoutes');
const authRoutes = require('./authRoutes');

router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/invitations', invitationRoutes);
router.use('/reseller', require('./resellerRoutes'));

module.exports = router;