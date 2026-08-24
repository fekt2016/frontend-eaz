import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T17: registration now accepts email OR phone instead of requiring email.
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockRegister = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ register: mockRegister }),
}));

import RegisterPage from "./page";

const STRONG_PASSWORD = "Password123!";

function fillCommon() {
  fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "Ama" } });
  fireEvent.change(screen.getByPlaceholderText(/min 8 characters/i), { target: { value: STRONG_PASSWORD } });
  fireEvent.change(screen.getByPlaceholderText(/repeat password/i), { target: { value: STRONG_PASSWORD } });
  fireEvent.click(screen.getByRole("checkbox"));
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
}

describe("Register page — email OR phone (T17)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRegister.mockReset();
  });

  it("registers with email only and redirects to verify?email=...", async () => {
    mockRegister.mockResolvedValue({ requiresVerification: true, email: "ama@t.com" });
    render(<RegisterPage />);
    fillCommon();
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: "ama@t.com" } });
    submit();

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith("Ama", "ama@t.com", "", STRONG_PASSWORD));
    expect(mockPush).toHaveBeenCalledWith("/auth/verify?email=ama%40t.com");
  });

  it("registers with phone only (no email typed) and redirects to verify?phone=...", async () => {
    mockRegister.mockResolvedValue({ requiresVerification: true, phone: "0201234567" });
    render(<RegisterPage />);
    fillCommon();
    fireEvent.change(screen.getByPlaceholderText(/\+233/), { target: { value: "0201234567" } });
    submit();

    await waitFor(() => expect(mockRegister).toHaveBeenCalledWith("Ama", "", "0201234567", STRONG_PASSWORD));
    expect(mockPush).toHaveBeenCalledWith("/auth/verify?phone=0201234567");
  });

  it("rejects submission with neither email nor phone, without calling register", async () => {
    render(<RegisterPage />);
    fillCommon();
    submit();

    // Not the static hint paragraph (which also contains this phrase) — the actual
    // error message, rendered in the red error <p>.
    await waitFor(() => expect(screen.getByText("Provide an email or phone number.", { selector: ".text-red-500" })).toBeInTheDocument());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("goes straight to the dashboard when the account doesn't need verification", async () => {
    mockRegister.mockResolvedValue({ requiresVerification: false });
    render(<RegisterPage />);
    fillCommon();
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: "ama@t.com" } });
    submit();

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });
});
