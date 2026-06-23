const db = require('../config/database');

class InvitationModel {
  static async getBySlug(slug) {
    const query = `
      SELECT 
        wi.*, 
        t.name as template_name, 
        t.slug as template_slug,
        t.preview_url as template_preview_url
      FROM wedding_info wi
      JOIN templates t ON wi.template_id = t.id
      WHERE wi.slug = ? AND wi.status = 'active'
    `;
    const [rows] = await db.execute(query, [slug]);
    const invitation = rows[0];

    if (!invitation) return null;

    const weddingId = invitation.id;

    // Ambil semua data terkait secara paralel
    const [
      brideGroom,
      quotes,
      blessings,
      schedules,
      moments,
      music,
      giftInfo,
      guestAttendance,
      loveStories
    ] = await Promise.all([
      db.execute('SELECT * FROM bride_groom WHERE wedding_id = ?', [weddingId]),
      db.execute('SELECT * FROM quotes WHERE wedding_id = ?', [weddingId]),
      db.execute('SELECT * FROM blessings WHERE wedding_id = ?', [weddingId]),
      db.execute('SELECT * FROM event_schedule WHERE wedding_id = ?', [weddingId]),
      db.execute('SELECT * FROM moments WHERE wedding_id = ? ORDER BY id ASC', [weddingId]),
      db.execute('SELECT * FROM music WHERE wedding_id = ?', [weddingId]),
      db.execute('SELECT * FROM gift_info WHERE wedding_id = ?', [weddingId]),
      db.execute('SELECT * FROM guest_attendance WHERE wedding_id = ? ORDER BY comment_date DESC', [weddingId]),
      db.execute('SELECT * FROM love_stories WHERE wedding_id = ? ORDER BY order_index ASC', [weddingId])
    ]);

    // Khusus untuk gift_info, kita ambil juga data bank_account-nya jika ada
    const gifts = giftInfo[0];
    if (gifts && gifts.length > 0) {
      await Promise.all(gifts.map(async (gift) => {
        const [accounts] = await db.execute('SELECT * FROM bank_account WHERE gift_id = ?', [gift.id]);
        gift.bank_accounts = accounts;
      }));
    }

    // Susun objek data lengkap
    return {
      ...invitation,
      bride_groom: brideGroom[0],
      quotes: quotes[0],
      blessings: blessings[0],
      schedules: schedules[0],
      moments: moments[0],
      music: music[0] ? music[0][0] : null, // Biasanya cuma 1 lagu
      gifts: gifts,
      comments: guestAttendance[0],
      love_stories: loveStories[0]
    };
  }

  static async addMoments(weddingId, photoPaths, type = 'gallery') {
    const query = 'INSERT INTO moments (wedding_id, photo_url, type) VALUES ?';
    // Format: [[wedding_id, path1, type], [wedding_id, path2, type]]
    const values = photoPaths.map(path => [weddingId, path, type]);
    
    const [result] = await db.query(query, [values]);
    return result.affectedRows;
  }

  static async upsertBrideGroom(weddingId, type, data) {
    // 1. Cek dulu apakah data mempelai sudah ada
    const [existing] = await db.execute(
      'SELECT id FROM bride_groom WHERE wedding_id = ? AND type = ?',
      [weddingId, type]
    );

    const allowedFields = [
      'full_name', 'nickname', 'description', 'mother_name',
      'father_name', 'address', 'instagram_username', 'photo_url'
    ];

    const fieldsToProcess = Object.keys(data).filter(key => allowedFields.includes(key));
    if (fieldsToProcess.length === 0) return false; // Tidak ada data valid untuk diproses

    let query;
    let queryParams;

    if (existing.length > 0) {
      // 2. Jika sudah ada, lakukan UPDATE
      const updateFields = fieldsToProcess.map(key => `${key} = ?`).join(', ');
      queryParams = fieldsToProcess.map(key => data[key]);
      queryParams.push(weddingId, type);
      query = `UPDATE bride_groom SET ${updateFields} WHERE wedding_id = ? AND type = ?`;
    } else {
      // 3. Jika belum ada, lakukan INSERT
      const insertData = { wedding_id: weddingId, type: type, full_name: '', ...data };
      const insertFields = Object.keys(insertData).filter(key => allowedFields.includes(key) || key === 'wedding_id' || key === 'type');
      queryParams = insertFields.map(key => insertData[key]);
      query = `INSERT INTO bride_groom (${insertFields.join(', ')}) VALUES (${insertFields.map(() => '?').join(', ')})`;
    }

    const [result] = await db.execute(query, queryParams);
    return result.affectedRows > 0;
  }

  static async addLoveStory(weddingId, data) {
    const { title, story_date, description, photo_url, order_index = 0 } = data;
    const query = `
      INSERT INTO love_stories (wedding_id, title, story_date, description, photo_url, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [weddingId, title, story_date, description, photo_url, order_index]);
    return result.insertId;
  }

  static async updateLoveStory(id, data) {
    const allowedFields = ['title', 'story_date', 'description', 'photo_url', 'order_index'];
    const fieldsToUpdate = Object.keys(data).filter(key => allowedFields.includes(key));
    if (fieldsToUpdate.length === 0) return false;

    const setClause = fieldsToUpdate.map(key => `${key} = ?`).join(', ');
    const queryParams = fieldsToUpdate.map(key => data[key]);
    queryParams.push(id);

    const query = `UPDATE love_stories SET ${setClause} WHERE id = ?`;
    const [result] = await db.execute(query, queryParams);
    return result.affectedRows > 0;
  }

  static async deleteLoveStory(id) {
    const query = 'DELETE FROM love_stories WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = InvitationModel;