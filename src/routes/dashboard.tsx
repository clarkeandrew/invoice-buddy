import { Link } from "react-router-dom";
import { useInvoices } from "@/features/invoices/hooks";
import { useCustomers } from "@/features/customers/hooks";
import { formatCurrency, formatDate } from "@/lib/formatters";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";

export default function Dashboard() {
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { customers, loading: customersLoading } = useCustomers();

  const loading = invoicesLoading || customersLoading;

  const totalOutstanding = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

  const recentInvoices = [...invoices]
    .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Customers"
          value={loading ? "..." : String(customers.length)}
        />
        <SummaryCard
          title="Total Invoices"
          value={loading ? "..." : String(invoices.length)}
        />
        <SummaryCard
          title="Outstanding"
          value={loading ? "..." : formatCurrency(totalOutstanding)}
          accent={totalOutstanding > 0 ? "text-amber-600" : undefined}
        />
        <SummaryCard
          title="Total Paid"
          value={loading ? "..." : formatCurrency(totalPaid)}
          accent="text-green-600"
        />
      </div>

      {overdueCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          You have {overdueCount} overdue invoice{overdueCount > 1 ? "s" : ""}. Review them in{" "}
          <Link to="/invoices" className="underline font-medium">Invoices</Link>.
        </div>
      )}

      {/* Recent invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
          <Link
            to="/invoices"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : recentInvoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No invoices yet.</p>
            <Link
              to="/invoices/new"
              className="mt-2 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{inv.customer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(inv.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? "text-gray-900"}`}>{value}</p>
    </div>
  );
}
