const AnalyticsModel = require('../models/AnalyticsModel');
const UserModel = require('../models/UserModel');
const { successResponse, errorResponse } = require('../utils/responseHelper');

class AdminController {
  async trackPageView(req, res, next) {
    try {
      const { page_path, visitor_id } = req.body;
      const user_agent = req.headers['user-agent'] || null;
      const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

      if (!page_path || !visitor_id) {
        return errorResponse(res, 'page_path dan visitor_id wajib diisi', 400);
      }

      await AnalyticsModel.recordPageView({
        page_path,
        visitor_id,
        user_agent,
        ip_address
      });

      return successResponse(res, { message: 'Pageview recorded' }, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsSummary(req, res, next) {
    try {
      const summary = await AnalyticsModel.getSummary();
      return successResponse(res, { data: summary });
    } catch (error) {
      next(error);
    }
  }

  async getUsersList(req, res, next) {
    try {
      const users = await UserModel.getAllUsers();
      return successResponse(res, { data: users });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
