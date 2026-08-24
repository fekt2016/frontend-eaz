import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T34: main product images were a URL-only textarea; now reuses the same
// StringListEditor + Cloudinary UploadButton the variant/gallery fields use.
const mockUpload = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { upload: (...args) => mockUpload(...args) },
}));

import ProductForm from "./ProductForm";

function fileInput(container, index = 0) {
  return container.querySelectorAll('input[type="file"]')[index];
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("e.g. Wooden Dining Table"), {
    target: { value: "Test Product" },
  });
  fireEvent.change(screen.getByPlaceholderText("e.g. Furniture"), {
    target: { value: "Furniture" },
  });
  fireEvent.change(screen.getByPlaceholderText("e.g. 250.00"), {
    target: { value: "10.00" },
  });
}

describe("ProductForm — main images upload (T34)", () => {
  beforeEach(() => {
    mockUpload.mockReset();
  });

  it("uploads a local file for the main images field and submits it in images[]", async () => {
    mockUpload.mockResolvedValue({ data: { url: "https://res.cloudinary.com/demo/main.jpg" } });
    const onSubmit = vi.fn();
    const { container } = render(<ProductForm submitLabel="Create" onSubmit={onSubmit} />);

    fillRequiredFields();

    // First upload button on the page belongs to the main "Images" field.
    const file = new File(["fake"], "main.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput(container, 0), { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText("https://res.cloudinary.com/demo/main.jpg")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Create"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ images: ["https://res.cloudinary.com/demo/main.jpg"] })
    );
  });

  it("keeps a manually-typed URL working alongside upload", async () => {
    const onSubmit = vi.fn();
    render(<ProductForm submitLabel="Create" onSubmit={onSubmit} />);

    fillRequiredFields();

    fireEvent.change(screen.getAllByPlaceholderText("https://res.cloudinary.com/...")[0], {
      target: { value: "https://example.com/manual.jpg" },
    });
    fireEvent.click(screen.getAllByText("Add URL")[0]);

    fireEvent.click(screen.getByText("Create"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ images: ["https://example.com/manual.jpg"] })
    );
  });

  it("preserves an existing product's images exactly when saved untouched", () => {
    const onSubmit = vi.fn();
    const existingImages = [
      "https://res.cloudinary.com/demo/a.jpg",
      "https://res.cloudinary.com/demo/b.jpg",
      "https://res.cloudinary.com/demo/c.jpg",
    ];
    render(
      <ProductForm
        submitLabel="Save"
        onSubmit={onSubmit}
        initial={{
          name: "Existing",
          category: "Furniture",
          price: 1000,
          images: existingImages,
        }}
      />
    );

    // No interaction with the images field at all — just save.
    fireEvent.click(screen.getByText("Save"));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ images: existingImages }));
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("loads existing product images from `initial` and can remove one", () => {
    const onSubmit = vi.fn();
    render(
      <ProductForm
        submitLabel="Save"
        onSubmit={onSubmit}
        initial={{
          name: "Existing",
          category: "Furniture",
          price: 1000,
          images: ["https://res.cloudinary.com/demo/a.jpg", "https://res.cloudinary.com/demo/b.jpg"],
        }}
      />
    );

    expect(screen.getByText("https://res.cloudinary.com/demo/a.jpg")).toBeInTheDocument();
    expect(screen.getByText("https://res.cloudinary.com/demo/b.jpg")).toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText("Remove URL")[0]);
    fireEvent.click(screen.getByText("Save"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ images: ["https://res.cloudinary.com/demo/b.jpg"] })
    );
  });
});
