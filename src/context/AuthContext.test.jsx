import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
import { api } from "@/lib/api";

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches the current user on mount and clears loading", async () => {
    api.get.mockResolvedValueOnce({ data: { user: { name: "Ama", role: "customer" } } });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ name: "Ama", role: "customer" });
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });

  it("sets user to null when /auth/me fails (not logged in)", async () => {
    api.get.mockRejectedValueOnce(new Error("401"));
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("login sets the user on success", async () => {
    api.get.mockResolvedValueOnce({ data: { user: null } });
    api.post.mockResolvedValueOnce({ data: { user: { name: "Kofi", role: "staff" } } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("kofi@t.com", "pw");
    });

    expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "kofi@t.com", password: "pw" });
    expect(result.current.user).toEqual({ name: "Kofi", role: "staff" });
  });

  it("login does not set the user when 2FA is required", async () => {
    api.get.mockResolvedValueOnce({ data: { user: null } });
    api.post.mockResolvedValueOnce({ data: { requiresTwoFactor: true } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("kofi@t.com", "pw");
    });

    expect(result.current.user).toBeNull();
  });

  it("login rethrows api.js's error unchanged, including requiresVerification/email (T48)", async () => {
    // api.js (mocked here) is what attaches requiresVerification/email onto the
    // Error now — login() just needs to pass it through untouched, no more
    // message-text matching.
    api.get.mockResolvedValueOnce({ data: { user: null } });
    const err = new Error("Please verify your email before logging in.");
    err.requiresVerification = true;
    err.email = "kofi@t.com";
    api.post.mockRejectedValueOnce(err);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let caught;
    await act(async () => {
      try {
        await result.current.login("kofi@t.com", "wrong");
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBe(err);
    expect(caught.requiresVerification).toBe(true);
    expect(caught.email).toBe("kofi@t.com");
  });

  it("login rethrows unrelated errors without requiresVerification", async () => {
    api.get.mockResolvedValueOnce({ data: { user: null } });
    api.post.mockRejectedValueOnce(new Error("Invalid credentials"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let caught;
    await act(async () => {
      try {
        await result.current.login("kofi@t.com", "wrong");
      } catch (e) {
        caught = e;
      }
    });

    expect(caught.message).toBe("Invalid credentials");
    expect(caught.requiresVerification).toBeUndefined();
  });

  it("logout clears the user even if the API call fails", async () => {
    api.get.mockResolvedValueOnce({ data: { user: { name: "Ama" } } });
    api.post.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual({ name: "Ama" }));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it("register does not set the user (account needs verification first)", async () => {
    api.get.mockResolvedValueOnce({ data: { user: null } });
    api.post.mockResolvedValueOnce({ data: { requiresVerification: true } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let returned;
    await act(async () => {
      returned = await result.current.register("Ama", "ama@t.com", "0240000000", "pw");
    });

    expect(api.post).toHaveBeenCalledWith("/auth/register", {
      name: "Ama", email: "ama@t.com", phone: "0240000000", password: "pw",
    });
    expect(returned).toEqual({ requiresVerification: true });
    expect(result.current.user).toBeNull();
  });

  it("useAuth throws when used outside an AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used inside AuthProvider");
  });
});
