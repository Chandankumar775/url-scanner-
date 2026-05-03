function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'urlshield-dev-key-2024';
  
  // In development, allow requests without API key
  if (process.env.NODE_ENV === 'development' && !apiKey) {
    return next();
  }
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized - Invalid or missing API key' });
  }
  
  next();
}

module.exports = { apiKeyAuth };
