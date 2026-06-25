const db = require('../config/database');

class GuestModel {
  static async getByWeddingId(weddingId) {
    const query = `
      SELECT id, name, phone_number, is_sent, created_at, updated_at
      FROM guests
      WHERE wedding_id = ?
      ORDER BY created_at DESC
    `;
    const [rows] = await db.execute(query, [weddingId]);
    return rows;
  }

  static async addGuest(weddingId, data) {
    const { name, phone_number } = data;
    const query = `
      INSERT INTO guests (wedding_id, name, phone_number, is_sent)
      VALUES (?, ?, ?, 0)
    `;
    const [result] = await db.execute(query, [weddingId, name, phone_number || null]);
    return result.insertId;
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
