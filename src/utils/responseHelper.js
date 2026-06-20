const successResponse = (res, data = {}, statusCode = 200) => {
  res.status(statusCode).json({ success: true, ...data });
};

const errorResponse = (res, message = 'Terjadi kesalahan', statusCode = 500, errors = null) => {
  res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { successResponse, errorResponse };