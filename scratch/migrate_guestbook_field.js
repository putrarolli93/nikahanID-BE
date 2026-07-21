const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '5elamanya',
    database: 'wedding_invitation'
  });

  try {
    // Check if column exists
    const [columns] = await conn.query('SHOW COLUMNS FROM templates LIKE "is_guestbook_active"');
    if (columns.length === 0) {
      console.log('Adding is_guestbook_active column to templates table...');
      await conn.query('ALTER TABLE templates ADD COLUMN is_guestbook_active TINYINT DEFAULT 0 AFTER features');
      console.log('Column added successfully.');
    } else {
      console.log('is_guestbook_active column already exists.');
    }

    // Update Javanese Heritage to have guestbook enabled
    console.log('Activating guestbook for javanese-heritage template...');
    await conn.query('UPDATE templates SET is_guestbook_active = 1 WHERE slug = "javanese-heritage"');
    console.log('Guestbook activated for Javanese Heritage.');

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await conn.end();
  }
}

main();
