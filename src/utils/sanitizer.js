// Strip HTML tags and dangerous characters
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // strip JS protocol
    .replace(/on\w+\s*=/gi, '')         // strip event handlers
    .trim();
}

export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function sanitizeMiddleware(req, _res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  next();
}
