const db = require('./src/config/database');

async function migrate() {
  try {
    console.log('Running Reseller Feature Migrations...');

    // 1. Alter users table
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN referral_code VARCHAR(50) UNIQUE NULL,
      ADD COLUMN commission_balance DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN bank_name VARCHAR(50) NULL,
      ADD COLUMN bank_account_number VARCHAR(50) NULL,
      ADD COLUMN bank_account_name VARCHAR(100) NULL
    `).catch(err => {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('Columns already exist in users table.');
      else throw err;
    });
    console.log('✅ users table updated.');

    // 2. Create commissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reseller_id INT NOT NULL,
        wedding_title VARCHAR(255) NOT NULL,
        template_price DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reseller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ commissions table created.');

    // 3. Create withdrawals table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reseller_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reseller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ withdrawals table created.');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
