import { useState, useMemo } from "react";
import { createInvoiceSchema } from "@/features/invoices/validators";
import { calcSubtotal, calcTax, calcTotal } from "@/features/invoices/calculations";
import type { Invoice, CreateInvoiceRequest } from "@/features/invoices/types";
import type { Settings } from "@/features/settings/types";
import { DEFAULT_CURRENCY, DEFAULT_TAX_RATE } from "@/lib/constants";
import CustomerSelect from "@/components/customers/CustomerSelect";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import InvoiceLineItemsTable, { type LineItemFormData } from "./InvoiceLineItemsTable";
import InvoiceTotals from "./InvoiceTotals";

interface InvoiceFormProps {
  initialValues?: Invoice;
  settings?: Settings | null;
  onSubmit: (data: CreateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function InvoiceForm({
  initialValues,
  settings,
  onSubmit,
  onCancel,
  submitLabel = "Save Invoice",
}: InvoiceFormProps) {
  const defaultCurrency = initialValues?.currency ?? settings?.default_currency ?? DEFAULT_CURRENCY;
  const defaultTaxRate = initialValues?.tax_rate ?? settings?.default_tax_rate ?? DEFAULT_TAX_RATE;

  const [customerId, setCustomerId] = useState(initialValues?.customer_id ?? "");
  const [issueDate, setIssueDate] = useState(
    initialValues?.issue_date ?? new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(
    initialValues?.due_date ??
      new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  );
  const [currency] = useState(defaultCurrency);
  const [taxRate, setTaxRate] = useState(defaultTaxRate);
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [lineItems, setLineItems] = useState<LineItemFormData[]>(
    initialValues?.line_items.map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
    })) ?? [{ description: "", quantity: 100, unit_price: 0 }],
  );
  const [taxRateDraft, setTaxRateDraft] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(
    () =>
      calcSubtotal(
        lineItems.map((li) => ({ quantity: li.quantity, unitPrice: li.unit_price })),
      ),
    [lineItems],
  );
  const taxAmount = useMemo(() => calcTax(subtotal, taxRate), [subtotal, taxRate]);
  const total = useMemo(() => calcTotal(subtotal, taxAmount), [subtotal, taxAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data: CreateInvoiceRequest = {
      customer_id: customerId,
      issue_date: issueDate,
      due_date: dueDate,
      currency,
      tax_rate: taxRate,
      notes: notes.trim() || undefined,
      line_items: lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
      })),
    };

    const result = createInvoiceSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      const formErrors: string[] = [];
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        fieldErrors[key] = issue.message;
        // Surface nested errors (e.g. line_items.0.description) as a form-level message
        if (issue.path.length > 1 && issue.path[0] === "line_items") {
          formErrors.push(`Line item ${Number(issue.path[1]) + 1}: ${issue.message}`);
        }
      }
      if (formErrors.length > 0) {
        fieldErrors._form = formErrors.join(". ");
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors._form && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomerSelect
          value={customerId}
          onChange={setCustomerId}
          error={errors.customer_id}
        />
        <div /> {/* spacer */}
        <Input
          label="Issue Date"
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          error={errors.issue_date}
        />
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={errors.due_date}
        />
        <Input
          label="VAT Rate (%)"
          type="number"
          step="0.01"
          value={taxRateDraft ?? (taxRate / 100).toFixed(2)}
          onFocus={() => setTaxRateDraft((taxRate / 100).toFixed(2))}
          onChange={(e) => setTaxRateDraft(e.target.value)}
          onBlur={() => {
            setTaxRate(Math.round(parseFloat(taxRateDraft ?? "0") * 100) || 0);
            setTaxRateDraft(null);
          }}
          error={errors.tax_rate}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Line Items</h3>
        <InvoiceLineItemsTable items={lineItems} onChange={setLineItems} />
        {errors["line_items"] && (
          <p className="mt-1 text-sm text-red-600">{errors["line_items"]}</p>
        )}
      </div>

      <InvoiceTotals
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        taxRate={taxRate}
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for the customer..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
