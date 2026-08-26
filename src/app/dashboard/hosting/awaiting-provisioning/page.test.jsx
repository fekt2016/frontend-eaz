import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T68: the manual provisioning queue. VPS/Cloud/Email orders are paid but no
// API can build them — so the page's job is to show what's owed and take the
// credentials once staff have built it by hand.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: mockUser() }) }));

const mockQueue = vi.fn();
const mockMark = vi.fn();
vi.mock("@/hooks/queries/useHosting", () => ({
  useAwaitingProvisioning: () => mockQueue(),
  useMarkProvisioned: () => ({ mutate: mockMark, isPending: false }),
}));

import AwaitingProvisioningPage from "./page";

const ORDER = {
  _id: "h1",
  paystackReference: "ref_vps_1",
  planType: "vps",
  tier: "pro",
  billingCycle: "monthly",
  amount: 950,
  domain: null,
  createdAt: "2026-08-01T00:00:00Z",
  paidAt: "2026-08-01T00:05:00Z",
  customer: { name: "Kofi Mensah", email: "kofi@example.com" },
};

beforeEach(() => {
  mockUser.mockReturnValue({ role: "staff" });
  mockQueue.mockReturnValue({ data: [ORDER], isLoading: false });
  mockMark.mockReset();
});

describe("Awaiting-provisioning queue (T68)", () => {
  it("lists a waiting order with its plan, customer and whole-cedi amount", () => {
    render(<AwaitingProvisioningPage />);

    expect(screen.getByText("ref_vps_1")).toBeInTheDocument();
    expect(screen.getByText(/vps · pro/)).toBeInTheDocument();
    expect(screen.getByText(/Kofi Mensah/)).toBeInTheDocument();
    // Hosting money is a GHS float (T44 exception), not pesewas.
    expect(screen.getByText(/GH₵950/)).toBeInTheDocument();
  });

  it("submits the credentials staff created in Starlight Manager", async () => {
    render(<AwaitingProvisioningPage />);

    fireEvent.change(screen.getByLabelText(/Username/), { target: { value: "kofivps" } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: "Built-By-Hand-1" } });
    fireEvent.click(screen.getByRole("button", { name: /mark provisioned/i }));

    await waitFor(() => expect(mockMark).toHaveBeenCalled());
    const payload = mockMark.mock.calls[0][0];
    expect(payload.id).toBe("h1");
    expect(payload.username).toBe("kofivps");
    expect(payload.password).toBe("Built-By-Hand-1");
    expect(payload.domain).toBe("");
  });

  it("prefills the domain field when the order carries one", () => {
    mockQueue.mockReturnValue({ data: [{ ...ORDER, domain: "kofisite.com" }], isLoading: false });

    render(<AwaitingProvisioningPage />);

    expect(screen.getByLabelText("Domain (optional)")).toHaveValue("kofisite.com");
  });

  it("surfaces the server's reason when a mark is refused", async () => {
    // The commonest case: someone clicked before the payment actually landed.
    mockMark.mockImplementation(({ id }, { onError }) =>
      onError(new Error("Only a paid order can be marked provisioned.")));

    render(<AwaitingProvisioningPage />);
    fireEvent.click(screen.getByRole("button", { name: /mark provisioned/i }));

    expect(await screen.findByText(/Only a paid order can be marked provisioned/)).toBeInTheDocument();
  });

  it("says so plainly when nothing is waiting", () => {
    mockQueue.mockReturnValue({ data: [], isLoading: false });

    render(<AwaitingProvisioningPage />);

    expect(screen.getByText(/nothing awaiting provisioning/i)).toBeInTheDocument();
  });

  it("renders nothing for a customer who lands on the URL", () => {
    mockUser.mockReturnValue({ role: "user" });

    const { container } = render(<AwaitingProvisioningPage />);

    expect(container.firstChild).toBeNull();
  });
});
