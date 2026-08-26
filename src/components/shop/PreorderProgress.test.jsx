import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PreorderProgress from "./PreorderProgress";

// T45: what a customer waiting on goods from China is shown. Four steps, not the
// eight staff work with — and none of the supplier/container/internal detail,
// which the API does not send in the first place.
describe("PreorderProgress (T45)", () => {
  it("renders nothing for an ordinary order", () => {
    const { container } = render(<PreorderProgress preorder={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows the current position and what is expected when", () => {
    render(
      <PreorderProgress
        preorder={{
          stage: "on_the_way",
          label: "On its way",
          expectedArrival: "2026-10-12T00:00:00Z",
          items: [{ name: "iPhone 17", qty: 2 }],
        }}
      />,
    );

    // Both the headline and the step it has reached say this — that is the design,
    // so assert presence rather than uniqueness.
    expect(screen.getAllByText("On its way").length).toBeGreaterThan(0);
    expect(screen.getByText(/Expected in Ghana around 12 October 2026/)).toBeInTheDocument();
    expect(screen.getByText(/iPhone 17 × 2/)).toBeInTheDocument();
  });

  it("shows all four steps, so the customer can see what is still to come", () => {
    render(<PreorderProgress preorder={{ stage: "preparing", label: "Preparing with our supplier" }} />);

    for (const step of ["Preparing", "On its way", "Arrived in Ghana", "At our shop"]) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("says something honest before a batch is assigned", () => {
    // No stage yet — show the label, but no progress the order has not made.
    const { container } = render(
      <PreorderProgress preorder={{ stage: null, label: "Confirmed — awaiting shipment" }} />,
    );

    expect(screen.getByText("Confirmed — awaiting shipment")).toBeInTheDocument();
    expect(container.querySelector("ol")).toBeNull();
  });

  it("does not invent an arrival date it was not given", () => {
    render(<PreorderProgress preorder={{ stage: "in_ghana", label: "Arrived in Ghana — clearing customs" }} />);
    expect(screen.queryByText(/Expected in Ghana around/)).toBeNull();
  });
});
