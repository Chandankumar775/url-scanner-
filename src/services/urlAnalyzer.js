const crypto = require('crypto');
const {
  normalizeUrl,
  isShortener,
  hasSuspiciousTLD,
  checkBrandImpersonation,
  checkBaitKeywords,
  isIPAddress
} = require('../utils/urlUtils');

// In-memory cache for scan results (TTL: 1 hour)
const scanCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function generateScanId(url) {
  return crypto.createHash('sha256').update(url + Date.now()).digest('hex').substring(0, 16);
}

function getCachedResult(normalizedUrl) {
  const cached = scanCache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  scanCache.delete(normalizedUrl);
  return null;
}

function setCachedResult(normalizedUrl, data) {
  scanCache.set(normalizedUrl, { data, timestamp: Date.now() });
  // Prevent memory leak - limit cache size
  if (scanCache.size > 10000) {
    const firstKey = scanCache.keys().next().value;
    scanCache.delete(firstKey);
  }
}

async function analyzeUrl(rawUrl, source = 'unknown') {
  // Normalize URL
  const normalized = normalizeUrl(rawUrl);
  
  // Check cache
  const cached = getCachedResult(normalized.normalized);
  if (cached) {
    return { ...cached, cached: true };
  }
  
  const scanId = generateScanId(rawUrl);
  const reasons = [];
  let score = 0;
  
  // 1. IP address URL (high risk)
  if (isIPAddress(normalized.domain)) {
    score += 35;
    reasons.push('URL uses IP address instead of domain name');
  }
  
  // 2. URL Shortener (medium-high risk)
  if (isShortener(normalized.domain)) {
    score += 25;
    reasons.push('URL shortener detected - destination is hidden');
  }
  
  // 3. Suspicious TLD
  if (hasSuspiciousTLD(normalized.domain)) {
    score += 20;
    reasons.push('Suspicious top-level domain');
  }
  
  // 4. Brand impersonation
  const brandMatches = checkBrandImpersonation(normalized.domain);
  if (brandMatches.length > 0) {
    score += 30;
    reasons.push(`Possible impersonation of: ${brandMatches.join(', ')}`);
  }
  
  // 5. Bait keywords in path
  const baitKeywords = checkBaitKeywords(normalized.path);
  if (baitKeywords.length > 0) {
    score += 15;
    reasons.push(`Suspicious path keywords: ${baitKeywords.slice(0, 2).join(', ')}`);
  }
  
  // 6. Excessive subdomains
  const subdomainCount = normalized.domain.split('.').length - 2;
  if (subdomainCount > 2) {
    score += 10;
    reasons.push('Excessive number of subdomains');
  }
  
  // 7. Unusual port
  if (normalized.port !== '443' && normalized.port !== '80') {
    score += 15;
    reasons.push(`Unusual port number: ${normalized.port}`);
  }
  
  // 8. HTTP instead of HTTPS
  if (normalized.protocol === 'http') {
    score += 10;
    reasons.push('Insecure HTTP connection (no SSL)');
  }
  
  // 9. Long suspicious path
  if (normalized.path.length > 100) {
    score += 10;
    reasons.push('Unusually long URL path');
  }
  
  // 10. Hyphen abuse in domain (lookalike technique)
  const hyphenCount = (normalized.domain.match(/-/g) || []).length;
  if (hyphenCount > 2) {
    score += 10;
    reasons.push('Multiple hyphens in domain (common lookalike technique)');
  }
  
  // Cap score at 100
  score = Math.min(100, score);
  
  // Determine verdict
  let verdict;
  if (score < 20) verdict = 'safe';
  else if (score < 50) verdict = 'low_risk';
  else if (score < 75) verdict = 'medium_risk';
  else verdict = 'high_risk';
  
  // If no reasons found but score > 0, add generic reason
  if (reasons.length === 0 && score > 0) {
    reasons.push('Minor suspicious patterns detected');
  }
  
  // If completely safe
  if (score === 0) {
    reasons.push('No suspicious patterns detected');
  }
  
  const result = {
    scanId,
    url: rawUrl,
    normalizedUrl: normalized.normalized,
    domain: normalized.domain,
    source,
    score,
    verdict,
    reasons,
    redirectChain: isShortener(normalized.domain) ? [normalized.normalized, 'https://unknown-destination.com'] : [normalized.normalized],
    timestamp: new Date().toISOString(),
    cached: false
  };
  
  setCachedResult(normalized.normalized, result);
  return result;
}

async function expandUrl(shortUrl) {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'manual',
      timeout: 5000,
      headers: {
        'User-Agent': 'URL-Shield-Scanner/1.0'
      }
    });
    
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      return location || shortUrl;
    }
    return shortUrl;
  } catch (error) {
    return shortUrl;
  }
}

module.exports = {
  analyzeUrl,
  expandUrl,
  getCachedResult,
  setCachedResult
};
