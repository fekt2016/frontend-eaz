import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T36: supplier detail contact card gains WhatsApp (wa.me link) and WeChat
// (copy-to-clipboard) alongside phone/email.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "sup1" }),
}));

const supplier = {
  _id: "sup1", name: "Shenzhen Parts Co",
  phone: "0244123456", whatsapp: "+8613800138000", wechat: "sz_parts_2024",
  email: "li@szparts.cn", isActive: true,
};

vi.mock("@/hooks/queries/useSuppliers", () => ({
  useSupplier: () => ({ data: { supplier, parts: [] }, isLoading: false, error: null }),
}));

import SupplierDetailPage from "./page";

describe("Supplier detail page — WhatsApp/WeChat contact (T36)", () => {
  it("renders a wa.me link for whatsapp", () => {
    render(<SupplierDetailPage />);

    const waLink = screen.getByText("+8613800138000").closest("a");
    expect(waLink).toHaveAttribute("href", "https://wa.me/8613800138000");
  });

  it("copies the wechat ID to the clipboard when clicked", async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    render(<SupplierDetailPage />);
    fireEvent.click(screen.getByText("sz_parts_2024"));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("sz_parts_2024"));
  });
});
