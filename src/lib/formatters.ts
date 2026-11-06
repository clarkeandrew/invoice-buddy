/**
 * Format an integer cent value as a currency string.
 * E.g. 12345 → "$123.45"
 */
export function formatCurrency(cents: number, currency = "EUR"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO 8601 date string into a human-readable format.
 * E.g. "2026-03-12" → "Mar 12, 2026"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
