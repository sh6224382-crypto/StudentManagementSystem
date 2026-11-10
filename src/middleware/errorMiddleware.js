function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(', ');
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid student ID';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'A student with this email already exists';
  } else if (statusCode === 500) {
    console.error(error);
    message = 'Internal server error';
  }

  res.status(statusCode).json({ error: message });
}

module.exports = { errorHandler, notFound };
