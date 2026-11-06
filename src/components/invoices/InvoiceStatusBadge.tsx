import type { InvoiceStatus } from "@/features/invoices/types";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-800 text-gray-100",
};

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
