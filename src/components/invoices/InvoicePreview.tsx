import type { Invoice } from "@/features/invoices/types";
import type { CompanyProfile } from "@/features/settings/types";
import type { InvoiceAppearance } from "@/lib/invoice-appearance";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calcLineTotal } from "@/features/invoices/calculations";
import "@/styles/invoice-print.css";

interface InvoicePreviewProps {
  invoice: Invoice;
  companyProfile?: CompanyProfile | null;
  logoUrl?: string | null;
  appearance: InvoiceAppearance;
}

export default function InvoicePreview({ invoice, companyProfile, logoUrl, appearance }: InvoicePreviewProps) {
  const hasCustomerAddress =
    invoice.customer_address_line_1 ||
    invoice.customer_city ||
    invoice.customer_postcode ||
    invoice.customer_country;

  return (
    <div className="invoice-preview bg-white max-w-4xl mx-auto p-10 shadow-lg rounded-lg" style={{ fontFamily: appearance.fontFamily }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-8 mb-8 border-b border-gray-200">
        <div className="flex items-start gap-4">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Company logo"
              className="max-h-[60px] max-w-[180px] object-contain"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {companyProfile?.company_name ?? "Your Company"}
            </h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-300 uppercase tracking-wider">Invoice</p>
          <p className="text-sm font-semibold mt-1" style={{ color: appearance.accentColor }}>{invoice.invoice_number}</p>
        </div>
      </div>

      {/* Two-column info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* From */}
        <div>
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">From</h3>
          {companyProfile && (
            <div className="text-sm text-gray-600 space-y-0.5">
              {companyProfile.address_line_1 && <p>{companyProfile.address_line_1}</p>}
              {companyProfile.address_line_2 && <p>{companyProfile.address_line_2}</p>}
              {(companyProfile.city || companyProfile.postcode) && (
                <p>
                  {companyProfile.city}
                  {companyProfile.city && companyProfile.postcode ? ", " : ""}
                  {companyProfile.postcode}
                </p>
              )}
              {companyProfile.country && <p>{companyProfile.country}</p>}
              {companyProfile.email && <p className="mt-1">{companyProfile.email}</p>}
              {companyProfile.phone && <p>{companyProfile.phone}</p>}
              {companyProfile.tax_number && (
                <p className="text-xs text-gray-500 mt-1">VAT No. {companyProfile.tax_number}</p>
              )}
            </div>
          )}
        </div>

        {/* Bill To */}
        <div>
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
          <p className="text-sm font-semibold text-gray-900">{invoice.customer_name}</p>
          {hasCustomerAddress && (
            <div className="text-sm text-gray-600 space-y-0.5 mt-1">
              {invoice.customer_address_line_1 && <p>{invoice.customer_address_line_1}</p>}
              {invoice.customer_address_line_2 && <p>{invoice.customer_address_line_2}</p>}
              {(invoice.customer_city || invoice.customer_postcode) && (
                <p>
                  {invoice.customer_city}
                  {invoice.customer_city && invoice.customer_postcode ? ", " : ""}
                  {invoice.customer_postcode}
                </p>
              )}
              {invoice.customer_country && <p>{invoice.customer_country}</p>}
            </div>
          )}
          {invoice.customer_email && (
            <p className="text-sm text-gray-600 mt-1">{invoice.customer_email}</p>
          )}
        </div>
      </div>

      {/* Metadata strip */}
      <div className="flex items-center gap-6 bg-gray-50 rounded-lg px-5 py-3 mb-8 text-sm">
        <div>
          <span className="text-gray-400 text-xs uppercase font-medium">Invoice #</span>
          <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <span className="text-gray-400 text-xs uppercase font-medium">Issue Date</span>
          <p className="font-medium text-gray-900">{formatDate(invoice.issue_date)}</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <span className="text-gray-400 text-xs uppercase font-medium">Due Date</span>
          <p className="font-medium text-gray-900">{formatDate(invoice.due_date)}</p>
        </div>
      </div>

      {/* Line items table */}
      <table className="w-full mb-8">
        <thead>
          <tr>
            <th className="text-left py-3 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 rounded-tl-lg">
              Description
            </th>
            <th className="text-right py-3 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 w-20">
              Qty
            </th>
            <th className="text-right py-3 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 w-28">
              Unit Price
            </th>
            <th className="text-right py-3 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 rounded-tr-lg w-28">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.line_items.map((item, idx) => (
            <tr key={item.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}>
              <td className="py-3 px-3 text-sm text-gray-800">{item.description}</td>
              <td className="py-3 px-3 text-sm text-gray-600 text-right">{(item.quantity / 100).toFixed(2)}</td>
              <td className="py-3 px-3 text-sm text-gray-600 text-right">{formatCurrency(item.unit_price, invoice.currency)}</td>
              <td className="py-3 px-3 text-sm text-gray-900 text-right font-medium">
                {formatCurrency(calcLineTotal(item.quantity, item.unit_price), invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm px-3">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900">{formatCurrency(invoice.subtotal_amount, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-sm px-3">
            <span className="text-gray-500">VAT ({(invoice.tax_rate / 100).toFixed(2)}%)</span>
            <span className="text-gray-900">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between px-3">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold" style={{ color: appearance.accentColor }}>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {appearance.showNotes && invoice.notes?.trim() && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Payment details */}
      {appearance.showPaymentDetails && companyProfile?.payment_details && (
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Information</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{companyProfile.payment_details}</p>
        </div>
      )}

      {/* Footer */}
      {appearance.showFooter && (
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">{appearance.footerText}</p>
        </div>
      )}
    </div>
  );
}
