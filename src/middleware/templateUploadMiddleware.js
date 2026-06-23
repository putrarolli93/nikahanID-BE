const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/templates';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadTemplate = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('Hanya diperbolehkan mengunggah gambar (jpg, png, webp)'));
  }
});

// Expose fields upload for thumbnail, preview, and preview_mobile
// Menerima kedua nama: 'preview' atau 'preview_url', 'preview_mobile' atau 'preview_url_mobile'
module.exports = uploadTemplate.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'preview', maxCount: 1 },
  { name: 'preview_url', maxCount: 1 },
  { name: 'preview_mobile', maxCount: 1 },
  { name: 'preview_url_mobile', maxCount: 1 }
]);
