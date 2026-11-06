import { useEffect, useState, useRef } from "react";
import { listCustomers } from "@/features/customers/api";
import type { Customer } from "@/features/customers/types";

interface CustomerSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  error?: string;
}

export default function CustomerSelect({ value, onChange, error }: CustomerSelectProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === value);
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Customer
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(!open); setSearch(""); }}
          className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? "border-red-300" : "border-gray-300"
          } ${loading ? "text-gray-400" : selectedCustomer ? "text-gray-900" : "text-gray-400"}`}
          disabled={loading}
        >
          <div className="flex items-center justify-between">
            <span>{loading ? "Loading customers..." : selectedCustomer?.name ?? "Select a customer"}</span>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <ul className="overflow-y-auto max-h-48">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400">No customers found</li>
              ) : (
                filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                        c.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900"
                      }`}
                      onClick={() => {
                        onChange(c.id);
                        setOpen(false);
                      }}
                    >
                      {c.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
