const db = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function migrateAndSeedAdmin() {
  try {
    console.log('🚀 Running Admin & Analytics Migration...');

    // 1. Add role column to users table
    await db.execute(`
      ALTER TABLE users 
      ADD COLUMN role VARCHAR(20) DEFAULT 'user'
    `).catch(err => {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  `role` column already exists in users table.');
      } else {
        throw err;
      }
    });
    console.log('✅ users table updated with role column.');

    // 2. Create site_analytics table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS site_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_path VARCHAR(255) NOT NULL,
        visitor_id VARCHAR(100) NOT NULL,
        user_agent TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_visitor_id (visitor_id),
        INDEX idx_page_path (page_path)
      )
    `);
    console.log('✅ site_analytics table created.');

    // 3. Seed default admin user
    const adminEmail = 'admin@nikahan.id';
    const adminPassword = '5elamanya';

    const [existingUsers] = await db.execute('SELECT id, role FROM users WHERE email = ?', [adminEmail]);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (existingUsers.length === 0) {
      await db.execute(`
        INSERT INTO users (name, email, phone, password, role)
        VALUES (?, ?, ?, ?, ?)
      `, ['Super Admin', adminEmail, '081234567890', hashedPassword, 'admin']);

      console.log(`✅ Default admin user created successfully (${adminEmail} / ${adminPassword}).`);
    } else {
      // Ensure existing user has admin role and updated password
      await db.execute('UPDATE users SET role = ?, password = ? WHERE email = ?', ['admin', hashedPassword, adminEmail]);
      console.log(`ℹ️  Existing user ${adminEmail} updated to role 'admin' with new password.`);
    }

    console.log('🎉 Migration & Seeder completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAndSeedAdmin();
