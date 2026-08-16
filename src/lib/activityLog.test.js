import { describe, it, expect } from "vitest";
import {
  actionLabel, resourceLabel, actorLabel, roleLabel,
  describeChanges, changesSummary, fmtDateTime,
  ACTIVITY_ACTION_LABELS,
} from "./activityLog";

describe("actionLabel", () => {
  it("maps every backend action constant to a friendly label", () => {
    const expected = Object.keys(ACTIVITY_ACTION_LABELS);
    expect(expected.length).toBeGreaterThan(30);
    for (const action of expected) {
      expect(actionLabel(action)).toBe(ACTIVITY_ACTION_LABELS[action]);
    }
  });

  it("falls back to the raw value for unknown actions", () => {
    expect(actionLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    expect(actionLabel(undefined)).toBe("—");
  });
});

describe("resourceLabel", () => {
  it("maps known resource types and falls back gracefully", () => {
    expect(resourceLabel("ORDER")).toBe("Order");
    expect(resourceLabel("REPAIR")).toBe("Repair Job");
    expect(resourceLabel("MYSTERY")).toBe("MYSTERY");
  });
});

describe("actorLabel", () => {
  it("prefers the actor name", () => {
    expect(actorLabel({ actorName: "Kwame", actorEmail: "k@e.com", actorRole: "admin" })).toBe("Kwame");
  });
  it("falls back to email", () => {
    expect(actorLabel({ actorName: "", actorEmail: "k@e.com", actorRole: "admin" })).toBe("k@e.com");
  });
  it("labels system actors as System", () => {
    expect(actorLabel(null)).toBe("System");
    expect(actorLabel({ actorRole: "system" })).toBe("System");
    expect(actorLabel({})).toBe("System");
  });
});

describe("roleLabel", () => {
  it("maps roles and falls back", () => {
    expect(roleLabel("superadmin")).toBe("Super Admin");
    expect(roleLabel("system")).toBe("System");
    expect(roleLabel("nope")).toBe("nope");
  });
});

describe("describeChanges", () => {
  it("summarises a status transition", () => {
    expect(describeChanges([{ field: "status", label: "Status", before: "pending", after: "processing" }]))
      .toBe("Status: pending → processing");
  });

  it("handles null before/after and multiple fields", () => {
    const s = describeChanges([
      { field: "note", label: "Tracking Note", before: null, after: "Handed to courier" },
      { field: "status", label: "Status", before: "pending", after: null },
    ]);
    expect(s).toBe("Tracking Note: — → Handed to courier · Status: pending → —");
  });

  it("returns empty string for no changes", () => {
    expect(describeChanges([])).toBe("");
    expect(describeChanges(undefined)).toBe("");
  });
});

describe("changesSummary", () => {
  it("joins changes into a single-line string", () => {
    expect(changesSummary([{ label: "Qty", before: "3", after: "10" }])).toBe("Qty: 3 → 10");
    expect(changesSummary([{ label: "Qty", before: "3", after: "10" }, { label: "Price", before: "100", after: "200" }]))
      .toBe("Qty: 3 → 10; Price: 100 → 200");
  });
});

describe("fmtDateTime", () => {
  it("formats a valid ISO string and tolerates bad input", () => {
    expect(fmtDateTime("2026-08-15T10:00:00.000Z")).toContain("2026");
    expect(fmtDateTime(null)).toBe("—");
    expect(fmtDateTime(undefined)).toBe("—");
  });
});
