const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '5elamanya',
    database: 'wedding_invitation'
  });

  const template = {
    name: 'Javanese Heritage',
    slug: 'javanese-heritage',
    description: 'Template pernikahan bertema Adat Jawa klasik dengan ornamen Wayang Kulit dan background Joglo.',
    price: 99000,
    is_premium: 1,
    category: 'wedding',
    thumbnail_url: '/images/javanese_bg.png',
    preview_url: '/images/javanese_bg.png',
    preview_url_mobile: '/images/javanese_bg.png',
    
  };

  try {
    const [existing] = await conn.query('SELECT id FROM templates WHERE slug = ?', [template.slug]);
    if (existing.length === 0) {
      await conn.query('INSERT INTO templates SET ?', template);
      console.log('Successfully inserted Javanese Heritage template');
    } else {
      console.log('Javanese Heritage template already exists');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await conn.end();
  }
}

main();
