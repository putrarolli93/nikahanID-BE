const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/music';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const { weddingId } = req.params;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `music-${weddingId || 'inv'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadMusic = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // Limit 15MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (ext === '.mp3' || mime === 'audio/mpeg' || mime === 'audio/mp3') {
      return cb(null, true);
    }
    cb(new Error('Hanya diperbolehkan mengunggah file musik format MP3 (.mp3)'));
  }
});

module.exports = uploadMusic;
