const db = require('./src/config/database');
async function check() {
  const [commissions] = await db.execute('SELECT * FROM commissions');
  const [users] = await db.execute('SELECT id, name, commission_balance FROM users');
  const [withdrawals] = await db.execute('SELECT * FROM withdrawals');
  console.log("USERS:", users);
  console.log("COMMISSIONS:", commissions);
  console.log("WITHDRAWALS:", withdrawals);
  process.exit();
}
check();
