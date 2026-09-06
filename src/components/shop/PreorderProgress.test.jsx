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

  it("shows only the stages that have actually been recorded", () => {
    const { container } = render(
      <PreorderProgress preorder={{ stage: "shipped", label: "Shipped — on its way to Ghana" }} />,
    );

    // Reached: production, container warehouse, shipped.
    expect(container.querySelectorAll("ol li")).toHaveLength(3);
    expect(screen.getAllByText("In production").length).toBeGreaterThan(0);
    // Never the ones still to come — a step nobody has touched reads as one
    // that has already happened, whatever it is styled like.
    expect(screen.queryByText("Arrived at the port in Ghana")).toBeNull();
    expect(screen.queryByText("At our warehouse")).toBeNull();
  });

  it("shows no stages at all until one is recorded", () => {
    // Reported from a real order: five drawn steps read as five updates that had
    // already happened. Nothing is drawn until staff record something.
    const { container } = render(
      <PreorderProgress
        preorder={{ stage: null, label: "Confirmed — awaiting shipment", origin: "China" }}
      />,
    );

    expect(screen.getByText("Confirmed — awaiting shipment")).toBeInTheDocument();
    expect(container.querySelectorAll("ol li")).toHaveLength(0);
    expect(screen.getByText(/No updates yet/)).toBeInTheDocument();
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
    // Reached only: production, container warehouse, shipped — the last is the
    // current position, the earlier ones are ticked.
    expect(steps).toHaveLength(3);
    expect(steps[0].querySelector(".bg-blue-600")).not.toBeNull();
    expect(steps.at(-1).querySelector(".ring-blue-500")).not.toBeNull();
  });

  it("does not claim progress on a pre-order with nothing recorded", () => {
    const { container } = render(
      <PreorderProgress preorder={{ stage: null, label: "Confirmed — awaiting shipment" }} />,
    );

    expect(container.querySelectorAll("ol li")).toHaveLength(0);
    expect(container.querySelector(".bg-blue-600")).toBeNull();
  });
});

// The note staff write with a stage is a message FOR the customer, so it belongs
// under the stage it explains.
describe("PreorderProgress — the message staff wrote", () => {
  it("shows it under the stage it belongs to", () => {
    render(
      <PreorderProgress
        preorder={{
          stage: "port_ghana",
          label: "Arrived at the port in Ghana",
          history: [
            { stage: "production", label: "In production", date: "2026-08-02T00:00:00Z", note: "" },
            { stage: "shipped", label: "Shipped", date: "2026-09-01T00:00:00Z", note: "" },
            { stage: "port_ghana", label: "Arrived at the port in Ghana", date: "2026-09-20T00:00:00Z", note: "Held at the port — about three more days" },
          ],
        }}
      />,
    );

    expect(screen.getByText("Held at the port — about three more days")).toBeInTheDocument();
  });

  it("shows nothing extra when staff wrote no message", () => {
    render(
      <PreorderProgress
        preorder={{
          stage: "shipped",
          label: "Shipped",
          history: [{ stage: "shipped", label: "Shipped", date: "2026-09-01T00:00:00Z", note: "" }],
        }}
      />,
    );

    const step = [...document.querySelectorAll("ol li")].at(-1);
    // Its label, its blurb and its date — and nothing invented in between.
    expect(step.querySelectorAll("p")).toHaveLength(3);
  });
});
