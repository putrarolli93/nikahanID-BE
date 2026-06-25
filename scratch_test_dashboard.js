const db = require('./src/config/database');

async function test() {
  const userId = 4; // Rolli
  const [commissions] = await db.execute(
    'SELECT id, wedding_title, template_price, amount, status, withdrawal_id, created_at FROM commissions WHERE reseller_id = ? ORDER BY created_at DESC',
    [userId]
  );
  const [withdrawals] = await db.execute(
    'SELECT id, amount, status, proof_image, created_at FROM withdrawals WHERE reseller_id = ? ORDER BY created_at DESC',
    [userId]
  );

  console.log("Commissions:", commissions);
  console.log("Withdrawals:", withdrawals);

  const groupedWithdrawals = withdrawals.map(w => {
    return {
      ...w,
      commissions: commissions.filter(c => c.withdrawal_id === w.id)
    };
  });

  console.log("Grouped:", JSON.stringify(groupedWithdrawals, null, 2));
  process.exit();
}

test();
