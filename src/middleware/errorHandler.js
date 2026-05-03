function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: 'Validation Error', details: messages });
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate field value entered' });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }
  
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = { errorHandler };
