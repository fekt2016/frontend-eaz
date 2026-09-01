import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T33: extracted out of ProductForm.jsx (where it was gallery/variant-image-only)
// so the inventory Part form can reuse it instead of duplicating it.
const mockUpload = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { upload: (...args) => mockUpload(...args) },
  errorMessage: (err, fb = "") => err?.message || fb,
}));

import UploadButton from "./UploadButton";

function fileInput(container) {
  return container.querySelector('input[type="file"]');
}

describe("UploadButton", () => {
  beforeEach(() => {
    mockUpload.mockReset();
  });

  it("uploads the selected file to /uploads and calls onUploaded with the returned URL", async () => {
    mockUpload.mockResolvedValue({ data: { url: "https://res.cloudinary.com/demo/x.jpg" } });
    const onUploaded = vi.fn();
    const { container } = render(<UploadButton onUploaded={onUploaded} label="Upload photo" />);

    const file = new File(["fake"], "part.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput(container), { target: { files: [file] } });

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith("https://res.cloudinary.com/demo/x.jpg"));
    const [path, formData] = mockUpload.mock.calls[0];
    expect(path).toBe("/uploads");
    expect(formData.get("image")).toBe(file);
  });

  it("shows an error and does not call onUploaded when the upload fails", async () => {
    mockUpload.mockRejectedValue(new Error("Only image files are allowed."));
    const onUploaded = vi.fn();
    const { container } = render(<UploadButton onUploaded={onUploaded} />);

    fireEvent.change(fileInput(container), { target: { files: [new File(["x"], "x.jpg", { type: "image/jpeg" })] } });

    expect(await screen.findByText("Only image files are allowed.")).toBeInTheDocument();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("does nothing when the file picker is dismissed with no file chosen", async () => {
    const onUploaded = vi.fn();
    const { container } = render(<UploadButton onUploaded={onUploaded} />);

    fireEvent.change(fileInput(container), { target: { files: [] } });

    await new Promise((r) => setTimeout(r, 0));
    expect(mockUpload).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });
});
