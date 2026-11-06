export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface LineItem {
  id: string;
  description: string;
  /** Quantity stored as integer x100 (e.g. 250 = 2.50) */
  quantity: number;
  /** Unit price in cents */
  unit_price: number;
  /** Line total in cents */
  line_total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_address_line_1: string | null;
  customer_address_line_2: string | null;
  customer_city: string | null;
  customer_postcode: string | null;
  customer_country: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  /** Tax rate stored as x100 (e.g. 1000 = 10.00%) */
  tax_rate: number;
  /** Subtotal in cents */
  subtotal_amount: number;
  /** Tax amount in cents */
  tax_amount: number;
  /** Total in cents */
  total_amount: number;
  notes: string | null;
  line_items: LineItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  total_amount: number;
}

export interface CreateLineItemRequest {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreateInvoiceRequest {
  customer_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  tax_rate: number;
  notes?: string;
  line_items: CreateLineItemRequest[];
}

export interface UpdateInvoiceRequest {
  id: string;
  customer_id?: string;
  issue_date?: string;
  due_date?: string;
  tax_rate?: number;
  notes?: string;
  line_items?: CreateLineItemRequest[];
}
