import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Reported 2026-08-31: hosting checkout showed "Could not check — enter manually
// or skip" for every domain.
//
// GET /domain/search is one of the few endpoints that does NOT use the project's
// { success, data } envelope — it returns { domain, available, registered,
// price, results } at the TOP level. This page read `res.data?.results`, so
// `results` was always [], no match was ever found, and every lookup fell to the
// error branch.
//
// The domains page reads `res.results` and always worked. Two callers of one
// endpoint disagreeing about its shape is exactly how this survived: whichever
// page you tested, the other was the broken one.
const read = (p) => readFileSync(join(process.cwd(), "src", p), "utf8");

describe("domain search — both callers agree on the response shape", () => {
  it("hosting checkout reads results from the top level", () => {
    const src = read("app/hosting/checkout/page.jsx");
    expect(src).toMatch(/res\?\.results/);
  });

  it("the domains page reads results from the top level too", () => {
    const src = read("components/domains/DomainsSearch.jsx");
    expect(src).toMatch(/results:\s*allResults\s*=\s*\[\]\s*\}\s*=\s*res/);
  });

  // The specific regression: reading ONLY res.data.results silently yields []
  // rather than throwing, so the page degrades to "could not check" instead of
  // failing loudly. Nothing should go back to that.
  it("hosting checkout does not depend solely on res.data.results", () => {
    const src = read("app/hosting/checkout/page.jsx");
    const line = src.split("\n").find((l) => l.includes("const results ="));
    expect(line).toBeDefined();
    expect(line).toContain("res?.results");
  });
});
