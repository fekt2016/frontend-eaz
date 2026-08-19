import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, onError, className, ...rest }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} className={className} data-rest={JSON.stringify(rest)} />
  ),
}));

import ProductImage, { PRODUCT_PLACEHOLDER } from "./ProductImage";

describe("ProductImage", () => {
  it("renders the local placeholder when no src is provided", () => {
    render(<ProductImage src="" alt="empty product" />);
    expect(screen.getByAltText("empty product")).toHaveAttribute("src", PRODUCT_PLACEHOLDER);
  });

  it("renders the remote image when it loads", () => {
    render(<ProductImage src="https://cdn.example/product.jpg" alt="loaded product" />);
    expect(screen.getByAltText("loaded product")).toHaveAttribute("src", "https://cdn.example/product.jpg");
  });

  it("swaps to the placeholder when the remote image fails to load", () => {
    render(<ProductImage src="https://broken.example/gone.jpg" alt="broken product" />);
    const img = screen.getByAltText("broken product");
    expect(img).toHaveAttribute("src", "https://broken.example/gone.jpg");
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", PRODUCT_PLACEHOLDER);
  });
});
