const db = require('../config/database');
const crypto = require('crypto');

class GuestModel {
  static generatePasscode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  static async getByWeddingId(weddingId) {
    const query = `
      SELECT id, name, phone_number, passcode, is_checked_in, checked_in_at, is_sent, created_at, updated_at
      FROM guests
      WHERE wedding_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query, [weddingId]);
    return rows;
  }

  static async addGuest(weddingId, data) {
    const { name, phone_number } = data;
    
    // Generate unique passcode
    let unique = false;
    let passcode = '';
    while (!unique) {
      passcode = this.generatePasscode();
      const [exists] = await db.execute('SELECT id FROM guests WHERE passcode = ?', [passcode]);
      if (exists.length === 0) unique = true;
    }

    const query = `
      INSERT INTO guests (wedding_id, name, phone_number, passcode, is_sent, is_checked_in)
      VALUES (?, ?, ?, ?, 0, 0)
    `;
    const [result] = await db.execute(query, [weddingId, name, phone_number || null, passcode]);
    return { insertId: result.insertId, passcode };
  }

  static async getByPasscode(passcode) {
    const query = `
      SELECT id, wedding_id, name, phone_number, passcode, is_checked_in, checked_in_at
      FROM guests
      WHERE passcode = ?
    `;
    const [rows] = await db.execute(query, [passcode]);
    return rows[0] || null;
  }

  static async checkIn(passcode) {
    const query = `
      UPDATE guests
      SET is_checked_in = 1, checked_in_at = CURRENT_TIMESTAMP
      WHERE passcode = ?
    `;
    const [result] = await db.execute(query, [passcode]);
    return result.affectedRows > 0;
  }

  static async markAsSent(guestId, weddingId) {
    const query = `
      UPDATE guests
      SET is_sent = 1
      WHERE id = ? AND wedding_id = ?
    `;
    const [result] = await db.execute(query, [guestId, weddingId]);
    return result.affectedRows > 0;
  }

  static async deleteGuest(guestId, weddingId) {
    const query = `
      DELETE FROM guests
      WHERE id = ? AND wedding_id = ?
    `;
    const [result] = await db.execute(query, [guestId, weddingId]);
    return result.affectedRows > 0;
  }

  static async updateCustomMessage(weddingId, customMessage) {
    const query = `
      UPDATE wedding_info
      SET custom_wa_msg = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(query, [customMessage, weddingId]);
    return result.affectedRows > 0;
  }
}

module.exports = GuestModel;
