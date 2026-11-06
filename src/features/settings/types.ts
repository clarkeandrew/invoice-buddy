export interface CompanyProfile {
  id: string;
  company_name: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  payment_details: string | null;
  logo_path: string | null;
  updated_at: string;
}

export interface Settings {
  id: string;
  invoice_prefix: string;
  default_tax_rate: number;
  default_currency: string;
  accent_color: string;
  font_choice: string;
  footer_text: string;
  show_notes: boolean;
  show_payment_details: boolean;
  show_footer: boolean;
  updated_at: string;
}

export interface UpdateCompanyProfileRequest {
  company_name: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
  tax_number?: string;
  payment_details?: string;
}

export interface UpdateSettingsRequest {
  invoice_prefix?: string;
  default_tax_rate?: number;
  default_currency?: string;
  accent_color?: string;
  font_choice?: string;
  footer_text?: string;
  show_notes?: boolean;
  show_payment_details?: boolean;
  show_footer?: boolean;
}
