import type { Invoice } from "./types";

const DAY_MS = 86_400_000;

function parseDate(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

/**
 * Form values for a new invoice copied from an existing one.
 *
 * Keeps the customer, currency, tax rate, notes and line items. The issue date
 * becomes `today`, and the due date keeps the original payment terms (the gap
 * between issue and due date) counted from `today`. The invoice number, status
 * and totals are left for the create flow to assign.
 */
export function cloneInvoiceValues(source: Invoice, today: string): Invoice {
  const termDays = Math.max(
    0,
    Math.round((parseDate(source.due_date) - parseDate(source.issue_date)) / DAY_MS),
  );

  return {
    ...source,
    issue_date: today,
    due_date: formatDate(parseDate(today) + termDays * DAY_MS),
    status: "draft",
    line_items: source.line_items.map((li) => ({ ...li })),
  };
}
