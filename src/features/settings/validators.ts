import { z } from "zod";

export const companyProfileSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  tax_number: z.string().optional(),
  payment_details: z.string().optional(),
});

export const settingsSchema = z.object({
  invoice_prefix: z.string().min(1, "Invoice prefix is required"),
  default_tax_rate: z.number().int().min(0, "Tax rate must be non-negative"),
  default_currency: z.string().min(3, "Currency code is required").max(3),
});

export const appearanceSchema = z.object({
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  font_choice: z.enum(["sans-serif", "serif", "monospace"]),
  footer_text: z.string().max(200, "Footer text must be 200 characters or less"),
  show_notes: z.boolean(),
  show_payment_details: z.boolean(),
  show_footer: z.boolean(),
});

export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
