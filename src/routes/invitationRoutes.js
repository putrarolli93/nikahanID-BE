const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');
const upload = require('../middleware/uploadMiddleware');
const uploadProfile = require('../middleware/brideGroomUploadMiddleware'); // Impor middleware baru
const uploadStory = require('../middleware/storyUploadMiddleware'); // Impor middleware love stories
const authMiddleware = require('../middleware/authMiddleware'); // Impor auth middleware
const uploadAvatar = require('../middleware/avatarUploadMiddleware');
const uploadMusic = require('../middleware/musicUploadMiddleware');

// Endpoint untuk mengambil default avatars (public)
router.get('/default-avatars', invitationController.getDefaultAvatars);

// Endpoint untuk mengambil daftar lagu default (public)
router.get('/default-music', invitationController.getDefaultMusic);

// Endpoint untuk menambah lagu ke daftar default (upload MP3)
router.post('/default-music', uploadMusic.single('music'), invitationController.addDefaultMusic);

// Endpoint untuk upload MP3 personal (return URL saja, tidak masuk global list)
router.post('/music/upload', uploadMusic.single('music'), invitationController.uploadMusicFile);

// Endpoint untuk default ucapan & doa
router.get('/default-blessings', invitationController.getDefaultBlessings);
router.post('/default-blessings', invitationController.addDefaultBlessing);

// Endpoint untuk default kutipan footer
router.get('/default-quotes', invitationController.getDefaultQuotes);
router.post('/default-quotes', invitationController.addDefaultQuote);

// Endpoint untuk default kutipan sampul (cover quote)
router.get('/default-cover-quotes', invitationController.getDefaultCoverQuotes);
router.post('/default-cover-quotes', invitationController.addDefaultCoverQuote);

// Endpoint untuk mengunggah avatar default baru
router.post('/default-avatars', uploadAvatar.single('photo'), invitationController.uploadDefaultAvatar);

// Endpoint untuk mengambil data undangan berdasarkan slug
router.get('/:slug', invitationController.getBySlug);

// Endpoint untuk mengirim ucapan/doa/kehadiran tamu (public)
router.post('/:weddingId/comments', invitationController.addComment);

// Endpoint untuk membuat draft baru
router.post('/', authMiddleware, invitationController.createDraft);

// Endpoint untuk upload galeri/moments
router.post('/:weddingId/moments', upload.array('photos', 10), invitationController.uploadMoments);

// Endpoint untuk membuat atau memperbarui data mempelai (bride/groom)
router.put('/:weddingId/bride-groom/:type', uploadProfile.single('photo'), invitationController.upsertBrideGroom);

// Endpoint untuk update jadwal acara
router.put('/:weddingId/event-schedules', authMiddleware, invitationController.updateSchedules);

// Endpoint untuk update quotes (kutipan)
router.put('/:weddingId/quotes', authMiddleware, invitationController.updateQuotes);

// Endpoint untuk update blessings (doa/ucapan)
router.put('/:weddingId/blessings', authMiddleware, invitationController.updateBlessings);

// Endpoint untuk update music (musik latar)
router.put('/:weddingId/music', authMiddleware, invitationController.updateMusic);

// Endpoint untuk update gift info & bank accounts
router.put('/:weddingId/gifts', authMiddleware, invitationController.updateGifts);

// Endpoint untuk love stories (timeline perjalanan cinta)
router.post('/:weddingId/love-stories', uploadStory.single('photo'), invitationController.addLoveStory);
router.put('/love-stories/:id', uploadStory.single('photo'), invitationController.updateLoveStory);
router.delete('/love-stories/:id', invitationController.deleteLoveStory);

module.exports = router;