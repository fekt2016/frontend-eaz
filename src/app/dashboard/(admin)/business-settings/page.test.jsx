import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T14: admin-only business settings page — shop profile, services, tax/VAT.
// Mock the hooks module directly (page-level test, not a hook test).
const mockMutate = vi.fn();
let mockSettingsData = null;

vi.mock("@/hooks/queries/useSettings", () => ({
  useSettings: () => ({ data: mockSettingsData, isLoading: false }),
  useUpdateSettings: () => ({ mutate: mockMutate, isPending: false }),
}));

import BusinessSettingsPage from "./page";

function business(over = {}) {
  return {
    shopName: "EazWorld Repair",
    shopPhone: "0244388190",
    whatsapp: "233244388190",
    email: "hello@eazworld.com",
    location: "Accra, Ghana",
    hours: "Monday – Friday, 8am – 6pm GMT",
    consultationPath: "/book-consultation",
    services: [{ name: "Web Design", price: "GHS 1,500", path: "/services/web-design" }],
    vatEnabled: false,
    vatRate: 0,
    vatNumber: "",
    pricesIncludeVat: true,
    ...over,
  };
}

describe("BusinessSettingsPage (T14)", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockSettingsData = { business: business() };
  });

  it("renders all three sections with fetched values", () => {
    render(<BusinessSettingsPage />);
    expect(screen.getByText("Shop Profile")).toBeInTheDocument();
    expect(screen.getByText("Services & Pricing")).toBeInTheDocument();
    expect(screen.getByText("Tax / VAT")).toBeInTheDocument();
    expect(screen.getByDisplayValue("EazWorld Repair")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Web Design")).toBeInTheDocument();
  });

  it("saves the shop profile with all its fields on submit", () => {
    render(<BusinessSettingsPage />);
    fireEvent.change(screen.getByDisplayValue("EazWorld Repair"), { target: { value: "Eazy Fix Shop" } });
    fireEvent.click(screen.getByRole("button", { name: /save shop profile/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      { business: expect.objectContaining({ shopName: "Eazy Fix Shop", whatsapp: "233244388190" }) },
      expect.any(Object)
    );
  });

  it("hides VAT rate/number fields until VAT is enabled, then saves vatEnabled: true", () => {
    render(<BusinessSettingsPage />);
    expect(screen.queryByText("VAT rate (%)")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Toggle VAT registered" }));
    expect(screen.getByText("VAT rate (%)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save tax settings/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      { business: expect.objectContaining({ vatEnabled: true }) },
      expect.any(Object)
    );
  });

  it("clamps a vatRate above 100 to 100 on save", () => {
    mockSettingsData = { business: business({ vatEnabled: true, vatRate: 15 }) };
    render(<BusinessSettingsPage />);

    const rateInput = screen.getByDisplayValue("15");
    fireEvent.change(rateInput, { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: /save tax settings/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      { business: expect.objectContaining({ vatRate: 100 }) },
      expect.any(Object)
    );
  });

  it("adds and removes a service row", () => {
    render(<BusinessSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add service/i }));
    expect(screen.getAllByPlaceholderText("Service name")).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: /remove service/i })[0]);
    expect(screen.getAllByPlaceholderText("Service name")).toHaveLength(1);
  });
});
