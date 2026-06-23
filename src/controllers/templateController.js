const TemplateModel = require('../models/TemplateModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

class TemplateController {
  async getAll(req, res, next) {
    try {
      const { category, is_premium, search } = req.query;
      const templates = await TemplateModel.getAll({ category, is_premium, search });
      successResponse(res, { data: templates, total: templates.length, filters: { category, is_premium, search } });
    } catch (error) {
      next(error);
    }
  }
  
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const template = await TemplateModel.getById(id);
      if (!template) return errorResponse(res, 'Template tidak ditemukan', 404);
      successResponse(res, { data: template });
    } catch (error) {
      next(error);
    }
  }
  
  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const template = await TemplateModel.getBySlug(slug);
      if (!template) return errorResponse(res, 'Template tidak ditemukan', 404);
      successResponse(res, { data: template });
    } catch (error) {
      next(error);
    }
  }
  
  async getTemplateDetail(req, res, next) {
    try {
      const { identifier } = req.params;
      let template;

      // Check if the identifier is a number (potential ID)
      if (!isNaN(identifier) && !isNaN(parseFloat(identifier))) {
        template = await TemplateModel.getById(identifier);
      }

      // If not found by ID or if it's not a number, try by slug
      if (!template) {
        template = await TemplateModel.getBySlug(identifier);
      }
      if (!template) return errorResponse(res, 'Template tidak ditemukan', 404);
      successResponse(res, { data: template });
    } catch (error) {
      next(error);
    }
  }
  
  async getCategories(req, res, next) {
    try {
      const categories = await TemplateModel.getCategories();
      successResponse(res, { data: ['Semua', ...categories] });
    } catch (error) {
      next(error);
    }
  }
  
  async create(req, res, next) {
    try {
      const data = { ...req.body };
      
      // Handle file uploads (terima kedua nama field)
      if (req.files) {
        if (req.files['thumbnail']?.[0]) {
          data.thumbnail_url = `/uploads/templates/${req.files['thumbnail'][0].filename}`;
        }
        const previewFile = req.files['preview']?.[0] || req.files['preview_url']?.[0];
        if (previewFile) {
          data.preview_url = `/uploads/templates/${previewFile.filename}`;
        }
        const previewMobileFile = req.files['preview_mobile']?.[0] || req.files['preview_url_mobile']?.[0];
        if (previewMobileFile) {
          data.preview_url_mobile = `/uploads/templates/${previewMobileFile.filename}`;
        }
      }

      // Parse price
      if (data.price !== undefined) {
        data.price = parseInt(data.price) || 0;
      }

      // Parse features list if sent as string (e.g. JSON array string or comma separated)
      if (data.features) {
        try {
          data.features = typeof data.features === 'string' ? JSON.parse(data.features) : data.features;
        } catch (e) {
          data.features = data.features.split(',').map(item => item.trim());
        }
      }

      if (!data.name || !data.slug) {
        return errorResponse(res, 'Nama (name) dan slug wajib diisi', 400);
      }

      const templateId = await TemplateModel.create(data);
      successResponse(res, { message: 'Template berhasil dibuat', data: { id: templateId, ...data } }, 201);
    } catch (error) {
      next(error);
    }
  }
  
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const existingTemplate = await TemplateModel.getById(id);
      if (!existingTemplate) return errorResponse(res, 'Template tidak ditemukan', 404);

      // Merge existing data with update body
      const data = {
        name: req.body.name !== undefined ? req.body.name : existingTemplate.name,
        slug: req.body.slug !== undefined ? req.body.slug : existingTemplate.slug,
        thumbnail_url: req.body.thumbnail_url !== undefined ? req.body.thumbnail_url : existingTemplate.thumbnail_url,
        preview_url: req.body.preview_url !== undefined ? req.body.preview_url : existingTemplate.preview_url,
        preview_url_mobile: req.body.preview_url_mobile !== undefined ? req.body.preview_url_mobile : existingTemplate.preview_url_mobile,
        category: req.body.category !== undefined ? req.body.category : existingTemplate.category,
        is_premium: req.body.is_premium !== undefined ? parseInt(req.body.is_premium) : existingTemplate.is_premium,
        is_active: req.body.is_active !== undefined ? parseInt(req.body.is_active) : existingTemplate.is_active,
        description: req.body.description !== undefined ? req.body.description : existingTemplate.description,
        price: req.body.price !== undefined ? parseInt(req.body.price) || 0 : existingTemplate.price,
        features: req.body.features !== undefined ? req.body.features : existingTemplate.features
      };

      // Parse features update
      if (req.body.features !== undefined) {
        try {
          data.features = typeof req.body.features === 'string' ? JSON.parse(req.body.features) : req.body.features;
        } catch (e) {
          data.features = req.body.features.split(',').map(item => item.trim());
        }
      }

      // Handle file uploads (terima kedua nama field)
      if (req.files) {
        if (req.files['thumbnail']?.[0]) {
          data.thumbnail_url = `/uploads/templates/${req.files['thumbnail'][0].filename}`;
        }
        const previewFile = req.files['preview']?.[0] || req.files['preview_url']?.[0];
        if (previewFile) {
          data.preview_url = `/uploads/templates/${previewFile.filename}`;
        }
        const previewMobileFile = req.files['preview_mobile']?.[0] || req.files['preview_url_mobile']?.[0];
        if (previewMobileFile) {
          data.preview_url_mobile = `/uploads/templates/${previewMobileFile.filename}`;
        }
      }

      const updated = await TemplateModel.update(id, data);
      if (!updated) return errorResponse(res, 'Gagal memperbarui template', 400);
      successResponse(res, { message: 'Template berhasil diupdate', data });
    } catch (error) {
      next(error);
    }
  }
  
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await TemplateModel.delete(id);
      if (!deleted) return errorResponse(res, 'Template tidak ditemukan', 404);
      successResponse(res, { message: 'Template berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TemplateController();