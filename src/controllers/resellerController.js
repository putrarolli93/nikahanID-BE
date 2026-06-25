const db = require('../config/database');
const { errorResponse, successResponse } = require('../utils/responseHelper');

class ResellerController {
  // Get dashboard data
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      // Ambil profil user
      const [users] = await db.execute(
        'SELECT referral_code, commission_balance, bank_name, bank_account_number, bank_account_name FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return errorResponse(res, 'User tidak ditemukan', 404);
      }

      const profile = users[0];

      // Ambil riwayat komisi
      const [commissions] = await db.execute(
        'SELECT id, wedding_title, template_price, amount, status, withdrawal_id, created_at FROM commissions WHERE reseller_id = ? ORDER BY created_at DESC',
        [userId]
      );

      // Ambil riwayat penarikan beserta bukti transfer
      const [withdrawals] = await db.execute(
        'SELECT id, amount, status, proof_image, created_at FROM withdrawals WHERE reseller_id = ? ORDER BY created_at DESC',
        [userId]
      );

      // Gabungkan komisi ke penarikannya
      const groupedWithdrawals = withdrawals.map(w => {
        return {
          ...w,
          commissions: commissions.filter(c => c.withdrawal_id === w.id)
        };
      });

      successResponse(res, {
        data: {
          profile,
          commissions,
          withdrawals: groupedWithdrawals
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update profile (Bank info & referral code)
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { bank_name, bank_account_number, bank_account_name, referral_code } = req.body;

      // Ambil user saat ini untuk cek apakah sudah punya kode referral
      const [currentUser] = await db.execute('SELECT referral_code FROM users WHERE id = ?', [userId]);
      const currentCode = currentUser[0]?.referral_code;

      let finalReferralCode = currentCode;

      // Jika belum punya kode referral, baru boleh diset
      if (!currentCode) {
        if (!referral_code) {
          return errorResponse(res, 'Kode referral tidak boleh kosong', 400);
        }

        // Cek apakah kode referral yang mau diset sudah dipakai orang lain
        const [existing] = await db.execute('SELECT id FROM users WHERE referral_code = ?', [referral_code]);
        if (existing.length > 0) {
          return errorResponse(res, 'Kode referral sudah digunakan, silakan pilih yang lain', 400);
        }
        
        finalReferralCode = referral_code;
      }

      await db.execute(
        `UPDATE users 
         SET bank_name = ?, bank_account_number = ?, bank_account_name = ?, referral_code = ? 
         WHERE id = ?`,
        [bank_name, bank_account_number, bank_account_name, finalReferralCode, userId]
      );

      successResponse(res, { message: 'Profil reseller berhasil diperbarui' });
    } catch (error) {
      console.error('Update profile error:', error);
      next(error);
    }
  }

  // Withdraw balance
  async withdraw(req, res, next) {
    try {
      const userId = req.user.id;

      const [users] = await db.execute('SELECT commission_balance, bank_name, bank_account_number, bank_account_name FROM users WHERE id = ?', [userId]);
      const user = users[0];

      if (!user) return errorResponse(res, 'User tidak ditemukan', 404);

      if (user.commission_balance < 100000) {
        return errorResponse(res, 'Saldo minimal penarikan adalah Rp 100.000', 400);
      }

      if (!user.bank_name || !user.bank_account_number || !user.bank_account_name) {
        return errorResponse(res, 'Harap lengkapi data rekening bank terlebih dahulu di pengaturan', 400);
      }

      const amountToWithdraw = user.commission_balance;

      // Mulai transaksi (karena ini operasi yang berurutan dan krusial)
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Kurangi saldo
        await connection.execute('UPDATE users SET commission_balance = 0 WHERE id = ?', [userId]);

        // Catat di tabel withdrawals
        await connection.execute('INSERT INTO withdrawals (reseller_id, amount, status) VALUES (?, ?, ?)', [userId, amountToWithdraw, 'completed']);

        await connection.commit();
        connection.release();

        successResponse(res, { message: 'Penarikan berhasil dicatat', amount: amountToWithdraw });
      } catch (err) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  // Check promo code (Public endpoint, used during checkout)
  async checkPromo(req, res, next) {
    try {
      const { code } = req.params;
      const userId = req.user.id; // Added because of authMiddleware

      if (!code) return errorResponse(res, 'Kode promo wajib diisi', 400);

      const [users] = await db.execute('SELECT id, name FROM users WHERE referral_code = ?', [code]);
      
      if (users.length === 0) {
        return errorResponse(res, 'Kode promo tidak valid', 404);
      }

      if (users[0].id === userId) {
        return errorResponse(res, 'Anda tidak bisa menggunakan kode referral milik Anda sendiri', 400);
      }

      // Jika ada diskon untuk klien, bisa dimasukkan ke response
      // Di plan kita asumsikan harga tetap, tapi kita return success
      successResponse(res, { 
        message: 'Kode promo valid', 
        data: { reseller_name: users[0].name } 
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset Commission (Admin API)
  async resetCommission(req, res, next) {
    try {
      const { id } = req.params; // reseller_id
      const proofImage = req.file ? `/uploads/proofs/${req.file.filename}` : null;

      if (!proofImage) {
        return errorResponse(res, 'Bukti transfer (proof_image) wajib diunggah', 400);
      }

      const [users] = await db.execute('SELECT commission_balance FROM users WHERE id = ?', [id]);
      if (users.length === 0) {
        return errorResponse(res, 'Reseller tidak ditemukan', 404);
      }

      const balance = parseFloat(users[0]?.commission_balance) || 0;

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Reset balance
        await connection.execute('UPDATE users SET commission_balance = 0 WHERE id = ?', [id]);
        
        let withdrawalId = null;
        // Insert into withdrawals as a record
        if (balance > 0) {
          const [result] = await connection.execute(
            'INSERT INTO withdrawals (reseller_id, amount, status, proof_image) VALUES (?, ?, ?, ?)',
            [id, balance, 'completed', proofImage]
          );
          withdrawalId = result.insertId;
        }

        // Update commissions status to completed and group them by withdrawal_id
        if (withdrawalId) {
          await connection.execute(
            "UPDATE commissions SET status = 'completed', withdrawal_id = ? WHERE reseller_id = ? AND status = 'ongoing'", 
            [withdrawalId, id]
          );
        } else {
          await connection.execute(
            "UPDATE commissions SET status = 'completed' WHERE reseller_id = ? AND status = 'ongoing'", 
            [id]
          );
        }

        await connection.commit();
        successResponse(res, { message: 'Komisi berhasil di-reset, dibayarkan, dan dikelompokkan' });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      next(error);
    }
  }

  // Get Reseller Detail (Admin API)
  async getResellerDetail(req, res, next) {
    try {
      const { id } = req.params; // reseller_id

      const [users] = await db.execute(
        'SELECT name, email, referral_code, commission_balance, bank_name, bank_account_number, bank_account_name FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return errorResponse(res, 'Reseller tidak ditemukan', 404);
      }

      const profile = users[0];

      const [commissions] = await db.execute(
        'SELECT id, wedding_title, template_price, amount, status, created_at FROM commissions WHERE reseller_id = ? ORDER BY created_at DESC',
        [id]
      );

      const ongoing = commissions.filter(c => c.status === 'ongoing');
      const completed = commissions.filter(c => c.status === 'completed');

      successResponse(res, {
        message: 'Detail Reseller berhasil diambil',
        data: {
          profile: {
            name: profile.name,
            email: profile.email,
            referral_code: profile.referral_code,
            commission_balance: parseFloat(profile.commission_balance) || 0,
            bank_name: profile.bank_name,
            bank_account_number: profile.bank_account_number,
            bank_account_name: profile.bank_account_name
          },
          commissions: {
            ongoing: ongoing,
            completed: completed
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResellerController();
