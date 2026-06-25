const db = require('./src/config/database');

async function testUpdate() {
  try {
    const bank_name = '';
    const bank_account_number = '';
    const bank_account_name = '';
    const referral_code = 'TEST10';
    const userId = 4; // Rolli

    console.log('Testing query...');
    await db.execute(
      `UPDATE users 
       SET bank_name = ?, bank_account_number = ?, bank_account_name = ?, referral_code = ? 
       WHERE id = ?`,
      [bank_name, bank_account_number, bank_account_name, referral_code, userId]
    );
    console.log('Update success');
    
    const [users] = await db.execute('SELECT referral_code, bank_name FROM users WHERE id = ?', [userId]);
    console.log('Updated user:', users[0]);

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testUpdate();
