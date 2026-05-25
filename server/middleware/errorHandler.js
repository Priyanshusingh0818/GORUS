const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formatErrors = (err.errors || err.issues || []).map((error) => ({
      path: error.path.join('.'),
      message: error.message,
    }));
    
    return res.status(400).json({
      message: 'Validation failed',
      errors: formatErrors,
    });
  }

  // Handle SQLite constraint errors (e.g. UNIQUE constraint failed)
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Fallback generic error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
