import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { convertFileSrc } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { useInvoice } from "@/features/invoices/hooks";
import { useCompanyProfile, useSettings } from "@/features/settings/hooks";
import { buildAppearance } from "@/lib/invoice-appearance";
import { deleteInvoice, updateInvoiceStatus } from "@/features/invoices/api";
import { savePdfToPath, openPdfInSystemViewer } from "@/features/invoices/pdf";
import type { InvoiceStatus } from "@/features/invoices/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calcLineTotal } from "@/features/invoices/calculations";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import InvoiceTotals from "@/components/invoices/InvoiceTotals";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoice, loading, error, refetch } = useInvoice(id);
  const { profile } = useCompanyProfile();
  const { settings } = useSettings();
  const appearance = buildAppearance(settings);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [opening, setOpening] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  const logoPath = profile?.logo_path;
  useEffect(() => {
    if (logoPath) {
      filePathToDataUrl(logoPath).then(setLogoDataUrl);
    } else {
      setLogoDataUrl(null);
    }
  }, [logoPath]);

  async function handleStatusChange(status: InvoiceStatus) {
    if (!id) return;
    await updateInvoiceStatus(id, status);
    refetch();
  }

  async function handleDelete() {
    if (!id) return;
    await deleteInvoice(id);
    navigate("/invoices");
  }

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

  if (loading) return <p className="text-sm text-gray-500">Loading invoice...</p>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>;
  if (!invoice) return <p className="text-sm text-gray-500">Invoice not found.</p>;

  return (
    <div>
      {/* Back link */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/invoices")}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/invoices/${id}/preview`}>
            <Button variant="secondary" size="sm">Preview</Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={handleOpenPdf} disabled={opening}>
            {opening ? "Opening..." : "Open PDF"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
          <Link to={`/invoices/${id}/edit`}>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </Button>
          </Link>
          {invoice.status === "cancelled" && (
            <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete Permanently
            </Button>
          )}
        </div>
      </div>

      {/* Status actions */}
      <div className="flex gap-2 mb-6">
        {invoice.status === "draft" && (
          <Button size="sm" onClick={() => handleStatusChange("sent")}>
            Mark as Sent
          </Button>
        )}
        {(invoice.status === "sent" || invoice.status === "overdue") && (
          <Button size="sm" onClick={() => handleStatusChange("paid")}>
            Mark as Paid
          </Button>
        )}
        {invoice.status !== "cancelled" && invoice.status !== "paid" && (
          <Button variant="ghost" size="sm" onClick={() => handleStatusChange("cancelled")}>
            Cancel Invoice
          </Button>
        )}
        {invoice.status === "cancelled" && (
          <Button variant="secondary" size="sm" onClick={() => handleStatusChange("draft")}>
            Reopen as Draft
          </Button>
        )}
      </div>

      {exportError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-6">
          Export error: {exportError}
        </div>
      )}

      {/* Invoice details card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Customer</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{invoice.customer_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Issue Date</p>
            <p className="text-sm text-gray-900 mt-1">{formatDate(invoice.issue_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Due Date</p>
            <p className="text-sm text-gray-900 mt-1">{formatDate(invoice.due_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">VAT Rate</p>
            <p className="text-sm text-gray-900 mt-1">{(invoice.tax_rate / 100).toFixed(2)}%</p>
          </div>
        </div>

        {/* Line items */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Line Items</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-right">{(item.quantity / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(calcLineTotal(item.quantity, item.unit_price), invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <InvoiceTotals
          subtotal={invoice.subtotal_amount}
          taxAmount={invoice.tax_amount}
          total={invoice.total_amount}
          taxRate={invoice.tax_rate}
          currency={invoice.currency}
        />

        {/* Notes */}
        {invoice.notes?.trim() && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Permanently Delete Invoice"
        message={`Permanently delete invoice ${invoice.invoice_number}? This removes it from the database entirely and cannot be undone.`}
        confirmLabel="Delete Permanently"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
