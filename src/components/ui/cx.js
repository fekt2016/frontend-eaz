/**
 * Minimal class-name joiner.
 *
 * Deliberately not clsx/tailwind-merge: this codebase has no UI-kit dependency
 * and the audit's whole point was to stop adding parallel systems. Falsy values
 * are dropped so conditional classes read naturally:
 *
 *   cx("px-4", isActive && "bg-brand-500", className)
 *
 * Later classes win only if Tailwind's own source order says so — so variant
 * maps below never rely on override-by-position for colour, they select the
 * whole string up front.
 */
export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default cx;
