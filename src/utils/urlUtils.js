const URL = require('url').URL;
const punycode = require('punycode');

// Common URL shorteners
const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link',
  'is.gd', 'buff.ly', 'adf.ly', 'bitly.com', 'rb.gy', 'shorturl.at',
  'rebrand.ly', 'cutt.ly', 'short.io', 'bl.ink', 'lnkd.in'
]);

// Suspicious TLDs
const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'club', 'online',
  'site', 'icu', 'cyou', 'work', 'live', 'click', 'link'
]);

// Known brand lookalikes patterns
const BRAND_PATTERNS = [
  { brand: 'PayPal', patterns: ['paypa1', 'pay-pal', 'paypall', 'paypal-'] },
  { brand: 'Amazon', patterns: ['amaz0n', 'amazon-', 'amazn', 'amazzon'] },
  { brand: 'Apple', patterns: ['app1e', 'apple-', 'aple', 'applle'] },
  { brand: 'Google', patterns: ['g00gle', 'google-', 'gogle', 'googIe'] },
  { brand: 'Microsoft', patterns: ['micr0soft', 'microsoft-', 'microsft', 'rnicrosoft'] },
  { brand: 'Facebook', patterns: ['faceb00k', 'facebook-', 'facebok', 'fcebook'] },
  { brand: 'Netflix', patterns: ['netf1ix', 'netflix-', 'netfl1x', 'netfix'] },
  { brand: 'Bank', patterns: ['bank-', 'b4nk', 'ban-k', '-bank-'] }
];

// Credential/urgency bait keywords in path
const BAIT_KEYWORDS = [
  'login', 'signin', 'verify', 'confirm', 'update', 'secure', 'account',
  'password', 'credential', 'authenticate', 'validation', 'unlock',
  'suspend', 'limited', 'urgent', 'immediate', 'action-required'
];

function normalizeUrl(rawUrl) {
  let url = rawUrl.trim();
  
  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  try {
    const parsed = new URL(url);
    
    // Decode punycode
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('xn--')) {
      hostname = punycode.toUnicode(hostname);
    }
    
    // Remove www prefix
    hostname = hostname.replace(/^www\./, '');
    
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    
    // Rebuild URL
    let normalized = `${parsed.protocol}//${hostname}${parsed.pathname}`;
    if (parsed.search && parsed.searchParams.toString()) {
      normalized += `?${parsed.searchParams.toString()}`;
    }
    
    return {
      normalized,
      hostname,
      domain: hostname,
      path: parsed.pathname,
      protocol: parsed.protocol.replace(':', ''),
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80')
    };
  } catch (e) {
    return {
      normalized: url,
      hostname: url,
      domain: url,
      path: '/',
      protocol: 'https',
      port: '443',
      error: e.message
    };
  }
}

function isShortener(domain) {
  return SHORTENERS.has(domain.toLowerCase());
}

function hasSuspiciousTLD(domain) {
  const parts = domain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();
  return SUSPICIOUS_TLDS.has(tld);
}

function checkBrandImpersonation(domain) {
  const lowerDomain = domain.toLowerCase();
  const matches = [];
  
  for (const { brand, patterns } of BRAND_PATTERNS) {
    for (const pattern of patterns) {
      if (lowerDomain.includes(pattern.toLowerCase())) {
        matches.push(brand);
        break;
      }
    }
  }
  
  return matches;
}

function checkBaitKeywords(path) {
  const lowerPath = path.toLowerCase();
  const found = [];
  
  for (const keyword of BAIT_KEYWORDS) {
    if (lowerPath.includes(keyword)) {
      found.push(keyword);
    }
  }
  
  return found;
}

function isIPAddress(hostname) {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    return parts.every(p => p >= 0 && p <= 255);
  }
  // IPv6 (simplified check)
  if (hostname.includes(':')) return true;
  return false;
}

function calculateDomainAgeScore(domain) {
  // In a real implementation, this would query WHOIS data
  // For MVP, we return a neutral score component
  return { score: 0, reason: null };
}

function extractUrls(text) {
  const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;
  return text.match(urlRegex) || [];
}

module.exports = {
  normalizeUrl,
  isShortener,
  hasSuspiciousTLD,
  checkBrandImpersonation,
  checkBaitKeywords,
  isIPAddress,
  calculateDomainAgeScore,
  extractUrls,
  SHORTENERS,
  SUSPICIOUS_TLDS
};
