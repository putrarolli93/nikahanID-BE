const InvitationModel = require('../models/InvitationModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

class InvitationController {
  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
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
}

module.exports = new InvitationController();