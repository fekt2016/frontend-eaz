import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PosOverview from "./PosOverview";

// T43: the stat tiles hand-rolled `GH₵${(pesewas/100).toLocaleString()}`, which
// drops the 2-decimal formatting formatGhs guarantees everywhere else.
describe("PosOverview — stat tiles use formatGhs (T43)", () => {
  it("renders Total Revenue, Today's Revenue, and Total Expenses via formatGhs", () => {
    render(
      <PosOverview
        data={{
          stats: {
            totalRevenue: 123456, // GH₵1,234.56
            todayRevenue: 500,    // GH₵5.00
            totalExpenses: 100,   // GH₵1.00
            netProfit: 123356,
          },
        }}
        loading={false}
      />
    );

    expect(screen.getByText("GH₵1,234.56")).toBeInTheDocument();
    expect(screen.getByText("GH₵5.00")).toBeInTheDocument();
    expect(screen.getByText("GH₵1.00")).toBeInTheDocument();
  });
});
