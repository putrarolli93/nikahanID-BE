const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { errorResponse } = require('../utils/responseHelper');

// Middleware untuk memproses validasi input
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation Error', 400, errors.array());
  }
  next();
};

// Route: Register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nama wajib diisi'),
    body('email').trim().isEmail().withMessage('Format email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('phone').optional({ checkFalsy: true }).trim().isMobilePhone('any').withMessage('Format nomor telepon tidak valid'),
    validate
  ],
  authController.register
);

// Route: Login
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Format email tidak valid'),
    body('password').notEmpty().withMessage('Password wajib diisi'),
    validate
  ],
  authController.login
);

// Route: Get Profile (Me)
router.get('/me', authMiddleware, authController.me);

// Route: Change Password
router.put(
  '/change-password',
  authMiddleware,
  [
    body('currentPassword').notEmpty().withMessage('Password lama wajib diisi'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
    validate
  ],
  authController.changePassword
);

module.exports = router;
