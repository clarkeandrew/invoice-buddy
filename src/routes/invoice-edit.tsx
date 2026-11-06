import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "@/features/invoices/hooks";
import { updateInvoice } from "@/features/invoices/api";
import type { CreateInvoiceRequest } from "@/features/invoices/types";
import { useSettings } from "@/features/settings/hooks";
import InvoiceForm from "@/components/invoices/InvoiceForm";

export default function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoice, loading, error } = useInvoice(id);
  const { settings } = useSettings();

  async function handleSubmit(data: CreateInvoiceRequest) {
    if (!id) return;
    await updateInvoice(id, data);
    navigate(`/invoices/${id}`);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading invoice...</p>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>;
  if (!invoice) return <p className="text-sm text-gray-500">Invoice not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Invoice {invoice.invoice_number}
      </h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <InvoiceForm
          initialValues={invoice}
          settings={settings}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/invoices/${id}`)}
          submitLabel="Update Invoice"
        />
      </div>
    </div>
  );
}
