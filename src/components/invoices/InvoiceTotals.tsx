import { formatCurrency } from "@/lib/formatters";

interface InvoiceTotalsProps {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  currency?: string;
}

export default function InvoiceTotals({
  subtotal,
  taxAmount,
  total,
  taxRate,
  currency,
}: InvoiceTotalsProps) {
  const taxRateDisplay = (taxRate / 100).toFixed(2);

  return (
    <div className="w-full max-w-xs ml-auto space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal, currency)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>VAT ({taxRateDisplay}%)</span>
        <span>{formatCurrency(taxAmount, currency)}</span>
      </div>
      <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2">
        <span>Total</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>
    </div>
  );
}
