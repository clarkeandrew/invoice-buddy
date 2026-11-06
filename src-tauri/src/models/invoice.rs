use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub customer_id: String,
    pub invoice_number: String,
    pub issue_date: String,
    pub due_date: String,
    pub status: String,
    pub currency: String,
    pub notes: Option<String>,
    pub subtotal_amount: i64,
    pub tax_amount: i64,
    pub total_amount: i64,
    pub tax_rate: i64,
    pub created_at: String,
    pub updated_at: String,
}
