import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useInvoices } from "@/features/invoices/hooks";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { InvoiceStatus } from "@/features/invoices/types";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from "@/lib/constants";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import Button from "@/components/ui/Button";

export default function Invoices() {
  const { invoices, loading, error } = useInvoices();

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<InvoiceStatus>>(
    () => new Set(INVOICE_STATUSES)
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const customerNames = useMemo(() => {
    const names = Array.from(new Set(invoices.map((inv) => inv.customer_name)));
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, [invoices]);

  const hasActiveFilters =
    selectedCustomer !== "" ||
    selectedStatuses.size !== INVOICE_STATUSES.length ||
    dateFrom !== "" ||
    dateTo !== "";

  function toggleStatus(status: InvoiceStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  function clearFilters() {
    setSelectedCustomer("");
    setSelectedStatuses(new Set(INVOICE_STATUSES));
    setDateFrom("");
    setDateTo("");
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedCustomer && inv.customer_name !== selectedCustomer) {
        return false;
      }
      if (!selectedStatuses.has(inv.status)) {
        return false;
      }
      if (dateFrom && inv.issue_date < dateFrom) {
        return false;
      }
      if (dateTo && inv.issue_date > dateTo) {
        return false;
      }
      return true;
    });
  }, [invoices, selectedCustomer, selectedStatuses, dateFrom, dateTo]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link to="/invoices/new">
          <Button>+ New Invoice</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading invoices...</p>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No invoices yet</p>
          <p className="text-sm mt-1">Create your first invoice to get started.</p>
          <Link to="/invoices/new" className="mt-4 inline-block">
            <Button>Create Invoice</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Customer select */}
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="py-1.5 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
              >
                <option value="">All customers</option>
                {customerNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* Status pills */}
              <div className="flex items-center gap-1.5">
                {INVOICE_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                      selectedStatuses.has(status)
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    {INVOICE_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              {/* Date range */}
              <div className="flex items-center gap-1.5 text-sm">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="From"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="To"
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No invoices match your filters.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {inv.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.customer_name}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(inv.issue_date)}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(inv.due_date)}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.total_amount, inv.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
