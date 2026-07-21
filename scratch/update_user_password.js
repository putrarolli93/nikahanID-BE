const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '5elamanya',
    database: 'wedding_invitation'
  });

  try {
    const plainPassword = '5elamanya';

    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    console.log('Renaming user ID 1 and updating password...');
    const [result] = await conn.query(
      "UPDATE users SET name = 'Putra', email = 'putra@example.com', password = ? WHERE id = 1",
      [hashedPassword]
    );

    if (result.affectedRows > 0) {
      console.log('Successfully updated user ID 1 to putra@example.com with password "5elamanya".');
    } else {
      console.log('User ID 1 not found.');
    }

  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await conn.end();
  }
}

main();
