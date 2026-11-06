import { pdf } from "@react-pdf/renderer";
import { invoke } from "@tauri-apps/api/core";
import InvoicePdfDocument from "@/components/invoices/InvoicePdfDocument";
import type { Invoice } from "./types";
import type { CompanyProfile } from "@/features/settings/types";
import type { InvoiceAppearance } from "@/lib/invoice-appearance";

export interface PdfRenderParams {
  invoice: Invoice;
  companyProfile?: CompanyProfile | null;
  logoDataUrl?: string | null;
  appearance: InvoiceAppearance;
}

async function renderPdfBytes(params: PdfRenderParams): Promise<number[]> {
  const blob = await pdf(
    <InvoicePdfDocument
      invoice={params.invoice}
      companyProfile={params.companyProfile}
      logoDataUrl={params.logoDataUrl}
      appearance={params.appearance}
    />,
  ).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Array.from(new Uint8Array(arrayBuffer));
}

export async function savePdfToPath(path: string, params: PdfRenderParams): Promise<void> {
  const bytes = await renderPdfBytes(params);
  await invoke("save_pdf_bytes", { path, data: bytes });
}

export async function openPdfInSystemViewer(params: PdfRenderParams): Promise<void> {
  const bytes = await renderPdfBytes(params);
  const fileName = `${params.invoice.invoice_number}.pdf`;
  await invoke("preview_pdf_bytes", { fileName, data: bytes });
}
