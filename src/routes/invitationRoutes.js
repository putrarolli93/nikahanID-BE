const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const upload = require('../middleware/uploadMiddleware');
const uploadProfile = require('../middleware/brideGroomUploadMiddleware'); // Impor middleware baru

// Endpoint untuk mengambil data undangan berdasarkan slug
router.get('/:slug', invitationController.getBySlug);

// Endpoint untuk upload galeri/moments
router.post('/:weddingId/moments', upload.array('photos', 10), invitationController.uploadMoments);

// Endpoint untuk membuat atau memperbarui data mempelai (bride/groom)
router.put('/:weddingId/bride-groom/:type', uploadProfile.single('photo'), invitationController.upsertBrideGroom);

module.exports = router;