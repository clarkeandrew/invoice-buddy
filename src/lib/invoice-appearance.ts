import type { Settings } from "@/features/settings/types";

export interface InvoiceAppearance {
  accentColor: string;
  fontFamily: string;
  pdfFontFamily: string;
  pdfFontFamilyBold: string;
  footerText: string;
  showNotes: boolean;
  showPaymentDetails: boolean;
  showFooter: boolean;
}

const FONT_MAP: Record<string, { css: string; pdf: string; pdfBold: string }> = {
  "sans-serif": {
    css: "Helvetica, Arial, sans-serif",
    pdf: "Helvetica",
    pdfBold: "Helvetica-Bold",
  },
  serif: {
    css: '"Times New Roman", Times, serif',
    pdf: "Times-Roman",
    pdfBold: "Times-Bold",
  },
  monospace: {
    css: '"Courier New", Courier, monospace',
    pdf: "Courier",
    pdfBold: "Courier-Bold",
  },
};

export const ACCENT_PRESETS = [
  { name: "Blue", hex: "#2563eb" },
  { name: "Green", hex: "#16a34a" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Red", hex: "#dc2626" },
  { name: "Orange", hex: "#ea580c" },
];

export function buildAppearance(settings: Settings | null): InvoiceAppearance {
  const fontChoice = settings?.font_choice ?? "sans-serif";
  const font = FONT_MAP[fontChoice] ?? FONT_MAP["sans-serif"];

  return {
    accentColor: settings?.accent_color ?? "#2563eb",
    fontFamily: font.css,
    pdfFontFamily: font.pdf,
    pdfFontFamilyBold: font.pdfBold,
    footerText: settings?.footer_text ?? "Thank you for your business",
    showNotes: settings?.show_notes ?? true,
    showPaymentDetails: settings?.show_payment_details ?? true,
    showFooter: settings?.show_footer ?? true,
  };
}
