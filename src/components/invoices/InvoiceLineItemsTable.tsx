import { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { calcLineTotal } from "@/features/invoices/calculations";
import Button from "@/components/ui/Button";

export interface LineItemFormData {
  description: string;
  /** Quantity x100 */
  quantity: number;
  /** Unit price in cents */
  unit_price: number;
}

interface InvoiceLineItemsTableProps {
  items: LineItemFormData[];
  onChange: (items: LineItemFormData[]) => void;
  readOnly?: boolean;
}

/** A numeric cell that keeps a local string while the user edits, only committing on blur. */
function NumericCell({
  value,
  divisor,
  decimals,
  step,
  onChange,
}: {
  value: number;
  divisor: number;
  decimals: number;
  step: string;
  onChange: (intValue: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <input
      type="number"
      step={step}
      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={editing ? draft : (value / divisor).toFixed(decimals)}
      onFocus={(e) => {
        setEditing(true);
        setDraft((value / divisor).toFixed(decimals));
        // select all on focus for easy replacement
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const num = Math.round(parseFloat(draft) * divisor) || 0;
        onChange(num);
        setEditing(false);
      }}
    />
  );
}

export default function InvoiceLineItemsTable({
  items,
  onChange,
  readOnly = false,
}: InvoiceLineItemsTableProps) {
  function updateItem(index: number, field: keyof LineItemFormData, raw: string) {
    const updated = [...items];
    if (field === "description") {
      updated[index] = { ...updated[index], description: raw };
    } else {
      const num = Math.round(parseFloat(raw) * 100) || 0;
      updated[index] = { ...updated[index], [field]: num };
    }
    onChange(updated);
  }

  function updateItemNumeric(index: number, field: "quantity" | "unit_price", intValue: number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: intValue };
    onChange(updated);
  }

  function addItem() {
    onChange([...items, { description: "", quantity: 100, unit_price: 0 }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                Total
              </th>
              {!readOnly && (
                <th className="px-4 py-3 w-16" />
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => {
              const lineTotal = calcLineTotal(item.quantity, item.unit_price);
              return (
                <tr key={index}>
                  <td className="px-4 py-2">
                    {readOnly ? (
                      <span className="text-sm">{item.description}</span>
                    ) : (
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Item description"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {readOnly ? (
                      <span className="text-sm">{item.quantity / 100}</span>
                    ) : (
                      <NumericCell
                        value={item.quantity}
                        divisor={100}
                        decimals={0}
                        step="1"
                        onChange={(v) => updateItemNumeric(index, "quantity", v)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {readOnly ? (
                      <span className="text-sm">{formatCurrency(item.unit_price)}</span>
                    ) : (
                      <NumericCell
                        value={item.unit_price}
                        divisor={100}
                        decimals={2}
                        step="0.01"
                        onChange={(v) => updateItemNumeric(index, "unit_price", v)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium">
                    {formatCurrency(lineTotal)}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="px-4 py-6 text-center text-sm text-gray-400">
                  No line items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          + Add Line Item
        </Button>
      )}
    </div>
  );
}
