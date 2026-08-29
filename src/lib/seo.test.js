import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// T97: SITE_URL feeds canonicals, metadataBase, Open Graph URLs, sitemap.xml and
// robots.txt. A localhost value shipped to production de-indexes the site with no
// runtime error, so production must refuse to build rather than fall back.
async function loadSeo() {
  vi.resetModules();
  return import("./seo");
}

describe("SITE_URL (T97)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("falls back to localhost in development when FRONTEND_URL is unset", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("FRONTEND_URL", undefined);
    const { SITE_URL } = await loadSeo();
    expect(SITE_URL).toBe("http://localhost:3000");
  });

  it("throws in production when FRONTEND_URL is unset", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FRONTEND_URL", undefined);
    await expect(loadSeo()).rejects.toThrow(/FRONTEND_URL is not set/);
  });

  it("treats a blank FRONTEND_URL as unset in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FRONTEND_URL", "   ");
    await expect(loadSeo()).rejects.toThrow(/FRONTEND_URL is not set/);
  });

  it("uses the configured origin in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FRONTEND_URL", "https://www.eazworld.co");
    const { SITE_URL } = await loadSeo();
    expect(SITE_URL).toBe("https://www.eazworld.co");
  });

  it("strips trailing slashes so `${SITE_URL}${path}` cannot double up", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FRONTEND_URL", "https://www.eazworld.co/");
    const { SITE_URL } = await loadSeo();
    expect(SITE_URL).toBe("https://www.eazworld.co");
    expect(`${SITE_URL}/shop`).toBe("https://www.eazworld.co/shop");
  });

  it("still builds canonical and OG URLs from the configured origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FRONTEND_URL", "https://www.eazworld.co");
    const { buildMetadata } = await loadSeo();
    const meta = buildMetadata({ title: "Shop", description: "d", path: "/shop" });
    expect(meta.alternates.canonical).toBe("https://www.eazworld.co/shop");
    expect(meta.openGraph.url).toBe("https://www.eazworld.co/shop");
  });
});
