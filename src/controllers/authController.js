const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, phone, password } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return errorResponse(res, 'Email sudah terdaftar', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const userId = await UserModel.create({
        name,
        email,
        phone,
        password: hashedPassword
      });

      // Get created user details (without password)
      const user = await UserModel.findById(userId);

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your_super_secret_key_change_this',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      return successResponse(res, {
        message: 'Registrasi berhasil',
        data: {
          user,
          token
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return errorResponse(res, 'Email atau password salah', 401);
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return errorResponse(res, 'Email atau password salah', 401);
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your_super_secret_key_change_this',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      return successResponse(res, {
        message: 'Login berhasil',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      // req.user is set by authMiddleware
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }

      return successResponse(res, {
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return errorResponse(res, 'Password lama dan password baru wajib diisi', 400);
      }

      // Check current password
      const user = await UserModel.findById(userId);
      if (!user) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }

      const db = require('../config/database');
      const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }

      const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
      if (!isMatch) {
        return errorResponse(res, 'Password lama salah', 400);
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

      return successResponse(res, {
        message: 'Password berhasil diubah'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
