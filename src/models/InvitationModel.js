const db = require('../config/database');

class InvitationModel {
  static async getById(id) {
    const query = `SELECT * FROM wedding_info WHERE id = ?`;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async getBySlug(slug) {
    const query = `
      SELECT 
        wi.*, 
        t.name as template_name, 
        t.slug as template_slug,
        t.preview_url as template_preview_url,
        t.price as template_price,
        t.is_premium as template_is_premium
      FROM wedding_info wi
      JOIN templates t ON wi.template_id = t.id
      WHERE wi.slug = ? AND (wi.status = 'active' OR wi.status = 'draft')
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

  static async getByUserId(userId) {
    const query = `
      SELECT 
        wi.id, wi.slug, wi.title, wi.status, wi.created_at, wi.updated_at,
        t.name as template_name, 
        t.slug as template_slug,
        t.preview_url as template_preview_url,
        t.price as template_price,
        t.is_premium as template_is_premium
      FROM wedding_info wi
      LEFT JOIN templates t ON wi.template_id = t.id
      WHERE wi.user_id = ?
      ORDER BY wi.updated_at DESC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
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

  static async createDraft(userId, templateId, slug, groomName, brideName, akadDate, akadTime, hasResepsi, resepsiDate, resepsiTime) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert into wedding_info
      const title = `The Wedding of ${groomName} & ${brideName}`;
      const queryWedding = `
        INSERT INTO wedding_info (user_id, template_id, slug, title, status)
        VALUES (?, ?, ?, ?, 'draft')
      `;
      const [resultWedding] = await connection.execute(queryWedding, [userId, templateId, slug, title]);
      const weddingId = resultWedding.insertId;

      // 2. Insert into bride_groom (groom)
      const queryGroom = `
        INSERT INTO bride_groom (wedding_id, type, full_name)
        VALUES (?, 'groom', ?)
      `;
      await connection.execute(queryGroom, [weddingId, groomName]);

      // 3. Insert into bride_groom (bride)
      const queryBride = `
        INSERT INTO bride_groom (wedding_id, type, full_name)
        VALUES (?, 'bride', ?)
      `;
      await connection.execute(queryBride, [weddingId, brideName]);

      // 4. Insert into event_schedule (Akad)
      const queryAkad = `
        INSERT INTO event_schedule (wedding_id, event_name, event_date, start_time)
        VALUES (?, 'Akad Nikah', ?, ?)
      `;
      await connection.execute(queryAkad, [weddingId, akadDate, akadTime]);

      // 5. Insert into event_schedule (Resepsi, if hasResepsi)
      if (hasResepsi && resepsiDate && resepsiTime) {
        const queryResepsi = `
          INSERT INTO event_schedule (wedding_id, event_name, event_date, start_time)
          VALUES (?, 'Resepsi', ?, ?)
        `;
        await connection.execute(queryResepsi, [weddingId, resepsiDate, resepsiTime]);
      }

      await connection.commit();
      return { id: weddingId, slug };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async upsertEventSchedule(weddingId, schedules) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      for (const schedule of schedules) {
        const { event_name, event_address, google_map_link, event_date, start_time } = schedule;
        const [existing] = await connection.execute(
          'SELECT id FROM event_schedule WHERE wedding_id = ? AND event_name = ?',
          [weddingId, event_name]
        );
        if (existing.length > 0) {
          await connection.execute(
            `UPDATE event_schedule 
             SET event_address = ?, google_map_link = ?, event_date = ?, start_time = ?
             WHERE wedding_id = ? AND event_name = ?`,
            [event_address || null, google_map_link || null, event_date || null, start_time || null, weddingId, event_name]
          );
        } else {
          await connection.execute(
            `INSERT INTO event_schedule (wedding_id, event_name, event_address, google_map_link, event_date, start_time)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [weddingId, event_name, event_address || null, google_map_link || null, event_date || null, start_time || null]
          );
        }
      }
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async upsertQuotes(weddingId, data) {
    const { content, source } = data;
    const [existing] = await db.execute('SELECT id FROM quotes WHERE wedding_id = ?', [weddingId]);
    if (existing.length > 0) {
      const [res] = await db.execute(
        'UPDATE quotes SET content = ?, source = ? WHERE wedding_id = ?',
        [content, source || null, weddingId]
      );
      return res.affectedRows > 0;
    } else {
      const [res] = await db.execute(
        'INSERT INTO quotes (wedding_id, content, source) VALUES (?, ?, ?)',
        [weddingId, content, source || null]
      );
      return res.insertId > 0;
    }
  }

  static async upsertBlessings(weddingId, blessings) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      for (const blessing of blessings) {
        const { type, content } = blessing;
        const [existing] = await connection.execute(
          'SELECT id FROM blessings WHERE wedding_id = ? AND type = ?',
          [weddingId, type]
        );
        if (existing.length > 0) {
          await connection.execute(
            'UPDATE blessings SET content = ? WHERE wedding_id = ? AND type = ?',
            [content, weddingId, type]
          );
        } else {
          await connection.execute(
            'INSERT INTO blessings (wedding_id, type, content) VALUES (?, ?, ?)',
            [weddingId, type, content]
          );
        }
      }
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async upsertMusic(weddingId, data) {
    const { title, artist, url, autoplay = true } = data;
    const [existing] = await db.execute('SELECT id FROM music WHERE wedding_id = ?', [weddingId]);
    if (existing.length > 0) {
      const [res] = await db.execute(
        'UPDATE music SET title = ?, artist = ?, url = ?, autoplay = ? WHERE wedding_id = ?',
        [title || null, artist || null, url || null, autoplay ? 1 : 0, weddingId]
      );
      return res.affectedRows > 0;
    } else {
      const [res] = await db.execute(
        'INSERT INTO music (wedding_id, title, artist, url, autoplay) VALUES (?, ?, ?, ?, ?)',
        [weddingId, title || null, artist || null, url || null, autoplay ? 1 : 0]
      );
      return res.insertId > 0;
    }
  }

  static async upsertGifts(weddingId, giftData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const { title = "Titip Hadiah", message, shipping_address, bank_accounts = [] } = giftData;
      
      // 1. Upsert gift_info
      let giftId;
      const [existingGift] = await connection.execute('SELECT id FROM gift_info WHERE wedding_id = ?', [weddingId]);
      if (existingGift.length > 0) {
        giftId = existingGift[0].id;
        await connection.execute(
          'UPDATE gift_info SET title = ?, message = ?, shipping_address = ? WHERE id = ?',
          [title, message || null, shipping_address || null, giftId]
        );
      } else {
        const [res] = await connection.execute(
          'INSERT INTO gift_info (wedding_id, title, message, shipping_address) VALUES (?, ?, ?, ?)',
          [weddingId, title, message || null, shipping_address || null]
        );
        giftId = res.insertId;
      }

      // 2. Delete existing bank accounts for this giftId and re-insert
      await connection.execute('DELETE FROM bank_account WHERE gift_id = ?', [giftId]);
      for (const acc of bank_accounts) {
        const { bank_name, account_number, account_holder, notes } = acc;
        await connection.execute(
          'INSERT INTO bank_account (gift_id, bank_name, account_number, account_holder, notes) VALUES (?, ?, ?, ?, ?)',
          [giftId, bank_name, account_number, account_holder, notes || null]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = InvitationModel;