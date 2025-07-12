/**
 * Error handling middleware
 */
function errorHandler(error, req, res, next) {
  console.error('❌ Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle different error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = isDevelopment ? error.details : null;
  } else if (error.name === 'SyntaxError' && error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.code === 'EACCES') {
    statusCode = 403;
    message = 'Permission denied';
  } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  } else if (error.message.includes('timeout')) {
    statusCode = 408;
    message = 'Request timeout';
  } else if (error.message.includes('limit')) {
    statusCode = 413;
    message = 'Payload too large';
  }

  // Custom error response
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  // Add details in development mode
  if (isDevelopment) {
    errorResponse.details = details || error.message;
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

export default errorHandler;
