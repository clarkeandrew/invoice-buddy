/**
 * All monetary values are stored as integer cents.
 * Quantity is stored as x100 (e.g. 250 = 2.50 units).
 * Tax rate is stored as x100 (e.g. 1000 = 10.00%).
 */

/**
 * Calculate line total in cents.
 * quantity (x100) * unitPrice (cents) / 100 = cents
 */
export function calcLineTotal(quantity: number, unitPrice: number): number {
  return Math.round((quantity * unitPrice) / 100);
}

/**
 * Calculate subtotal from an array of line items, in cents.
 */
export function calcSubtotal(
  items: { quantity: number; unitPrice: number }[],
): number {
  return items.reduce((sum, item) => sum + calcLineTotal(item.quantity, item.unitPrice), 0);
}

/**
 * Calculate tax amount in cents.
 * subtotal (cents) * taxRate (x100) / 10000 = cents
 */
export function calcTax(subtotal: number, taxRate: number): number {
  return Math.round((subtotal * taxRate) / 10000);
}

/**
 * Calculate total (subtotal + tax) in cents.
 */
export function calcTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}
