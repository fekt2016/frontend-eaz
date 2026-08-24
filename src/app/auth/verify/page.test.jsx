import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T17: verify-pin/resend-pin now accept email OR phone — a phone-only
// registrant has no email to submit here.
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

const mockSetUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ setUser: mockSetUser }),
}));

const mockApiPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { post: (...args) => mockApiPost(...args) },
}));

import VerifyPage from "./page";

function pinBoxes() {
  return screen.getAllByRole("textbox").filter((el) => el.maxLength === 1);
}

function fillPin(code = "123456") {
  pinBoxes().forEach((el, i) => fireEvent.change(el, { target: { value: code[i] } }));
}

describe("Verify page — email OR phone (T17)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetUser.mockReset();
    mockApiPost.mockReset();
    mockSearchParams = new URLSearchParams();
  });

  it("pre-filled by ?email= : shows email copy and submits { email, pin }", async () => {
    mockSearchParams = new URLSearchParams({ email: "ama@t.com" });
    mockApiPost.mockResolvedValue({ data: { user: { role: "user" } } });
    render(<VerifyPage />);

    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email or phone number/i)).not.toBeInTheDocument();

    fillPin();
    fireEvent.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("/auth/verify-pin", { email: "ama@t.com", pin: "123456" }));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("pre-filled by ?phone= : shows phone copy and submits { phone, pin }", async () => {
    mockSearchParams = new URLSearchParams({ phone: "0201234567" });
    mockApiPost.mockResolvedValue({ data: { user: { role: "technician" } } });
    render(<VerifyPage />);

    expect(screen.getByText(/check your phone/i)).toBeInTheDocument();

    fillPin();
    fireEvent.click(screen.getByRole("button", { name: /verify phone/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("/auth/verify-pin", { phone: "0201234567", pin: "123456" }));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/pos");
  });

  it("no query params: lets the user type either identifier, detected by shape", async () => {
    mockApiPost.mockResolvedValue({ data: { user: { role: "user" } } });
    render(<VerifyPage />);

    fireEvent.change(screen.getByPlaceholderText(/you@example.com or 0xx/i), { target: { value: "0209990000" } });
    fillPin();
    fireEvent.click(screen.getByRole("button", { name: /verify email/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("/auth/verify-pin", { phone: "0209990000", pin: "123456" }));
  });

  it("resend, phone-prefilled: posts { phone } and shows the phone success message", async () => {
    mockSearchParams = new URLSearchParams({ phone: "0201234567" });
    mockApiPost.mockResolvedValue({ data: {} });
    render(<VerifyPage />);

    fireEvent.click(screen.getByRole("button", { name: /resend code/i }));

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("/auth/resend-pin", { phone: "0201234567" }));
    expect(await screen.findByText(/sent to your phone/i)).toBeInTheDocument();
  });
});
