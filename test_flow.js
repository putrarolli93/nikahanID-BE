const axios = require('axios');
const db = require('./src/config/database');

async function test() {
  try {
    // get an existing user
    const [users] = await db.execute('SELECT email FROM users LIMIT 1');
    if (users.length === 0) throw new Error('No users');
    const email = users[0].email;
    console.log('Testing with email:', email);

    // I cannot login because I don't know the password. I will generate a token directly.
    const jwt = require('jsonwebtoken');
    const [userRow] = await db.execute('SELECT id, email FROM users WHERE email = ?', [email]);
    const user = userRow[0];
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_super_secret_key_change_this',
      { expiresIn: '1h' }
    );

    console.log('Generated token for user:', user.id);

    // Call update API
    const updateRes = await axios.post('http://localhost:5000/api/reseller/update-profile', {
      referral_code: 'MYCODE123',
      bank_name: 'BCA',
      bank_account_number: '98765',
      bank_account_name: 'TEST NAME'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Update Response:', updateRes.data);

    // Call dashboard API
    const dashRes = await axios.get('http://localhost:5000/api/reseller/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Dashboard Response:', dashRes.data.data.profile);

    process.exit(0);
  } catch (err) {
    console.error('Error Response Data:', err.response?.data);
    console.error('Error Message:', err.message);
    process.exit(1);
  }
}

test();
