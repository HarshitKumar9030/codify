import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  // Generate unique request ID
  req.id = uuidv4();
  
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'unknown';

  // Log request start
  console.log(`📝 ${method} ${url} - ${ip} - ${req.id} - ${userAgent}`);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const contentLength = res.get('Content-Length') || 'unknown';

    // Determine log level based on status code
    const logLevel = statusCode >= 500 ? '❌' : 
                    statusCode >= 400 ? '⚠️' : 
                    statusCode >= 300 ? '🔄' : '✅';

    console.log(`${logLevel} ${method} ${url} - ${statusCode} - ${duration}ms - ${contentLength}bytes - ${req.id}`);

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

export default requestLogger;
