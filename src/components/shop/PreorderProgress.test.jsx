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

  it("draws the road ahead before a batch is assigned, claiming no progress", () => {
    // The journey starts abroad and the customer has already paid in full, so
    // show where the item is going — but with nothing ticked off, because the
    // order has not moved yet.
    const { container } = render(
      <PreorderProgress
        preorder={{ stage: null, label: "Confirmed — awaiting shipment", origin: "China" }}
      />,
    );

    expect(screen.getByText("Confirmed — awaiting shipment")).toBeInTheDocument();
    expect(container.querySelectorAll("ol li")).toHaveLength(4);
    // Nothing reached: no step is marked done.
    expect(container.querySelector(".bg-blue-600")).toBeNull();
  });

  it("names where the goods are coming from while they are still abroad", () => {
    render(
      <PreorderProgress
        preorder={{ stage: "preparing", label: "Preparing with our supplier", origin: "China" }}
      />,
    );

    expect(screen.getByText("Coming from China")).toBeInTheDocument();
    expect(screen.getByText(/Being prepared with our supplier in China/)).toBeInTheDocument();
  });

  it("drops the origin line once the goods are in Ghana", () => {
    // Past customs it is no longer the useful fact — where it is now is.
    render(
      <PreorderProgress
        preorder={{ stage: "in_ghana", label: "Arrived in Ghana — clearing customs", origin: "China" }}
      />,
    );

    expect(screen.queryByText("Coming from China")).toBeNull();
  });

  it("dates each stage the batch has actually reached", () => {
    render(
      <PreorderProgress
        preorder={{
          stage: "on_the_way",
          label: "On its way",
          origin: "China",
          history: [
            { stage: "preparing", label: "Preparing with our supplier", date: "2026-08-02T00:00:00Z" },
            { stage: "on_the_way", label: "On its way", date: "2026-09-01T00:00:00Z" },
          ],
        }}
      />,
    );

    expect(screen.getByText("2 August 2026")).toBeInTheDocument();
    expect(screen.getByText("1 September 2026")).toBeInTheDocument();
    // Exactly two — the stages it has not reached carry no date, and no arrival
    // estimate was given to invent a third.
    expect(screen.getAllByText(/^\d{1,2} \w+ 2026$/)).toHaveLength(2);
  });

  it("does not invent an arrival date it was not given", () => {
    render(<PreorderProgress preorder={{ stage: "in_ghana", label: "Arrived in Ghana — clearing customs" }} />);
    expect(screen.queryByText(/Expected in Ghana around/)).toBeNull();
  });
});
