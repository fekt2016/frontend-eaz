import { describe, it, expect } from "vitest";
import { isAdminRole, landingPathForRole } from "./roles";

describe("isAdminRole", () => {
  it("treats admin and superadmin as admin", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(true);
  });

  it("rejects staff, technician, user, and missing role", () => {
    expect(isAdminRole("staff")).toBe(false);
    expect(isAdminRole("technician")).toBe(false);
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("landingPathForRole (T29)", () => {
  it("sends admin and superadmin to the Overview page", () => {
    expect(landingPathForRole("admin")).toBe("/dashboard");
    expect(landingPathForRole("superadmin")).toBe("/dashboard");
  });

  it("sends staff to the Sell page", () => {
    expect(landingPathForRole("staff")).toBe("/dashboard/pos/sell");
  });

  it("sends technician to the jobs page, unchanged", () => {
    expect(landingPathForRole("technician")).toBe("/dashboard/pos");
  });

  it("sends everyone else (customers, missing role) to the homepage", () => {
    expect(landingPathForRole("user")).toBe("/");
    expect(landingPathForRole(undefined)).toBe("/");
  });
});
