const db = require('./src/config/database');

async function fix() {
  try {
    // Cari komisi yang status completed tapi withdrawal_id nya null
    const [commissions] = await db.execute('SELECT id, reseller_id FROM commissions WHERE status = "completed" AND withdrawal_id IS NULL');
    
    if (commissions.length > 0) {
      // Untuk tiap reseller_id, kita kaitkan ke penarikan pertama mereka
      for (const c of commissions) {
        const [withdrawals] = await db.execute('SELECT id FROM withdrawals WHERE reseller_id = ? ORDER BY id ASC LIMIT 1', [c.reseller_id]);
        if (withdrawals.length > 0) {
          await db.execute('UPDATE commissions SET withdrawal_id = ? WHERE id = ?', [withdrawals[0].id, c.id]);
          console.log(`Updated commission ${c.id} to withdrawal_id ${withdrawals[0].id}`);
        }
      }
    }
    console.log("Fix done.");
  } catch (e) {
    console.error(e);
  }
  process.exit();
}

fix();
