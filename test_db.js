const db = require('./src/config/database');

async function test() {
  try {
    const [rows] = await db.execute('DESCRIBE users');
    console.log('Columns in users table:');
    rows.forEach(r => console.log(r.Field));

    const [users] = await db.execute('SELECT id, name, referral_code, bank_name FROM users');
    console.log('Users:', users);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
