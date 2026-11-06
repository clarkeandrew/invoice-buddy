use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanyProfile {
    pub id: String,
    #[serde(rename = "company_name")]
    pub name: String,
    pub address_line_1: String,
    pub address_line_2: String,
    pub city: String,
    pub postcode: String,
    pub country: String,
    pub email: String,
    pub phone: String,
    pub tax_number: String,
    pub payment_details: String,
    pub logo_path: String,
    pub created_at: String,
    pub updated_at: String,
}
