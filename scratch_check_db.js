const db = require('./src/config/database');
async function check() {
  const [rows] = await db.execute('DESCRIBE withdrawals');
  console.log(rows);
  process.exit();
}
check();
