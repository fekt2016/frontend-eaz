import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { makeQueryClient } from "./queryClient";

// The app updates itself by polling, not by pushing: the API runs under
// Passenger, which idles the app out and may run several processes, so a socket
// would hold nothing and reach only one of them (docs/HOSTING.md). These
// defaults ARE the feature — if they regress, screens quietly go stale and
// nothing fails loudly.
describe("QueryClient defaults keep screens live", () => {
  const defaults = () => makeQueryClient().getDefaultOptions().queries;

  it("refetches when the tab regains focus", () => {
    expect(defaults().refetchOnWindowFocus).toBe(true);
  });

  it("refetches after a dropped connection comes back", () => {
    expect(defaults().refetchOnReconnect).toBe(true);
  });

  it("polls the screen someone is watching", () => {
    expect(defaults().refetchInterval).toBe(30_000);
  });

  it("polls NOTHING while the tab is hidden", () => {
    // Without this a laptop left open overnight on the orders page spends the
    // night querying a 512MB backend.
    expect(defaults().refetchIntervalInBackground).toBe(false);
  });

  it("still dedupes bursts with a staleTime", () => {
    // Focus refetching is only free because staleTime holds it off: flicking
    // between tabs must not fire a request every time.
    expect(defaults().staleTime).toBe(30_000);
  });

  it("does not retry what a retry cannot fix", () => {
    const { retry } = defaults();
    expect(retry(0, { status: 401 })).toBe(false);
    expect(retry(0, { status: 403 })).toBe(false);
    expect(retry(0, { status: 404 })).toBe(false);
    expect(retry(0, { status: 500 })).toBe(true);
  });
});

// Screens that EDIT data must not have it pulled out from under the editor.
// business-settings seeds its forms with
//   useEffect(() => setForm({ ...data }), [data])
// so a poll landing mid-edit hands that effect a new object identity and wipes
// whatever the admin was typing. These three hooks opt out of the interval and
// keep only focus/reconnect refetching, which fires when the tab was away —
// never while someone is typing.
describe("Settings hooks opt out of polling", () => {
  // Asserted against the source rather than by rendering: the claim is about
  // what the hook passes to useQuery, and reading it is both exact and stable.
  const read = (f) => readFileSync(resolve(__dirname, f), "utf8");

  /** One hook's source, from its declaration to the next export. */
  const hookBody = (src, fn) => {
    const from = src.indexOf(`export function ${fn}`);
    expect(from).toBeGreaterThan(-1);
    const rest = src.slice(from + 1);
    const next = rest.indexOf("\nexport ");
    return next === -1 ? rest : rest.slice(0, next);
  };

  it("useSettings sets refetchInterval: false", () => {
    expect(hookBody(read("../hooks/queries/useSettings.js"), "useSettings"))
      .toMatch(/refetchInterval:\s*false/);
  });

  it("useShippingSettings and useCourierRate do too", () => {
    const src = read("../hooks/queries/useShippingAdmin.js");
    for (const fn of ["useShippingSettings", "useCourierRate"]) {
      expect(hookBody(src, fn)).toMatch(/refetchInterval:\s*false/);
    }
  });

  it("keeps the opt-out BEFORE the options spread, so a caller can override", () => {
    // Order matters: after the spread it would be unoverridable, which is not
    // what an opt-out means.
    for (const f of ["../hooks/queries/useSettings.js", "../hooks/queries/useShippingAdmin.js"]) {
      const src = read(f);
      expect(src).not.toMatch(/\.\.\.options,\s*\n\s*refetchInterval: false/);
    }
  });
});
