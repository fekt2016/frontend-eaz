import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// T127 — "sanitize form input on submit with lib/sanitize.js" is stated in both
// STYLE_GUIDE.md and CLAUDE.md, and the shop's highest-value form was the one
// place it was skipped: checkout posted name, phone, email and address with
// `.trim()` and nothing else.
//
// This is a source-level test on purpose. The alternative — driving each page
// and inspecting the posted body — needs the full render harness for six pages
// and would still not stop a SEVENTH page being added without a sanitiser. What
// actually decays here is the convention, so the convention is what is guarded.
//
// It pairs with backend T125, which added the matching caps and email validation
// on Order.customer. Before both, neither layer bounded the input.

const ROOT = join(process.cwd(), "src", "app");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

// Public, data-posting pages that must sanitise on submit.
const MUST_SANITISE = [
  "checkout/page.jsx",
  "hosting/checkout/page.jsx",
  "track/[token]/page.jsx",
  "auth/verify/page.jsx",
  "auth/verify-2fa/page.jsx",
];

describe("T127 — public forms sanitise on submit", () => {
  it.each(MUST_SANITISE)("%s imports from lib/sanitize", (rel) => {
    expect(read(rel)).toMatch(/from ["']@\/lib\/sanitize["']/);
  });

  it("checkout sanitises every customer field it sends", () => {
    const src = read("checkout/page.jsx");
    expect(src).toMatch(/name:\s*sanitizeName\(/);
    expect(src).toMatch(/phone:\s*sanitizePhone\(/);
    expect(src).toMatch(/sanitizeEmail\(/);
    expect(src).toMatch(/sanitizeText\(addressLine\(/);
  });

  it("hosting checkout sanitises the registrant details", () => {
    const src = read("hosting/checkout/page.jsx");
    for (const fn of ["sanitizeName", "sanitizeEmail", "sanitizePhone", "sanitizeText"]) {
      expect(src).toContain(fn);
    }
  });

  it("the PIN forms use sanitizePin, which exists for exactly this", () => {
    expect(read("auth/verify/page.jsx")).toMatch(/pin:\s*sanitizePin\(/);
    expect(read("auth/verify-2fa/page.jsx")).toMatch(/pin:\s*sanitizePin\(/);
  });

  // The deliberate exception, and the reason it is written down: running a
  // sanitiser over a password would CORRUPT valid passwords containing the
  // characters a strong one is supposed to have. That page validates with a Zod
  // schema instead, which is the correct tool. T127 listed it only because the
  // audit grepped for `sanitize[A-Z]` and found none.
  it("reset-password validates the password and does NOT sanitise it", () => {
    const src = read("auth/reset-password/[token]/page.jsx");
    expect(src).toMatch(/safeParse\(\s*\{\s*password\s*\}\s*\)/);
    expect(src).not.toMatch(/sanitize[A-Z]\w*\(\s*password/);
  });

  // Sanitising as the user types fights them mid-word. The rule is on submit.
  it("no page sanitises inside an onChange handler", () => {
    for (const rel of MUST_SANITISE) {
      const src = read(rel);
      const onChangeWithSanitiser = /onChange=\{[^}]*sanitize[A-Z]/.test(src);
      expect(onChangeWithSanitiser).toBe(false);
    }
  });
});
