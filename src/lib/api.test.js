import { describe, it, expect, vi, afterEach } from "vitest";
import { api } from "./api";

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
