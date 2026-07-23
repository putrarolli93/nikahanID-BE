const UserModel = require('../models/UserModel');
const { errorResponse } = require('../utils/responseHelper');

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'Akses ditolak. Silakan login terlebih dahulu.', 401);
    }

    // Check role in token or query database
    let role = req.user.role;
    if (!role) {
      const user = await UserModel.findById(req.user.id);
      role = user ? user.role : 'user';
    }

    if (role !== 'admin') {
      return errorResponse(res, 'Akses khusus Admin ditolak.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
