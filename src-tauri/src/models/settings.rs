use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub id: String,
    pub default_currency: String,
    pub default_tax_rate: i64,
    pub invoice_prefix: String,
    pub next_invoice_sequence: i64,
    pub accent_color: String,
    pub font_choice: String,
    pub footer_text: String,
    pub show_notes: bool,
    pub show_payment_details: bool,
    pub show_footer: bool,
    pub created_at: String,
    pub updated_at: String,
}
