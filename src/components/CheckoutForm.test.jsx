import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", () => ({ api: { post: vi.fn() } }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: null }) }));
import { api } from "@/lib/api";
import CheckoutForm from "./CheckoutForm";

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("First name"), { target: { value: "Ama" } });
  fireEvent.change(screen.getByPlaceholderText("Last name"), { target: { value: "Owusu" } });
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "ama@example.com" } });
}

describe("CheckoutForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: "" };
  });

  it("shows a validation error and does not call the API when required fields are missing", async () => {
    const { container } = render(<CheckoutForm domain="eazworld.com" price={100} />);
    // fireEvent.submit bypasses native HTML5 `required` constraint validation
    // (which a real click would trigger and silently block) so the schema
    // check inside handleSubmit runs and reports its own error.
    fireEvent.submit(container.querySelector("form"));

    expect(await screen.findByText("Please fill in all required fields.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("submits sanitized values and redirects to the returned authorization URL", async () => {
    api.post.mockResolvedValueOnce({ data: { authorizationUrl: "https://checkout.paystack.com/abc123" } });
    render(<CheckoutForm domain="eazworld.com" price={100} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /pay with paystack/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(api.post).toHaveBeenCalledWith("/domain/payment", expect.objectContaining({
      domain: "eazworld.com",
      email: "ama@example.com",
      amount: 100, // price × 1 year (default)
      currency: "GHS",
      firstName: "Ama",
      lastName: "Owusu",
      years: 1,
    }));
    await waitFor(() => expect(window.location.href).toBe("https://checkout.paystack.com/abc123"));
  });

  it("multiplies price by the selected registration period", async () => {
    api.post.mockResolvedValueOnce({ data: { authorizationUrl: "https://checkout.paystack.com/xyz" } });
    render(<CheckoutForm domain="eazworld.com" price={100} />);
    fillRequiredFields();
    fireEvent.change(screen.getByDisplayValue("1 year — GH₵100.00"), { target: { value: "3" } });

    expect(screen.getByText("GH₵300.00")).toBeInTheDocument(); // total updates live

    fireEvent.click(screen.getByRole("button", { name: /pay with paystack/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/domain/payment", expect.objectContaining({ amount: 300, years: 3 })));
  });

  it("shows an error message and re-enables the button when the API call fails", async () => {
    api.post.mockRejectedValueOnce(new Error("Payment failed. Please try again."));
    render(<CheckoutForm domain="eazworld.com" price={100} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /pay with paystack/i }));

    expect(await screen.findByText("Payment failed. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pay with paystack/i })).not.toBeDisabled();
  });

  it("shows a fallback error when no authorization URL comes back", async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    render(<CheckoutForm domain="eazworld.com" price={100} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /pay with paystack/i }));

    expect(await screen.findByText("Could not initialize payment. Please try again.")).toBeInTheDocument();
  });
});
