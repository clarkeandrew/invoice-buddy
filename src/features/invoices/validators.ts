import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.number().int().min(0, "Unit price must be non-negative"),
});

export const createInvoiceSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  currency: z.string().min(1, "Currency is required"),
  tax_rate: z.number().int().min(0),
  notes: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: z.string().min(1),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof updateInvoiceSchema>;
