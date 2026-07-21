const db = require('./src/config/database');
const crypto = require('crypto');

function generatePasscode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

async function migrate() {
  try {
    console.log('Running QR Check-in & Live Selfie Guestbook Migrations...');

    // 1. Alter guests table
    await db.execute(`
      ALTER TABLE guests 
      ADD COLUMN passcode VARCHAR(50) UNIQUE NULL,
      ADD COLUMN is_checked_in INT DEFAULT 0,
      ADD COLUMN checked_in_at TIMESTAMP NULL
    `).catch(err => {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('Columns already exist in guests table.');
      else throw err;
    });
    console.log('✅ guests table updated.');

    // 2. Alter guest_attendance table
    await db.execute(`
      ALTER TABLE guest_attendance 
      ADD COLUMN photo_selfie_url VARCHAR(255) NULL,
      ADD COLUMN passcode VARCHAR(50) NULL
    `).catch(err => {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('Columns already exist in guest_attendance table.');
      else throw err;
    });
    console.log('✅ guest_attendance table updated.');

    // 3. Backfill passcodes for existing guests
    const [rows] = await db.execute('SELECT id FROM guests WHERE passcode IS NULL');
    if (rows.length > 0) {
      console.log(`Backfilling passcodes for ${rows.length} existing guests...`);
      for (const row of rows) {
        let unique = false;
        let code = '';
        while (!unique) {
          code = generatePasscode();
          const [exists] = await db.execute('SELECT id FROM guests WHERE passcode = ?', [code]);
          if (exists.length === 0) unique = true;
        }
        await db.execute('UPDATE guests SET passcode = ? WHERE id = ?', [code, row.id]);
      }
      console.log('✅ passcode backfill completed.');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
