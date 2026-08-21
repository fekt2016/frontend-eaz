import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }));
import { api } from "@/lib/api";
import { usePublicParts } from "./usePublicParts";

function wrapper({ children }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("usePublicParts (repair parts search)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hits GET /track/parts with no query string when no params are given", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => usePublicParts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/track/parts");
  });

  it("appends the search term q when provided", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => usePublicParts({ q: "iphone 13 screen" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/track/parts?q=iphone+13+screen");
  });

  it("trims a whitespace-only query to no q param", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => usePublicParts({ q: "   " }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/track/parts");
  });

  it("includes category but omits the sentinel 'all'", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => usePublicParts({ category: "Screen" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/track/parts?category=Screen");

    vi.clearAllMocks();
    api.get.mockResolvedValueOnce({ data: [] });
    const { result: r2 } = renderHook(() => usePublicParts({ category: "all" }), { wrapper });
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/track/parts");
  });

  it("combines q and category in one query string", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => usePublicParts({ q: "battery", category: "Battery" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/track/parts?q=battery&category=Battery");
  });

  it("defaults to an empty array when the response has no data", async () => {
    api.get.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePublicParts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("respects an options.enabled=false override (no fetch at all)", () => {
    const { result } = renderHook(() => usePublicParts({ q: "x" }, { enabled: false }), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.get).not.toHaveBeenCalled();
  });
});
