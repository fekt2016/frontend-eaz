import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PreorderProgress from "./PreorderProgress";

// T45: what a customer waiting on goods from China is shown. Five steps, not the
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
          stage: "shipped",
          label: "Shipped — on its way to Ghana",
          expectedArrival: "2026-10-12T00:00:00Z",
          items: [{ name: "iPhone 17", qty: 2 }],
        }}
      />,
    );

    // Both the headline and the step it has reached say this — that is the design,
    // so assert presence rather than uniqueness.
    expect(screen.getAllByText(/Shipped/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Expected in Ghana around 12 October 2026/)).toBeInTheDocument();
    expect(screen.getByText(/iPhone 17 × 2/)).toBeInTheDocument();
  });

  it("shows all five steps, so the customer can see what is still to come", () => {
    render(<PreorderProgress preorder={{ stage: "production", label: "In production" }} />);

    for (const step of [
      "In production", "At the container warehouse", "Shipped",
      "Arrived at the port in Ghana", "At our warehouse",
    ]) {
      expect(screen.getAllByText(step).length).toBeGreaterThan(0);
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
    expect(container.querySelectorAll("ol li")).toHaveLength(5);
    // Nothing reached: no step is marked done.
    expect(container.querySelector(".bg-blue-600")).toBeNull();
    // And it must not LOOK reached either. A filled circle reads as a completed
    // step, so every pending one is an empty dashed outline, and it says so.
    expect(container.querySelectorAll("ol li .border-dashed")).toHaveLength(5);
    expect(screen.getByText(/No steps completed yet/)).toBeInTheDocument();
  });

  it("names where the goods are coming from while they are still abroad", () => {
    render(
      <PreorderProgress
        preorder={{ stage: "production", label: "In production", origin: "China" }}
      />,
    );

    expect(screen.getByText("Coming from China")).toBeInTheDocument();
    expect(screen.getByText(/Being made by our supplier in China/)).toBeInTheDocument();
  });

  it("drops the origin line once the goods are in Ghana", () => {
    // Past customs it is no longer the useful fact — where it is now is.
    render(
      <PreorderProgress
        preorder={{ stage: "port_ghana", label: "Arrived at the port in Ghana", origin: "China" }}
      />,
    );

    expect(screen.queryByText("Coming from China")).toBeNull();
  });

  it("dates each stage the batch has actually reached", () => {
    render(
      <PreorderProgress
        preorder={{
          stage: "shipped",
          label: "Shipped — on its way to Ghana",
          origin: "China",
          history: [
            { stage: "production", label: "In production", date: "2026-08-02T00:00:00Z" },
            { stage: "shipped", label: "Shipped — on its way to Ghana", date: "2026-09-01T00:00:00Z" },
          ],
        }}
      />,
    );

    expect(screen.getByText(/^2 August 2026 at /)).toBeInTheDocument();
    expect(screen.getByText(/^1 September 2026 at /)).toBeInTheDocument();
    // Exactly two — the stages it has not reached carry no date, and no arrival
    // estimate was given to invent a third.
    expect(screen.getAllByText(/^\d{1,2} \w+ 2026 at \d{1,2}:\d{2}$/)).toHaveLength(2);
  });

  it("does not invent an arrival date it was not given", () => {
    render(<PreorderProgress preorder={{ stage: "port_ghana", label: "Arrived at the port in Ghana" }} />);
    expect(screen.queryByText(/Expected in Ghana around/)).toBeNull();
  });
});

// A customer who had just paid saw five stages and read them as five updates.
// Done and pending labels were the same grey in light mode, and a pending step
// was a filled circle carrying its own icon — which reads as a completed chip.
describe("PreorderProgress — a step that has not happened must not look like one that has", () => {
  it("tells the reached stages apart from the ones still to come", () => {
    const { container } = render(
      <PreorderProgress
        preorder={{
          stage: "shipped",
          label: "Shipped — on its way to Ghana",
          history: [
            { stage: "production", label: "In production", date: "2026-08-02T00:00:00Z" },
            { stage: "shipped", label: "Shipped — on its way to Ghana", date: "2026-09-01T00:00:00Z" },
          ],
        }}
      />,
    );

    const steps = [...container.querySelectorAll("ol li")];
    // production is done, shipped is active, the last two have not happened.
    expect(steps[0].querySelector(".bg-blue-600")).not.toBeNull();
    expect(steps[3].querySelector(".border-dashed")).not.toBeNull();
    expect(steps[4].querySelector(".border-dashed")).not.toBeNull();
    // No dashed outline on anything that has actually been recorded.
    expect(steps[0].querySelector(".border-dashed")).toBeNull();
  });

  it("does not claim progress on a pre-order with no batch yet", () => {
    const { container } = render(
      <PreorderProgress preorder={{ stage: null, label: "Confirmed — awaiting shipment" }} />,
    );

    expect(container.querySelectorAll("ol li .border-dashed")).toHaveLength(5);
    expect(container.querySelector(".bg-blue-600")).toBeNull();
    // No dates either — a date against a step is the other thing that reads as
    // "this happened".
    expect(container.querySelectorAll("ol li p")).toHaveLength(5);
  });
});
