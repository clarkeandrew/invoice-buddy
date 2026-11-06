import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createInvoice } from "@/features/invoices/api";
import { useInvoice } from "@/features/invoices/hooks";
import { cloneInvoiceValues } from "@/features/invoices/clone";
import type { CreateInvoiceRequest } from "@/features/invoices/types";
import { useSettings } from "@/features/settings/hooks";
import InvoiceForm from "@/components/invoices/InvoiceForm";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get("from") ?? undefined;
  const { settings, loading } = useSettings();
  const { invoice: source, loading: sourceLoading, error: sourceError } = useInvoice(sourceId);

  const initialValues = useMemo(
    () => (source ? cloneInvoiceValues(source, new Date().toISOString().split("T")[0]) : undefined),
    [source],
  );

  async function handleSubmit(data: CreateInvoiceRequest) {
    const invoice = await createInvoice(data);
    navigate(`/invoices/${invoice.id}`);
  }

  if (loading || (sourceId && sourceLoading)) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }
  if (sourceId && sourceError) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{sourceError}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New Invoice</h1>
      {source ? (
        <p className="text-sm text-gray-500 mb-6">Copied from {source.invoice_number}</p>
      ) : (
        <div className="mb-5" />
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <InvoiceForm
          key={source?.id ?? "new"}
          initialValues={initialValues}
          settings={settings}
          onSubmit={handleSubmit}
          onCancel={() => navigate(source ? `/invoices/${source.id}` : "/invoices")}
          submitLabel="Create Invoice"
        />
      </div>
    </div>
  );
}
