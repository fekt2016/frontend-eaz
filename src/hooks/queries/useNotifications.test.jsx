import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), patch: vi.fn() } }));
import { api } from "@/lib/api";
import {
  useUnreadNotificationCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "./useNotifications";

function wrapper({ children }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useUnreadNotificationCount (T12)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hits GET /notifications/unread-count and returns the count", async () => {
    api.get.mockResolvedValueOnce({ success: true, data: { count: 3 } });
    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/notifications/unread-count");
    expect(result.current.data).toBe(3);
  });

  it("defaults to 0 when the response has no count", async () => {
    api.get.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUnreadNotificationCount(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(0);
  });
});

describe("useNotifications (T12)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hits GET /notifications with no query string by default", async () => {
    api.get.mockResolvedValueOnce({ data: [], total: 0 });
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/notifications");
  });

  it("appends unreadOnly, page, and limit when given", async () => {
    api.get.mockResolvedValueOnce({ data: [], total: 0 });
    const { result } = renderHook(() => useNotifications({ unreadOnly: true, page: 2, limit: 10 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/notifications?unreadOnly=true&page=2&limit=10");
  });

  it("returns { data, total } shaped from the response", async () => {
    const items = [{ _id: "1", title: "A" }];
    api.get.mockResolvedValueOnce({ data: items, total: 5 });
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ data: items, total: 5 });
  });
});

describe("notification mutations (T12)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("useMarkNotificationRead PATCHes /notifications/:id/read", async () => {
    api.patch.mockResolvedValueOnce({ data: { _id: "1", read: true } });
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper });
    result.current.mutate("1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.patch).toHaveBeenCalledWith("/notifications/1/read", {});
  });

  it("useMarkAllNotificationsRead PATCHes /notifications/read-all", async () => {
    api.patch.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.patch).toHaveBeenCalledWith("/notifications/read-all", {});
  });
});
