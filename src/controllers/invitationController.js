const InvitationModel = require('../models/InvitationModel');
const TemplateModel = require('../models/TemplateModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

class InvitationController {
  async createDraft(req, res, next) {
    try {
      const { templateSlug, groomName, brideName, akadDate, akadTime, hasResepsi, resepsiDate, resepsiTime } = req.body;
      const userId = req.user.id;

      if (!templateSlug || !groomName || !brideName || !akadDate || !akadTime) {
        return errorResponse(res, 'Mempelai pria, mempelai wanita, tanggal akad, dan jam akad harus diisi.', 400);
      }

      // Look up template_id
      const template = await TemplateModel.getBySlug(templateSlug);
      const templateId = template ? template.id : 1; // Fallback to 1 (Amore)

      // Generate unique slug
      const slugify = (text) => {
        return text.toString().toLowerCase().trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-');
      };

      const baseSlug = `${slugify(groomName)}-dan-${slugify(brideName)}`;
      let slug = baseSlug;
      let isUnique = false;
      let attempts = 0;
      const db = require('../config/database');

      while (!isUnique && attempts < 10) {
        const checkQuery = 'SELECT id FROM wedding_info WHERE slug = ?';
        const [rows] = await db.execute(checkQuery, [slug]);
        if (rows.length === 0) {
          isUnique = true;
        } else {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          slug = `${baseSlug}-${randomSuffix}`;
          attempts++;
        }
      }

      const result = await InvitationModel.createDraft(
        userId, templateId, slug, groomName, brideName, akadDate, akadTime, hasResepsi, resepsiDate, resepsiTime
      );

      successResponse(res, {
        message: 'Draft undangan berhasil dibuat',
        data: result
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSchedules(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { schedules } = req.body;

      if (!schedules || !Array.isArray(schedules)) {
        return errorResponse(res, 'Format data jadwal tidak valid', 400);
      }

      await InvitationModel.upsertEventSchedule(weddingId, schedules);
      successResponse(res, { message: 'Jadwal acara berhasil diperbarui' });
    } catch (error) {
      next(error);
    }
  }

  async updateQuotes(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { content, source } = req.body;

      if (!content) {
        return errorResponse(res, 'Konten kutipan harus diisi', 400);
      }

      await InvitationModel.upsertQuotes(weddingId, { content, source });
      successResponse(res, { message: 'Kutipan berhasil diperbarui' });
    } catch (error) {
      next(error);
    }
  }

  async updateBlessings(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { blessings } = req.body;

      if (!blessings || !Array.isArray(blessings)) {
        return errorResponse(res, 'Format ucapan/doa tidak valid', 400);
      }

      await InvitationModel.upsertBlessings(weddingId, blessings);
      successResponse(res, { message: 'Ucapan & doa berhasil diperbarui' });
    } catch (error) {
      next(error);
    }
  }

  async updateMusic(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { title, artist, url, autoplay } = req.body;

      await InvitationModel.upsertMusic(weddingId, { title, artist, url, autoplay });
      successResponse(res, { message: 'Musik latar berhasil diperbarui' });
    } catch (error) {
      next(error);
    }
  }

  async updateGifts(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { title, message, shipping_address, bank_accounts } = req.body;

      await InvitationModel.upsertGifts(weddingId, { title, message, shipping_address, bank_accounts });
      successResponse(res, { message: 'Informasi hadiah berhasil diperbarui' });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      // Get wedding details regardless of active/draft status for editing in wizard, but let's see
      // In InvitationModel getBySlug, it does: WHERE wi.slug = ? AND wi.status = 'active'
      // Wait, if it's a draft, getBySlug will fail! We should also support loading drafts for owners.
      // Let's check: can we make getBySlug return drafts too, or only if it's the owner or if we request it?
      // Since it's for editing and previewing drafts in the wizard, we should let it fetch drafts too, or modify getBySlug logic to allow draft if it's matching.
      // Wait! Let's check how getBySlug is written:
      // "WHERE wi.slug = ? AND wi.status = 'active'"
      // If we change it to allow 'draft' status too so it can be previewed/edited:
      // "WHERE wi.slug = ? AND (wi.status = 'active' OR wi.status = 'draft')"
      // That is extremely useful because a draft MUST be readable in the wizard preview!
      // Let's double check: yes, it should allow active OR draft.
      // We will adjust getBySlug in InvitationModel.js next, or we can load it by ID. But getBySlug is fine!
      const invitation = await InvitationModel.getBySlug(slug);

      if (!invitation) return errorResponse(res, 'Undangan tidak ditemukan', 404);

      successResponse(res, { data: invitation });
    } catch (error) {
      next(error);
    }
  }

  async uploadMoments(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { type = 'gallery' } = req.body; // Mengambil type dari body (slider atau gallery)

      if (!req.files || req.files.length === 0) {
        return errorResponse(res, 'Tidak ada file yang diunggah', 400);
      }

      // Ambil path file yang tersimpan
      const photoPaths = req.files.map(file => `/uploads/moments/${file.filename}`);

      await InvitationModel.addMoments(weddingId, photoPaths, type);

      successResponse(res, { message: `Foto berhasil ditambahkan ke ${type}`, data: photoPaths }, 201);
    } catch (error) {
      next(error);
    }
  }

  async upsertBrideGroom(req, res, next) {
    try {
      const { weddingId, type } = req.params;
      const data = { ...req.body };

      // Jika ada file foto yang diunggah, tambahkan path-nya ke data
      if (req.file) {
        data.photo_url = `/uploads/profiles/${req.file.filename}`;
      }

      const result = await InvitationModel.upsertBrideGroom(weddingId, type, data);
      if (!result) {
        return errorResponse(res, 'Tidak ada data untuk disimpan atau diperbarui', 400);
      }

      successResponse(res, { message: `Data mempelai ${type} berhasil disimpan/diperbarui`, data });
    } catch (error) {
      next(error);
    }
  }

  async addLoveStory(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { title, story_date, description, order_index } = req.body;

      if (!title || !description) {
        return errorResponse(res, 'Judul (title) dan keterangan (description) harus diisi', 400);
      }

      const data = {
        title,
        story_date,
        description,
        order_index: order_index ? parseInt(order_index) : 0,
        photo_url: req.file ? `/uploads/stories/${req.file.filename}` : null
      };

      const insertId = await InvitationModel.addLoveStory(weddingId, data);

      successResponse(res, {
        message: 'Cerita perjalanan cinta berhasil ditambahkan',
        data: { id: insertId, ...data }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateLoveStory(req, res, next) {
    try {
      const { id } = req.params;
      const { title, story_date, description, order_index } = req.body;

      const data = {};
      if (title !== undefined) data.title = title;
      if (story_date !== undefined) data.story_date = story_date;
      if (description !== undefined) data.description = description;
      if (order_index !== undefined) data.order_index = parseInt(order_index);
      if (req.file) {
        data.photo_url = `/uploads/stories/${req.file.filename}`;
      }

      const result = await InvitationModel.updateLoveStory(id, data);
      if (!result) {
        return errorResponse(res, 'Cerita tidak ditemukan atau tidak ada data yang diperbarui', 404);
      }

      successResponse(res, { message: 'Cerita perjalanan cinta berhasil diperbarui', data });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req, res, next) {
    try {
      const { weddingId } = req.params;
      const { guest_name, will_attend, jumlah_tamu, message } = req.body;

      if (!guest_name) {
        return errorResponse(res, 'Nama tamu wajib diisi', 400);
      }

      const db = require('../config/database');
      const query = `
        INSERT INTO guest_attendance (wedding_id, guest_name, will_attend, jumlah_tamu, message)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.execute(query, [
        weddingId,
        guest_name,
        will_attend !== undefined ? will_attend : null,
        jumlah_tamu !== undefined ? parseInt(jumlah_tamu) : 1,
        message || null
      ]);

      successResponse(res, { message: 'Komentar/kehadiran berhasil dikirim' }, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteLoveStory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await InvitationModel.deleteLoveStory(id);

      if (!result) {
        return errorResponse(res, 'Cerita tidak ditemukan', 404);
      }

      successResponse(res, { message: 'Cerita perjalanan cinta berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }

  async getDefaultAvatars(req, res, next) {
    try {
      const db = require('../config/database');
      const [rows] = await db.execute('SELECT * FROM default_avatars ORDER BY id ASC');
      successResponse(res, {
        message: 'Avatars fetched successfully',
        data: rows
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadDefaultAvatar(req, res, next) {
    try {
      const { name, gender } = req.body;
      if (!name || !gender) {
        return errorResponse(res, 'Nama avatar dan gender harus diisi.', 400);
      }
      if (!['groom', 'bride'].includes(gender)) {
        return errorResponse(res, 'Gender harus berupa "groom" atau "bride".', 400);
      }
      if (!req.file) {
        return errorResponse(res, 'File foto avatar harus diunggah.', 400);
      }

      const photoUrl = `/uploads/default_avatars/${req.file.filename}`;
      const db = require('../config/database');
      const query = 'INSERT INTO default_avatars (name, gender, photo_url) VALUES (?, ?, ?)';
      const [result] = await db.execute(query, [name, gender, photoUrl]);

      successResponse(res, {
        message: 'Avatar default berhasil ditambahkan',
        data: {
          id: result.insertId,
          name,
          gender,
          photo_url: photoUrl
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async getDefaultMusic(req, res, next) {
    try {
      const db = require('../config/database');
      const [rows] = await db.execute('SELECT * FROM default_music ORDER BY id ASC');
      successResponse(res, {
        message: 'Daftar lagu default berhasil diambil',
        data: rows
      });
    } catch (error) {
      next(error);
    }
  }

  async addDefaultMusic(req, res, next) {
    try {
      const { title: bodyTitle, artist } = req.body;

      if (!req.file) {
        return errorResponse(res, 'File musik harus diunggah.', 400);
      }

      const path = require('path');
      const musicUrl = `/uploads/music/${req.file.filename}`;
      const originalTitle = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const title = bodyTitle || originalTitle;

      const db = require('../config/database');
      const [result] = await db.execute(
        'INSERT INTO default_music (title, artist, url) VALUES (?, ?, ?)',
        [title, artist || null, musicUrl]
      );

      successResponse(res, {
        message: 'Lagu default berhasil ditambahkan',
        data: {
          id: result.insertId,
          title,
          artist: artist || null,
          url: musicUrl
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  async uploadMusicFile(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 'File musik harus diunggah.', 400);
      }

      const path = require('path');
      const musicUrl = `/uploads/music/${req.file.filename}`;
      const originalTitle = path.basename(req.file.originalname, path.extname(req.file.originalname));
      const title = req.body.title || originalTitle;

      successResponse(res, {
        message: 'File musik berhasil diunggah',
        data: {
          title,
          url: `http://localhost:5000${musicUrl}`
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // ── Default Blessings ──────────────────────────────────────────
  async getDefaultBlessings(req, res, next) {
    try {
      const db = require('../config/database');
      const [rows] = await db.execute('SELECT * FROM default_blessings ORDER BY id ASC');
      successResponse(res, { message: 'Daftar ucapan default berhasil diambil', data: rows });
    } catch (error) { next(error); }
  }

  async addDefaultBlessing(req, res, next) {
    try {
      const { content } = req.body;
      if (!content) return errorResponse(res, 'Konten ucapan harus diisi.', 400);
      const db = require('../config/database');
      const [result] = await db.execute('INSERT INTO default_blessings (content) VALUES (?)', [content]);
      successResponse(res, { message: 'Ucapan default berhasil ditambahkan', data: { id: result.insertId, content } }, 201);
    } catch (error) { next(error); }
  }

  // ── Default Quotes ─────────────────────────────────────────────
  async getDefaultQuotes(req, res, next) {
    try {
      const db = require('../config/database');
      const [rows] = await db.execute('SELECT * FROM default_quotes ORDER BY id ASC');
      successResponse(res, { message: 'Daftar kutipan default berhasil diambil', data: rows });
    } catch (error) { next(error); }
  }

  async addDefaultQuote(req, res, next) {
    try {
      const { content, source } = req.body;
      if (!content) return errorResponse(res, 'Konten kutipan harus diisi.', 400);
      const db = require('../config/database');
      const [result] = await db.execute('INSERT INTO default_quotes (content, source) VALUES (?, ?)', [content, source || null]);
      successResponse(res, { message: 'Kutipan default berhasil ditambahkan', data: { id: result.insertId, content, source: source || null } }, 201);
    } catch (error) { next(error); }
  }

  // ── Default Cover Quotes ───────────────────────────────────────
  async getDefaultCoverQuotes(req, res, next) {
    try {
      const db = require('../config/database');
      const [rows] = await db.execute('SELECT * FROM default_cover_quotes ORDER BY id ASC');
      successResponse(res, { message: 'Daftar kutipan sampul default berhasil diambil', data: rows });
    } catch (error) { next(error); }
  }

  async addDefaultCoverQuote(req, res, next) {
    try {
      const { content, source } = req.body;
      if (!content) return errorResponse(res, 'Konten kutipan sampul harus diisi.', 400);
      const db = require('../config/database');
      const [result] = await db.execute('INSERT INTO default_cover_quotes (content, source) VALUES (?, ?)', [content, source || null]);
      successResponse(res, { message: 'Kutipan sampul default berhasil ditambahkan', data: { id: result.insertId, content, source: source || null } }, 201);
    } catch (error) { next(error); }
  }
}

module.exports = new InvitationController();