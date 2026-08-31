/*
 * T103 — /seo is a permanent redirect to /services/seo.
 *
 * It used to be a "use client" component that called router.replace() in a
 * useEffect. That meant a crawler received an EMPTY page and only reached the
 * real one if it executed JavaScript, and the redirect never carried a status
 * code, so no link equity passed. `next.config.mjs` made it worse by sending
 * /service/seo → /seo, so the chain was 308 → blank page → client-side hop.
 *
 * Now a server-side permanentRedirect: one 308, no JavaScript required. The
 * route is kept rather than deleted because /seo is a real URL people may have
 * linked to — removing it would 404 those links instead of forwarding them.
 *
 * Also done for this: /service/seo now points straight at /services/seo (the
 * generic /service/:path* rule already handled it — the special case existed
 * only to create the detour), and /seo is out of the sitemap, where it competed
 * with /services/seo for the same content.
 */
import { permanentRedirect } from "next/navigation";

export default function SeoRedirect() {
  permanentRedirect("/services/seo");
}
