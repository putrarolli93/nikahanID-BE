const db = require('./src/config/database');

async function check() {
  const [rows] = await db.execute('SELECT id, title, slug FROM wedding_info WHERE slug = ?', ['ronald-dan-tiwi']);
  console.log(rows);
  process.exit(0);
}
check();
