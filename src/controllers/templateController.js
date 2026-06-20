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
      const templateId = await TemplateModel.create(req.body);
      successResponse(res, { message: 'Template berhasil dibuat', data: { id: templateId } }, 201);
    } catch (error) {
      next(error);
    }
  }
  
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await TemplateModel.update(id, req.body);
      if (!updated) return errorResponse(res, 'Template tidak ditemukan', 404);
      successResponse(res, { message: 'Template berhasil diupdate' });
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