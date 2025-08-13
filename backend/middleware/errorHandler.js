// Error handling middleware

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Database error handler
const handleDatabaseError = (error) => {
  let message = "Database operation failed";
  let statusCode = 500;

  // Handle specific MySQL errors
  switch (error.code) {
    case "ER_DUP_ENTRY":
      message = "Duplicate entry found";
      statusCode = 409;
      break;
    case "ER_NO_REFERENCED_ROW_2":
      message = "Referenced record does not exist";
      statusCode = 400;
      break;
    case "ER_ROW_IS_REFERENCED_2":
      message = "Cannot delete record as it is referenced by other records";
      statusCode = 400;
      break;
    case "ER_DATA_TOO_LONG":
      message = "Data too long for field";
      statusCode = 400;
      break;
    case "ER_BAD_NULL_ERROR":
      message = "Required field cannot be null";
      statusCode = 400;
      break;
    case "ECONNREFUSED":
      message = "Database connection refused";
      statusCode = 503;
      break;
    case "ER_ACCESS_DENIED_ERROR":
      message = "Database access denied";
      statusCode = 503;
      break;
    default:
      if (error.message) {
        message = error.message;
      }
  }

  return new AppError(message, statusCode);
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Handle database errors
  if (error.code && error.code.startsWith("ER_")) {
    error = handleDatabaseError(error);
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    error = new AppError("Validation Error", 400);
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", 401);
  }

  if (error.name === "TokenExpiredError") {
    error = new AppError("Token expired", 401);
  }

  // Handle Multer errors (file upload)
  if (error.code === "LIMIT_FILE_SIZE") {
    error = new AppError("File too large", 400);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  const isOperational = error.isOperational || false;

  // Log error for debugging
  if (!isOperational || statusCode >= 500) {
    console.error("Error:", {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  }

  // Send error response
  const errorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== "production" && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Include error code if available
  if (error.code) {
    errorResponse.code = error.code;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      dashboard: "/api/v1/dashboard/*",
      health: "/health",
    },
  });
};

module.exports = {
  AppError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,
  handleDatabaseError,
};
