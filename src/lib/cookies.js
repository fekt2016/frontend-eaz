/**
 * Lightweight cookie helpers (client-side only)
 * Used in place of localStorage for cross-tab, SSR-compatible persistence.
 */

/**
 * Get a cookie value by name. Returns null if not found.
 */
export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/**
 * Set a cookie.
 * @param {string} name
 * @param {string} value
 * @param {object} opts
 * @param {number}  [opts.days=365]     - expiry in days (omit for session cookie)
 * @param {string}  [opts.path="/"]     - cookie path
 * @param {string}  [opts.sameSite="Lax"]
 */
export function setCookie(name, value, { days, path = "/", sameSite = "Lax" } = {}) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;
  if (isSecure) cookie += "; Secure";
  if (days != null) {
    const exp = new Date(Date.now() + days * 864e5);
    cookie += `; expires=${exp.toUTCString()}`;
  }
  document.cookie = cookie;
}

/**
 * Remove a cookie by setting it expired.
 */
export function removeCookie(name, path = "/") {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
