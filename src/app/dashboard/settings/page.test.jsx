// T84: PATCH /auth/me parks a new phone number instead of writing it, because
// guest shop orders are matched to an account by phone — an unproven number is a
// claim on someone else's order history. Without this step the save looks like it
// silently failed: the server deliberately did not write the number.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

// The page now also renders DangerZoneSection, which uses the app router to send
// a deactivated user out. Rendering the whole page means mocking what the whole
// page needs.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const mockUser = { name: "Ama", email: "ama@example.com", phone: "0209999999" };
const setUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  // SettingsPage calls setUser() from its onUpdate handler — omitting it makes
  // every save throw inside the submit handler and surface as an error state.
  useAuth: () => ({ user: mockUser, setUser }),
}));
vi.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

const mockPatch = vi.fn();
const mockPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    patch: (...a) => mockPatch(...a),
    post: (...a) => mockPost(...a),
    // IdentitySection fetches /account/ghana-card on mount.
    get: vi.fn(() => Promise.resolve({ data: { status: "none" } })),
  },
  errorMessage: (err, fallback) => err?.message || fallback,
}));

import SettingsPage from "./page";

function typePhone(value) {
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Settings — phone change needs an SMS code (T84)", () => {
  it("shows the code step when the server parks the change", async () => {
    mockPatch.mockResolvedValue({
      phoneVerificationRequired: true,
      data: { user: { ...mockUser } },
    });
    render(<SettingsPage />);

    typePhone("0244000111");
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(screen.getByText(/confirm your phone number/i)).toBeInTheDocument(),
    );
    // The number it texted must be named, so the user knows where to look.
    expect(screen.getByText(/0244000111/)).toBeInTheDocument();
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it("does not show the code step for an ordinary save", async () => {
    mockPatch.mockResolvedValue({
      phoneVerificationRequired: false,
      data: { user: { ...mockUser } },
    });
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
  });

  it("posts the code to the confirm endpoint and returns to the form", async () => {
    mockPatch.mockResolvedValue({
      phoneVerificationRequired: true,
      data: { user: { ...mockUser } },
    });
    mockPost.mockResolvedValue({ data: { user: { ...mockUser, phone: "0244000111" } } });
    render(<SettingsPage />);

    typePhone("0244000111");
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm number/i }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/auth/me/phone/confirm", { pin: "123456" }),
    );
    await waitFor(() =>
      expect(screen.getByText(/phone number confirmed/i)).toBeInTheDocument(),
    );
  });

  it("keeps the code step open and shows why when the code is wrong", async () => {
    mockPatch.mockResolvedValue({
      phoneVerificationRequired: true,
      data: { user: { ...mockUser } },
    });
    mockPost.mockRejectedValue(new Error("Incorrect verification code."));
    render(<SettingsPage />);

    typePhone("0244000111");
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm number/i }));

    await waitFor(() =>
      expect(screen.getByText(/incorrect verification code/i)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });

  it("accepts only digits, capped at six", async () => {
    mockPatch.mockResolvedValue({
      phoneVerificationRequired: true,
      data: { user: { ...mockUser } },
    });
    render(<SettingsPage />);

    typePhone("0244000111");
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    const field = await screen.findByLabelText(/verification code/i);

    fireEvent.change(field, { target: { value: "12ab34" } });
    expect(field.value).toBe("1234");
    expect(field).toHaveAttribute("maxLength", "6");
  });

  it("Cancel abandons the change and restores the form", async () => {
    mockPatch.mockResolvedValue({
      phoneVerificationRequired: true,
      data: { user: { ...mockUser } },
    });
    render(<SettingsPage />);

    typePhone("0244000111");
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    await waitFor(() => expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/phone number/i).value).toBe("0209999999"); // reverted
  });
});
