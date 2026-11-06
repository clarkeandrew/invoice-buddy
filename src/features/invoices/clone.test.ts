import { describe, expect, it } from "vitest";
import { cloneInvoiceValues } from "./clone";
import type { Invoice } from "./types";

const source: Invoice = {
  id: "inv-1",
  invoice_number: "INV-0001",
  customer_id: "cust-1",
  customer_name: "Acme Ltd",
  customer_email: null,
  customer_address_line_1: null,
  customer_address_line_2: null,
  customer_city: null,
  customer_postcode: null,
  customer_country: null,
  status: "paid",
  issue_date: "2026-01-15",
  due_date: "2026-02-14",
  currency: "EUR",
  tax_rate: 2300,
  subtotal_amount: 50000,
  tax_amount: 11500,
  total_amount: 61500,
  notes: "Thanks for your business",
  line_items: [
    { id: "li-1", description: "Consulting", quantity: 500, unit_price: 10000, line_total: 50000 },
  ],
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
};

describe("cloneInvoiceValues", () => {
  it("issues the copy today and keeps the payment terms", () => {
    const copy = cloneInvoiceValues(source, "2026-11-06");
    expect(copy.issue_date).toBe("2026-11-06");
    expect(copy.due_date).toBe("2026-12-06");
  });

  it("keeps customer, currency, tax, notes and line items", () => {
    const copy = cloneInvoiceValues(source, "2026-11-06");
    expect(copy.customer_id).toBe("cust-1");
    expect(copy.currency).toBe("EUR");
    expect(copy.tax_rate).toBe(2300);
    expect(copy.notes).toBe("Thanks for your business");
    expect(copy.line_items).toEqual(source.line_items);
    expect(copy.line_items[0]).not.toBe(source.line_items[0]);
  });

  it("starts as a draft", () => {
    expect(cloneInvoiceValues(source, "2026-11-06").status).toBe("draft");
  });

  it("handles terms across a month end and a zero-day term", () => {
    expect(cloneInvoiceValues(source, "2026-01-31").due_date).toBe("2026-03-02");
    const dueOnReceipt = { ...source, due_date: source.issue_date };
    expect(cloneInvoiceValues(dueOnReceipt, "2026-11-06").due_date).toBe("2026-11-06");
  });
});
