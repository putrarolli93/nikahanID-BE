const db = require('./src/config/database');

async function updatePreviews() {
  try {
    const updates = [
      { slug: 'amore', url: '/uploads/templates/preview-1782208827621-49185964.png' },
      { slug: 'oceanic', url: '/uploads/templates/preview-1782341398124-454644740.png' },
      { slug: 'garden', url: '/uploads/templates/preview-1782342021550-914239036.png' }
    ];

    for (const u of updates) {
      await db.query('UPDATE templates SET preview_url = ? WHERE slug = ?', [u.url, u.slug]);
      console.log(`Restored ${u.slug} to ${u.url}`);
    }
    
    console.log('Semua preview berhasil direstore!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating previews:', error);
    process.exit(1);
  }
}

updatePreviews();
