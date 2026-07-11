const { AppError } = require('../utils/app-error');

function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error && error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'تنسيق JSON غير صالح.',
    });
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error && error.message ? error.message : 'حدث خطأ داخلي في الخادم.';
  const responseBody = { message };

  if (error && error.details) {
    responseBody.errors = error.details;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(responseBody);
}

module.exports = errorMiddleware;
