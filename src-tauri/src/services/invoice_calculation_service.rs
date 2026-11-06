/// Calculate the line total for a single item.
/// quantity and unit_price are both in cents-like representation:
/// quantity is i64 * 100 (e.g., 250 = 2.50 units)
/// unit_price is i64 in cents (e.g., 15050 = $150.50)
/// Result: (quantity * unit_price) / 100
pub fn calc_line_total(quantity: i64, unit_price: i64) -> i64 {
    (quantity * unit_price) / 100
}

/// Calculate subtotal from a slice of (quantity, unit_price) tuples.
pub fn calc_subtotal(items: &[(i64, i64)]) -> i64 {
    items
        .iter()
        .map(|(qty, price)| calc_line_total(*qty, *price))
        .sum()
}

/// Calculate tax amount.
/// tax_rate is i64 * 100 (e.g., 1000 = 10.00%)
/// Result: (subtotal * tax_rate) / 10000
pub fn calc_tax(subtotal: i64, tax_rate: i64) -> i64 {
    (subtotal * tax_rate) / 10000
}

/// Calculate total = subtotal + tax.
pub fn calc_total(subtotal: i64, tax: i64) -> i64 {
    subtotal + tax
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calc_line_total_basic() {
        // 1.00 unit * $100.00 = $100.00
        assert_eq!(calc_line_total(100, 10000), 10000);
    }

    #[test]
    fn test_calc_line_total_fractional_quantity() {
        // 2.50 units * $150.50 = $376.25
        assert_eq!(calc_line_total(250, 15050), 37625);
    }

    #[test]
    fn test_calc_line_total_zero() {
        assert_eq!(calc_line_total(0, 10000), 0);
        assert_eq!(calc_line_total(100, 0), 0);
    }

    #[test]
    fn test_calc_subtotal() {
        let items = vec![(100, 10000), (200, 5000)]; // $100 + $100 = $200
        assert_eq!(calc_subtotal(&items), 20000);
    }

    #[test]
    fn test_calc_subtotal_empty() {
        let items: Vec<(i64, i64)> = vec![];
        assert_eq!(calc_subtotal(&items), 0);
    }

    #[test]
    fn test_calc_tax() {
        // 10% of $200.00 = $20.00
        assert_eq!(calc_tax(20000, 1000), 2000);
    }

    #[test]
    fn test_calc_tax_zero_rate() {
        assert_eq!(calc_tax(20000, 0), 0);
    }

    #[test]
    fn test_calc_tax_fractional() {
        // 7.5% of $100.00 = $7.50
        assert_eq!(calc_tax(10000, 750), 750);
    }

    #[test]
    fn test_calc_total() {
        assert_eq!(calc_total(20000, 2000), 22000);
    }

    #[test]
    fn test_full_calculation_flow() {
        // 3 units @ $50.00 = $150.00
        // 1.5 units @ $200.00 = $300.00
        // Subtotal = $450.00
        // Tax at 10% = $45.00
        // Total = $495.00
        let items = vec![(300, 5000), (150, 20000)];
        let subtotal = calc_subtotal(&items);
        assert_eq!(subtotal, 45000);

        let tax = calc_tax(subtotal, 1000);
        assert_eq!(tax, 4500);

        let total = calc_total(subtotal, tax);
        assert_eq!(total, 49500);
    }
}
