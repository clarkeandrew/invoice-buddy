import { useNavigate } from "react-router-dom";
import { createInvoice } from "@/features/invoices/api";
import type { CreateInvoiceRequest } from "@/features/invoices/types";
import { useSettings } from "@/features/settings/hooks";
import InvoiceForm from "@/components/invoices/InvoiceForm";

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { settings, loading } = useSettings();

  async function handleSubmit(data: CreateInvoiceRequest) {
    const invoice = await createInvoice(data);
    navigate(`/invoices/${invoice.id}`);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Invoice</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <InvoiceForm
          settings={settings}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")}
          submitLabel="Create Invoice"
        />
      </div>
    </div>
  );
}
