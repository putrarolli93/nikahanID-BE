const db = require('../config/database');

class UserModel {
  static async create(userData) {
    const { name, email, phone, password } = userData;
    const query = `
      INSERT INTO users (name, email, phone, password)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [name, email, phone || null, password]);
    return result.insertId;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, name, email, phone, created_at, email_verified_at FROM users WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }
}

module.exports = UserModel;
