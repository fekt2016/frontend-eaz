import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T36: suppliers are increasingly sourced from China, contacted over
// WhatsApp/WeChat rather than phone/email. Covers the list row rendering a
// wa.me link + WeChat badge, and the add form submitting both fields.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "superadmin" } }),
}));

const supplier = {
  _id: "sup1", name: "Shenzhen Parts Co", contactPerson: "Li Wei",
  phone: "0244123456", whatsapp: "+8613800138000", wechat: "sz_parts_2024",
  email: "li@szparts.cn", isActive: true,
};

const mockCreate = vi.fn();
vi.mock("@/hooks/queries/useSuppliers", () => ({
  useSuppliers: () => ({ data: [supplier], isLoading: false }),
  useCreateSupplier: () => ({ mutate: mockCreate, isPending: false }),
  useUpdateSupplier: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSupplier: () => ({ mutate: vi.fn(), isPending: false }),
}));

import SuppliersPage from "./page";

describe("Suppliers page — WhatsApp/WeChat contact (T36)", () => {
  it("renders a wa.me link and the WeChat ID in the supplier row", () => {
    render(<SuppliersPage />);

    const waLink = screen.getByText("+8613800138000").closest("a");
    expect(waLink).toHaveAttribute("href", "https://wa.me/8613800138000");
    expect(screen.getByText("sz_parts_2024")).toBeInTheDocument();
  });

  it("submits whatsapp and wechat when adding a new supplier", () => {
    render(<SuppliersPage />);

    fireEvent.click(screen.getByRole("button", { name: /add supplier/i }));
    fireEvent.change(screen.getByPlaceholderText(/Accra Mobile Parts/i), { target: { value: "Guangzhou Screens" } });
    fireEvent.change(screen.getByPlaceholderText(/138 0013 8000/), { target: { value: "+8613900139000" } });
    fireEvent.change(screen.getByPlaceholderText(/sz_parts_2024/), { target: { value: "gz_screens" } });
    fireEvent.click(screen.getByRole("button", { name: /save supplier/i }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Guangzhou Screens", whatsapp: "+8613900139000", wechat: "gz_screens" }),
      expect.any(Object),
    );
  });
});
