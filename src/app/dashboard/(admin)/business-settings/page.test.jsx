import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T14: admin-only business settings page — shop profile, services, tax/VAT.
// Mock the hooks module directly (page-level test, not a hook test).
//
// T101: the page was later split into tabs, and only the active tab's section is
// mounted. These tests predated that and queried every section from one render,
// so four of five failed — not a product defect, the page renders correctly. They
// now open the tab they are about first. "Shop Profile" is also both a tab label
// and a section heading, so those queries are scoped by role.
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

/** Open a tab by its label — only the active tab's section is mounted.
 *  Exact name, not a regex: /Shop Profile/i also matches "Save shop profile". */
function openTab(label) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("BusinessSettingsPage (T14)", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockSettingsData = { business: business() };
  });

  it("offers a tab per section and opens on the shop profile", () => {
    render(<BusinessSettingsPage />);

    for (const label of ["Shop Profile", "Services", "Tax / VAT", "Shipping"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    // Scoped by role: "Shop Profile" is both the tab label and the heading.
    expect(screen.getByRole("heading", { name: "Shop Profile" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("EazWorld Repair")).toBeInTheDocument();
  });

  it("mounts only the active tab's section", () => {
    render(<BusinessSettingsPage />);

    // The profile fields are up; the services and tax fields are not merely
    // hidden, they are absent — which is why the pre-tab queries failed.
    expect(screen.getByDisplayValue("EazWorld Repair")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Web Design")).not.toBeInTheDocument();

    openTab("Services");
    expect(screen.getByDisplayValue("Web Design")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("EazWorld Repair")).not.toBeInTheDocument();
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
    openTab("Tax / VAT");
    expect(screen.queryByText("VAT rate (%)")).not.toBeInTheDocument();

    // The switch's role already says "toggle" — the accessible name is the setting.
    fireEvent.click(screen.getByRole("switch", { name: "VAT registered" }));
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
    openTab("Tax / VAT");

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
    openTab("Services");
    fireEvent.click(screen.getByRole("button", { name: /add service/i }));
    expect(screen.getAllByPlaceholderText("Service name")).toHaveLength(2);

    // Each remove button names its own row, so this targets the row just added
    // rather than whichever one happens to sort first.
    fireEvent.click(screen.getByRole("button", { name: "Remove service 2" }));
    expect(screen.getAllByPlaceholderText("Service name")).toHaveLength(1);
  });
});
