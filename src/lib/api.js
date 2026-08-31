// Always use a relative path so requests go through Next.js rewrites (next.config.mjs).
// This avoids mixed-content errors (HTTPS frontend → HTTP backend) and keeps
// CORS simple — the browser only ever talks to the same origin.
const BASE_URL = '/api/v1';

async function request(path, options = {}) {
  // If caller passes headers: {}, don't add Content-Type (multipart uploads)
  const defaultHeaders = options.headers && Object.keys(options.headers).length === 0
    ? {}
    : { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: defaultHeaders,
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    // Attach field-level errors (Zod / Mongoose validation) so forms can highlight fields
    if (Array.isArray(data?.errors)) err.errors = data.errors;
    err.status = res.status;
    // Forward any other response fields (e.g. requiresVerification, email) so
    // callers can branch on the real flag instead of matching error text.
    // (error/message/stack are skipped — they'd clobber the Error's own fields.)
    const SKIP_FIELDS = new Set(['error', 'message', 'stack']);
    for (const [key, value] of Object.entries(data || {})) {
      if (!SKIP_FIELDS.has(key)) err[key] = value;
    }
    throw err;
  }

  return data;
}

// Zod and Mongoose failures come back as
// { error: 'Validation failed', errors: [{ field, message }] } — the top-level
// string alone tells the user nothing, while the actionable detail is already on
// the wire and attached above. Prefer that detail. Exported so any form can use
// it, not only checkout.
const MAX_FIELD_ERRORS = 3;

function humanizeField(field) {
  // 'items.0.productId' → 'Product id'. Array indices are noise to a user.
  const leaf = String(field || '')
    .split('.')
    .filter((part) => part && !/^\d+$/.test(part))
    .pop();
  if (!leaf) return '';
  return leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

// True when the message already names the field, so a label would only repeat it:
// "A pickup location is required" for `pickupLocationId`. Compared word by word —
// a whole-string match misses the plural in `items` / "one item is required" and
// the dropped suffix in `pickupLocationId` / "pickup location".
function mentionsField(text, field) {
  const words = String(field || '')
    .split(/[.\-_]/)
    .flatMap((part) => part.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' '))
    .map((word) => word.toLowerCase().replace(/s$/, ''))
    .filter((word) => word && word !== 'id' && !/^\d+$/.test(word));

  const haystack = text.toLowerCase();
  return words.some((word) => haystack.includes(word));
}

function describeFieldError({ field, message }) {
  const text = String(message || '').trim();
  const label = humanizeField(field);
  if (!label || !text) return text;
  // Zod's own defaults are bare ("Required", "Expected string, received number"),
  // so the label is what makes them actionable. Hand-written backend messages
  // usually name the field already — prefixing those would just stutter.
  if (mentionsField(text, field)) return text;
  return `${label}: ${text}`;
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const fields = Array.isArray(err?.errors)
    ? err.errors.filter((e) => e && String(e.message || '').trim())
    : [];

  if (fields.length) {
    const shown = fields.slice(0, MAX_FIELD_ERRORS).map(describeFieldError).join(' ');
    const hidden = fields.length - MAX_FIELD_ERRORS;
    return hidden > 0 ? `${shown} (+${hidden} more)` : shown;
  }

  return err?.message || fallback;
}

export const api = {
  get:    (path, options)       => request(path, { method: 'GET', ...options }),
  post:   (path, body, options) => request(path, { method: 'POST',  body: JSON.stringify(body), ...options }),
  put:    (path, body, options) => request(path, { method: 'PUT',   body: JSON.stringify(body), ...options }),
  patch:  (path, body, options) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (path, options)       => request(path, { method: 'DELETE', ...options }),
  // Multipart upload — do NOT set Content-Type; browser sets it with boundary
  upload: (path, formData) => request(path, {
    method: 'POST',
    body: formData,
    headers: {}, // override default application/json
  }),
};
