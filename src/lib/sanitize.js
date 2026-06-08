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

/**
 * Normalize a Ghana phone number to 0XXXXXXXXX (10 digits, local format).
 * Strips spaces/dashes, converts +233/233 prefix to leading 0.
 * Returns the normalized string, or the raw digits if format is unrecognized.
 */
export function sanitizePhone(value) {
  if (value == null) return '';
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('233') && digits.length === 12) digits = '0' + digits.slice(3);
  if (digits.length === 9) digits = '0' + digits;
  return digits.slice(0, 10);
}

/** Use in onChange to allow only digit input (strips non-digits while typing) */
export function formatPhoneInput(value) {
  return String(value).replace(/\D/g, '').slice(0, 10);
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

/**
 * Validate password strength.
 * Returns an array of { rule, met } objects so UI can show a checklist.
 */
export function getPasswordRules(password) {
  return [
    { rule: "At least 8 characters",          met: password.length >= 8 },
    { rule: "One uppercase letter (A–Z)",      met: /[A-Z]/.test(password) },
    { rule: "One lowercase letter (a–z)",      met: /[a-z]/.test(password) },
    { rule: "One number (0–9)",                met: /[0-9]/.test(password) },
    { rule: "One symbol (@, #, $, ! …)",       met: /[^A-Za-z0-9]/.test(password) },
  ];
}

/** Returns error string if invalid, null if valid */
export function validatePassword(password) {
  const rules = getPasswordRules(password);
  const failed = rules.find((r) => !r.met);
  return failed ? failed.rule : null;
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
