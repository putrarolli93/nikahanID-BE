const express = require('express');
const router = express.Router();
const templateRoutes = require('./templateRoutes');
const invitationRoutes = require('./invitationRoutes');

router.use('/templates', templateRoutes);
router.use('/invitations', invitationRoutes);

module.exports = router;