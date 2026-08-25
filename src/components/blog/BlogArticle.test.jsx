import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import BlogArticle from "./BlogArticle";

// T42: post content was markdown->HTML-converted with regex and injected via
// dangerouslySetInnerHTML with no escaping. The danger isn't raw HTML making
// it through a backend filter — it's these regexes *constructing* dangerous
// HTML from plain-looking text (a markdown link with a javascript: href has
// no `<`/`>` at all). DOMPurify.sanitize now wraps every constructed HTML
// string with a strict allowlist (<strong>, <a href> safe-scheme-only)
// right before render, regardless of what produced it.

function mockFetchFor(postData) {
  global.fetch = vi.fn((url) => {
    if (typeof url === "string" && /\/api\/v1\/posts\/[^/]+$/.test(url)) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: postData }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
  });
}

function makePost(content) {
  return {
    slug: "test-post",
    title: "Test Post",
    excerpt: "An excerpt",
    author: "A Author",
    category: "SEO",
    readTime: "3 min",
    content,
  };
}

describe("BlogArticle — stored-XSS via dangerouslySetInnerHTML (T42)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("strips a <script> tag embedded in post content", async () => {
    mockFetchFor(makePost('Before script. <script>window.__t42xss = true;</script> After script.'));
    const { container } = render(<BlogArticle slug="test-post" />);

    await screen.findByText(/Before script/);

    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML).not.toContain("<script");
  });

  it("strips an onerror attribute (and the disallowed <img> tag carrying it)", async () => {
    mockFetchFor(makePost('Before img. <img src=x onerror="window.__t42xss2=true"> After img.'));
    const { container } = render(<BlogArticle slug="test-post" />);

    await screen.findByText(/Before img/);

    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).not.toContain("onerror");
  });

  it("neutralizes a javascript: URL in a markdown link", async () => {
    mockFetchFor(makePost("[Click here](javascript:window.__t42xss3=true)"));
    const { container } = render(<BlogArticle slug="test-post" />);

    await screen.findByText(/Click here/);

    expect(container.innerHTML).not.toContain("javascript:");
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });

  it("still renders normal bold and link markdown unchanged", async () => {
    mockFetchFor(makePost("This is **bold text** and a [real link](https://example.com)."));
    render(<BlogArticle slug="test-post" />);

    const strong = await screen.findByText("bold text");
    expect(strong.tagName).toBe("STRONG");
    expect(strong).toHaveClass("font-semibold");

    const link = screen.getByRole("link", { name: "real link" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("keeps the bare (unstyled) <strong> in list items, matching the pre-existing distinction", async () => {
    mockFetchFor(makePost("- A **bold** list item"));
    render(<BlogArticle slug="test-post" />);

    const strong = await screen.findByText("bold");
    expect(strong.tagName).toBe("STRONG");
    expect(strong.className).toBe("");
  });
});
