const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const upload = require('../middleware/uploadMiddleware');
const uploadProfile = require('../middleware/brideGroomUploadMiddleware'); // Impor middleware baru
const uploadStory = require('../middleware/storyUploadMiddleware'); // Impor middleware love stories

// Endpoint untuk mengambil data undangan berdasarkan slug
router.get('/:slug', invitationController.getBySlug);

// Endpoint untuk upload galeri/moments
router.post('/:weddingId/moments', upload.array('photos', 10), invitationController.uploadMoments);

// Endpoint untuk membuat atau memperbarui data mempelai (bride/groom)
router.put('/:weddingId/bride-groom/:type', uploadProfile.single('photo'), invitationController.upsertBrideGroom);

// Endpoint untuk love stories (timeline perjalanan cinta)
router.post('/:weddingId/love-stories', uploadStory.single('photo'), invitationController.addLoveStory);
router.put('/love-stories/:id', uploadStory.single('photo'), invitationController.updateLoveStory);
router.delete('/love-stories/:id', invitationController.deleteLoveStory);

module.exports = router;