use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceLineItem {
    pub id: String,
    pub invoice_id: String,
    pub sort_order: i64,
    pub description: String,
    pub quantity: i64,
    pub unit_price: i64,
    pub line_total: i64,
    pub created_at: String,
    pub updated_at: String,
}
