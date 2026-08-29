import { describe, it, expect, vi, afterEach } from "vitest";
import { api, errorMessage } from "./api";

function mockFetchOnce(status, body) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("api — error responses (T48)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("throws an Error carrying the backend's message and status", async () => {
    mockFetchOnce(404, { success: false, error: "Not found" });

    await expect(api.get("/nope")).rejects.toMatchObject({
      message: "Not found",
      status: 404,
    });
  });

  it("forwards extra response fields (e.g. requiresVerification, email) onto the Error", async () => {
    mockFetchOnce(403, {
      success: false,
      error: "Please verify your email before logging in.",
      requiresVerification: true,
      email: "kofi@t.com",
    });

    let caught;
    try {
      await api.post("/auth/login", { email: "kofi@t.com", password: "wrong" });
    } catch (e) {
      caught = e;
    }

    expect(caught.requiresVerification).toBe(true);
    expect(caught.email).toBe("kofi@t.com");
    expect(caught.message).toBe("Please verify your email before logging in.");
  });

  it("does not let a stray data.message/stack field clobber the real Error message/stack", async () => {
    mockFetchOnce(400, { success: false, error: "Real error", message: "decoy", stack: "decoy stack" });

    let caught;
    try {
      await api.get("/whatever");
    } catch (e) {
      caught = e;
    }

    expect(caught.message).toBe("Real error");
    expect(caught.stack).not.toBe("decoy stack");
  });

  it("still attaches field-level validation errors", async () => {
    mockFetchOnce(400, {
      success: false,
      error: "Validation failed",
      errors: [{ field: "email", message: "Invalid email" }],
    });

    let caught;
    try {
      await api.post("/auth/register", {});
    } catch (e) {
      caught = e;
    }

    expect(caught.errors).toEqual([{ field: "email", message: "Invalid email" }]);
  });
});

// T100: a Zod/Mongoose failure arrives as { error: 'Validation failed', errors: [...] }.
// Showing only the top-level string tells the user nothing when the actionable
// detail is already on the wire.
describe("errorMessage (T100)", () => {
  it("prefers the field detail over the generic top-level message", () => {
    const err = Object.assign(new Error("Validation failed"), {
      errors: [{ field: "phone", message: "Enter a valid Ghana number" }],
    });

    expect(errorMessage(err)).toBe("Phone: Enter a valid Ghana number");
  });

  it("keeps the message for non-validation errors", () => {
    expect(errorMessage(new Error("Not found"))).toBe("Not found");
    expect(errorMessage(Object.assign(new Error("Boom"), { errors: [] }))).toBe("Boom");
  });

  it("falls back when there is no message at all", () => {
    expect(errorMessage({}, "Checkout failed.")).toBe("Checkout failed.");
    expect(errorMessage(undefined, "Checkout failed.")).toBe("Checkout failed.");
  });

  it("does not repeat a field name the message already mentions", () => {
    const leads = Object.assign(new Error("Validation failed"), {
      errors: [{ field: "email", message: "Email is required" }],
    });
    expect(errorMessage(leads)).toBe("Email is required");

    const mentions = Object.assign(new Error("Validation failed"), {
      errors: [{ field: "pickupLocationId", message: "A pickup location is required." }],
    });
    expect(errorMessage(mentions)).toBe("A pickup location is required.");
  });

  it("labels Zod's bare defaults, which say nothing on their own", () => {
    const err = Object.assign(new Error("Validation failed"), {
      errors: [
        { field: "phone", message: "Required" },
        { field: "region", message: "Expected string, received number" },
      ],
    });

    expect(errorMessage(err)).toBe(
      "Phone: Required Region: Expected string, received number",
    );
  });

  it("strips array indices out of nested field paths", () => {
    const err = Object.assign(new Error("Validation failed"), {
      errors: [{ field: "items.0.productId", message: "is not a valid id" }],
    });

    expect(errorMessage(err)).toBe("Product id: is not a valid id");
  });

  it("caps how many field errors it shows and counts the rest", () => {
    const err = Object.assign(new Error("Validation failed"), {
      errors: [
        { field: "a", message: "one" },
        { field: "b", message: "two" },
        { field: "c", message: "three" },
        { field: "d", message: "four" },
        { field: "e", message: "five" },
      ],
    });

    expect(errorMessage(err)).toBe("A: one B: two C: three (+2 more)");
  });

  it("ignores entries with no usable message", () => {
    const err = Object.assign(new Error("Validation failed"), {
      errors: [{ field: "phone" }, null, { field: "email", message: "  " }],
    });

    expect(errorMessage(err)).toBe("Validation failed");
  });

  // Captured verbatim from POST /api/v1/shipping/quote against the real backend —
  // this is the body the checkout page's quote handler actually receives.
  it("surfaces the detail an api.post rejection carries end to end", async () => {
    mockFetchOnce(400, {
      success: false,
      error: "Validation failed",
      errors: [
        { field: "items", message: "At least one item is required" },
        { field: "pickupLocationId", message: "A pickup location is required for bus-station pickup." },
      ],
    });

    let caught;
    try {
      await api.post("/shipping/quote", {});
    } catch (e) {
      caught = e;
    }

    expect(caught.message).toBe("Validation failed"); // wrapper unchanged
    expect(errorMessage(caught, "We could not work out delivery for that address.")).toBe(
      "At least one item is required A pickup location is required for bus-station pickup.",
    );
  });
});
