/**
 * Frontend sanitisation helpers.
 * Apply these on form submit — never strip characters on keystroke (bad UX).
 */

/** Strip HTML tags, JS protocol, and inline event handlers from any string */
export function sanitizeText(value, maxLength = 2000) {
  if (value == null) return '';
  return String(value)
    .trim()
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/javascript:/gi, '')      // strip JS protocol
    .replace(/on\w+\s*=/gi, '')       // strip event handlers  e.g. onclick=
    .slice(0, maxLength);
}

/** Trim + lowercase — never strip chars from email (let backend validate format) */
export function sanitizeEmail(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase().slice(0, 254);
}

/** Trim + strip HTML — keeps hyphens, apostrophes, accented chars */
export function sanitizeName(value, maxLength = 100) {
  if (value == null) return '';
  return String(value)
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .slice(0, maxLength);
}

/** Phone: keep only digits, +, -, (, ), spaces */
export function sanitizePhone(value) {
  if (value == null) return '';
  return String(value).trim().replace(/[^0-9+\-()\s]/g, '').slice(0, 20);
}

/** Domain: lowercase + only valid hostname characters */
export function sanitizeDomain(value) {
  if (value == null) return '';
  return String(value).trim().toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 253);
}

/** PIN / OTP: digits only */
export function sanitizePin(value) {
  if (value == null) return '';
  return String(value).replace(/\D/g, '').slice(0, 6);
}

/** Long-form text (messages, descriptions) — strips dangerous HTML but keeps content */
export function sanitizeMessage(value, maxLength = 5000) {
  if (value == null) return '';
  return String(value)
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=/gi, '')  // strip tags with event handlers
    .replace(/javascript:/gi, '')
    .slice(0, maxLength);
}

/** Sanitise a whole form-data object given a field→type map */
export function sanitizeForm(data, schema) {
  const out = {};
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in data)) continue;
    switch (type) {
      case 'email':   out[key] = sanitizeEmail(data[key]);   break;
      case 'phone':   out[key] = sanitizePhone(data[key]);   break;
      case 'name':    out[key] = sanitizeName(data[key]);    break;
      case 'domain':  out[key] = sanitizeDomain(data[key]);  break;
      case 'pin':     out[key] = sanitizePin(data[key]);     break;
      case 'message': out[key] = sanitizeMessage(data[key]); break;
      case 'text':    out[key] = sanitizeText(data[key]);    break;
      default:        out[key] = data[key];
    }
  }
  return out;
}
