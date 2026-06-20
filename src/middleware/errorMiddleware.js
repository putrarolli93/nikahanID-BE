const { errorResponse } = require('../utils/responseHelper');

module.exports = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'Data sudah ada', 409);
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return errorResponse(res, 'Referensi data tidak valid', 400);
  }
  
  errorResponse(res, err.message || 'Terjadi kesalahan pada server', 500);
};