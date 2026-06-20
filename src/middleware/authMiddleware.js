const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHelper');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return errorResponse(res, 'Access denied. No token provided', 401);
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Invalid token', 401);
  }
};