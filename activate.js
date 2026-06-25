require('dotenv').config();
const db = require('./src/config/database');

async function activateInvitation() {
  try {
    const args = process.argv.slice(2);
    if (args.length < 1) {
      console.log('Usage: node activate.js <wedding_id> [promo_code]');
      process.exit(1);
    }

    const weddingId = args[0];
    const promoCode = args[1] || null;

    // Check wedding info
    const [weddings] = await db.execute(`
      SELECT w.id, w.title, t.price as template_price 
      FROM wedding_info w
      LEFT JOIN templates t ON w.template_id = t.id
      WHERE w.id = ?
    `, [weddingId]);

    if (weddings.length === 0) {
      console.error(`❌ Undangan dengan ID ${weddingId} tidak ditemukan.`);
      process.exit(1);
    }

    const wedding = weddings[0];

    // Mulai proses aktivasi
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Set active
      await connection.execute('UPDATE wedding_info SET status = ? WHERE id = ?', ['active', weddingId]);
      console.log(`✅ Undangan "${wedding.title}" berhasil diaktifkan.`);

      // Jika ada kode promo, proses komisi 15%
      if (promoCode && promoCode.trim() !== '') {
        const [users] = await connection.execute('SELECT id, name FROM users WHERE referral_code = ?', [promoCode]);
        
        if (users.length === 0) {
          console.error(`⚠️ Kode promo "${promoCode}" tidak ditemukan. Aktivasi berhasil tapi komisi gagal diberikan.`);
        } else {
          const resellerId = users[0].id;
          const templatePrice = parseFloat(wedding.template_price) || 0;
          const commissionAmount = templatePrice * 0.15; // 15%

          if (commissionAmount > 0) {
            // Update balance
            await connection.execute('UPDATE users SET commission_balance = commission_balance + ? WHERE id = ?', [commissionAmount, resellerId]);
            
            // Insert log
            await connection.execute(
              'INSERT INTO commissions (reseller_id, wedding_title, template_price, amount) VALUES (?, ?, ?, ?)',
              [resellerId, wedding.title, templatePrice, commissionAmount]
            );

            console.log(`✅ Komisi Rp ${commissionAmount} berhasil ditambahkan ke reseller ${users[0].name}.`);
          } else {
            console.log(`⚠️ Harga template Rp 0, komisi tidak ditambahkan.`);
          }
        }
      }

      await connection.commit();
      console.log('Selesai!');
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    process.exit(1);
  }
}

activateInvitation();
