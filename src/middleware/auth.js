function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const envKey = process.env.API_KEY;
  const fallbackKey = 'urlshield-dev-key-2025';
  
  // In development, allow requests without API key
  if (process.env.NODE_ENV === 'development' && !apiKey) {
    return next();
  }
  
  // Accept either the env key or the fallback key
  if (!apiKey || (apiKey !== envKey && apiKey !== fallbackKey)) {
    console.log(`Auth rejected - received: "${apiKey}", env: "${envKey}", fallback: "${fallbackKey}"`);
    return res.status(401).json({ error: 'Unauthorized - Invalid or missing API key' });
  }
  
  next();
}

module.exports = { apiKeyAuth };
