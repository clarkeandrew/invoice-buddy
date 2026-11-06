export const DEFAULT_CURRENCY = "EUR";

/** Default tax rate stored as basis points (e.g. 1000 = 10.00%) */
/** Default tax rate stored as basis points (e.g. 2300 = 23.00%) */
export const DEFAULT_TAX_RATE = 2300;

export const DEFAULT_INVOICE_PREFIX = "INV-";

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatusValue = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatusValue, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const PAYMENT_TERMS_OPTIONS = [
  { value: 0, label: "Due on receipt" },
  { value: 7, label: "Net 7" },
  { value: 14, label: "Net 14" },
  { value: 30, label: "Net 30" },
  { value: 60, label: "Net 60" },
];
