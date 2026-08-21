import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T29: login used to send technician/admin to /dashboard/pos and
// superadmin/staff to /dashboard/pos/sell — admin/superadmin should land on
// the Overview page instead, and staff on Sell.
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockLogin = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

import LoginPage from "./page";

function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: "user@t.com" } });
  fireEvent.change(screen.getByPlaceholderText(/your password/i), { target: { value: "Password123!" } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("Login page — role-based landing redirect (T29)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockLogin.mockReset();
  });

  it("sends an admin to the Overview page, not /dashboard/pos", async () => {
    mockLogin.mockResolvedValue({ data: { user: { role: "admin" } } });
    render(<LoginPage />);
    fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("sends a superadmin to the Overview page", async () => {
    mockLogin.mockResolvedValue({ data: { user: { role: "superadmin" } } });
    render(<LoginPage />);
    fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("sends staff to the Sell page", async () => {
    mockLogin.mockResolvedValue({ data: { user: { role: "staff" } } });
    render(<LoginPage />);
    fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/pos/sell"));
  });

  it("still sends a technician to /dashboard/pos, unchanged", async () => {
    mockLogin.mockResolvedValue({ data: { user: { role: "technician" } } });
    render(<LoginPage />);
    fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/pos"));
  });

  it("still sends a customer to the homepage, unchanged", async () => {
    mockLogin.mockResolvedValue({ data: { user: { role: "user" } } });
    render(<LoginPage />);
    fillAndSubmit();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
  });
});
