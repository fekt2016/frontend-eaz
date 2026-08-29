// T83: reports, suppliers and warranty are management surfaces — admin and
// superadmin only. The backend gates the matching APIs; this asserts the route
// itself bounces, so a staff member with a bookmarked URL never loads the page.
import { describe, it, expect, vi, beforeEach } from "vitest";

const jwtVerify = vi.fn();
vi.mock("jose", () => ({ jwtVerify: (...a) => jwtVerify(...a) }));

// The maintenance check calls the backend; keep it inert and inactive.
global.fetch = vi.fn().mockResolvedValue({
  json: async () => ({ success: true, data: { maintenanceActive: false } }),
});

import { middleware } from "./middleware";

function request(pathname, { token = "t" } = {}) {
  const url = `https://eazworld.co${pathname}`;
  return {
    nextUrl: { pathname },
    url,
    cookies: { get: () => (token ? { value: token } : undefined) },
  };
}

const ADMIN_ONLY = [
  "/dashboard/pos/reports",
  "/dashboard/pos/suppliers",
  "/dashboard/pos/suppliers/abc123",
  "/dashboard/pos/warranty",
];

describe("middleware — POS management surfaces (T83)", () => {
  beforeEach(() => vi.clearAllMocks());

  for (const role of ["staff", "technician"]) {
    it(`redirects ${role} away from every management route`, async () => {
      jwtVerify.mockResolvedValue({ payload: { role } });

      for (const path of ADMIN_ONLY) {
        const res = await middleware(request(path));
        expect({ path, location: res.headers.get("location") })
          .toEqual({ path, location: "https://eazworld.co/dashboard/pos" });
      }
    });
  }

  for (const role of ["admin", "superadmin"]) {
    it(`lets ${role} through`, async () => {
      jwtVerify.mockResolvedValue({ payload: { role } });

      for (const path of ADMIN_ONLY) {
        const res = await middleware(request(path));
        expect({ path, redirected: !!res.headers.get("location") })
          .toEqual({ path, redirected: false });
      }
    });
  }

  it("still lets staff reach the counter routes", async () => {
    jwtVerify.mockResolvedValue({ payload: { role: "staff" } });

    for (const path of ["/dashboard/pos", "/dashboard/pos/sell", "/dashboard/pos/jobs"]) {
      const res = await middleware(request(path));
      expect({ path, redirected: !!res.headers.get("location") })
        .toEqual({ path, redirected: false });
    }
  });
});
