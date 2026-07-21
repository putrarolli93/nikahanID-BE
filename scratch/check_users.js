const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '5elamanya',
    database: 'wedding_invitation'
  });

  try {
    const [users] = await conn.query('SELECT id, name, email FROM users');
    console.log('Registered users:', users);

    const [weddings] = await conn.query('SELECT id, slug, user_id FROM wedding_info');
    console.log('Invitations:', weddings);
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    await conn.end();
  }
}

main();
