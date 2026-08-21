import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Receipt } from "./Receipt";

// T43: TOTAL/Paid/Change/Subtotal/Discount rows hand-rolled `GH₵${(pesewas/100).toFixed(2)}`;
// now use the shared formatGhs formatter. The item table intentionally keeps a
// no-prefix cedis format (the column header already says "GH₵") since the
// receipt is print-width constrained — this test confirms both stay correct.
function makeSale(over = {}) {
  return {
    saleNumber: "SALE-001",
    createdAt: "2026-08-21T10:00:00.000Z",
    cashier: { name: "Kofi" },
    items: [{ name: "Screen protector", quantity: 2, subtotal: 5000 }],
    subtotal: 123456,
    discount: 0,
    total: 123456,
    amountPaid: 123456,
    changeDue: 0,
    paymentMethod: "cash",
    ...over,
  };
}

describe("Receipt — totals use formatGhs (T43)", () => {
  it("renders TOTAL/Paid via formatGhs, with the GH₵ prefix", () => {
    render(<Receipt sale={makeSale()} />);

    // TOTAL and Paid are equal in this fixture, so both render the same text.
    expect(screen.getAllByText("GH₵1,234.56")).toHaveLength(2);
  });

  it("renders the discount row with a leading '-' before the formatGhs value", () => {
    render(<Receipt sale={makeSale({ subtotal: 130000, discount: 6544, total: 123456 })} />);

    expect(screen.getByText("-GH₵65.44")).toBeInTheDocument();
  });

  it("renders the change row via formatGhs when change is due", () => {
    render(<Receipt sale={makeSale({ amountPaid: 130000, changeDue: 6544, total: 123456 })} />);

    expect(screen.getByText("GH₵65.44")).toBeInTheDocument();
  });

  it("keeps the item-table cell prefix-free (no double GH₵)", () => {
    render(<Receipt sale={makeSale()} />);

    // The per-item cell shows just the number (column header already says "GH₵").
    expect(screen.getByText("50.00")).toBeInTheDocument();
    expect(screen.queryByText("GH₵50.00")).not.toBeInTheDocument();
  });
});
