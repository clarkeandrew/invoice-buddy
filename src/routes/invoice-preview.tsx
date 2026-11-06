import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { convertFileSrc } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useInvoice } from "@/features/invoices/hooks";
import { useCompanyProfile, useSettings } from "@/features/settings/hooks";
import { buildAppearance } from "@/lib/invoice-appearance";
import { savePdfToPath, openPdfInSystemViewer } from "@/features/invoices/pdf";
import InvoicePreviewComponent from "@/components/invoices/InvoicePreview";
import Button from "@/components/ui/Button";

async function filePathToDataUrl(filePath: string): Promise<string | null> {
  try {
    const response = await fetch(convertFileSrc(filePath));
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function InvoicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoice, loading: invoiceLoading, error: invoiceError } = useInvoice(id);
  const { profile, loading: profileLoading } = useCompanyProfile();
  const { settings, loading: settingsLoading } = useSettings();
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [opening, setOpening] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const loading = invoiceLoading || profileLoading || settingsLoading;
  const appearance = buildAppearance(settings);

  const logoPath = profile?.logo_path;
  useEffect(() => {
    if (logoPath) {
      filePathToDataUrl(logoPath).then(setLogoDataUrl);
    } else {
      setLogoDataUrl(null);
    }
  }, [logoPath]);

  if (loading) return <p className="text-sm text-gray-500">Loading preview...</p>;
  if (invoiceError) return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{invoiceError}</div>;
  if (!invoice) return <p className="text-sm text-gray-500">Invoice not found.</p>;

  const logoUrl = logoPath ? convertFileSrc(logoPath) : null;

  async function handleExportPdf() {
    if (!invoice) return;
    setExportError(null);
    setExporting(true);
    try {
      const filePath = await save({
        title: "Save Invoice as PDF",
        defaultPath: `${invoice.invoice_number}.pdf`,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });

      if (!filePath) {
        setExporting(false);
        return;
      }

      await savePdfToPath(filePath, {
        invoice,
        companyProfile: profile,
        logoDataUrl,
        appearance,
      });
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : err instanceof Error ? err.message : JSON.stringify(err);
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  }

  async function handleOpenPdf() {
    if (!invoice) return;
    setExportError(null);
    setOpening(true);
    try {
      await openPdfInSystemViewer({
        invoice,
        companyProfile: profile,
        logoDataUrl,
        appearance,
      });
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : err instanceof Error ? err.message : JSON.stringify(err);
      setExportError(msg);
    } finally {
      setOpening(false);
    }
  }

  return (
    <div>
      <div className="no-print mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => navigate(`/invoices/${id}`)}>
            Back to Invoice
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleOpenPdf} disabled={opening}>
              {opening ? "Opening..." : "Open PDF"}
            </Button>
            <Button onClick={handleExportPdf} disabled={exporting}>
              {exporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>
        {exportError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            Export error: {exportError}
          </div>
        )}
      </div>

      <InvoicePreviewComponent invoice={invoice} companyProfile={profile} logoUrl={logoUrl} appearance={appearance} />
    </div>
  );
}
