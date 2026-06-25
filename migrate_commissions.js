const db = require('./src/config/database');

async function migrate() {
  try {
    console.log('Migrating commissions table...');
    
    // Add status column if it doesn't exist
    try {
      await db.execute("ALTER TABLE commissions ADD COLUMN status ENUM('ongoing', 'completed') DEFAULT 'ongoing'");
      console.log('Added status column to commissions table.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Column status already exists.');
      } else {
        throw e;
      }
    }

    // Update existing rows
    await db.execute("UPDATE commissions SET status = 'ongoing' WHERE status IS NULL");
    console.log('Updated existing rows to ongoing.');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
