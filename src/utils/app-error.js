class AppError extends Error {
  constructor(statusCode, message, details = null, cause = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.cause = cause;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(400, message, details);
  }
}

class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(404, message, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message, details = null) {
    super(401, message, details);
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super(409, message, details);
  }
}

class DatabaseError extends AppError {
  constructor(message, cause = null) {
    super(500, message, null, cause);
  }
}

module.exports = {
  AppError,
  ConflictError,
  DatabaseError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
};
