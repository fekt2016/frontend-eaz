// Always use a relative path so requests go through Next.js rewrites (next.config.mjs).
// This avoids mixed-content errors on Amplify (HTTPS → HTTP backend) and keeps
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

export const api = {
  get:    (path, options)       => request(path, { method: 'GET', ...options }),
  post:   (path, body, options) => request(path, { method: 'POST',  body: JSON.stringify(body), ...options }),
  patch:  (path, body, options) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (path, options)       => request(path, { method: 'DELETE', ...options }),
  // Multipart upload — do NOT set Content-Type; browser sets it with boundary
  upload: (path, formData) => request(path, {
    method: 'POST',
    body: formData,
    headers: {}, // override default application/json
  }),
};
