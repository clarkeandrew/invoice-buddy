use serde::{Deserialize, Serialize};

use crate::models::customer::Customer;
use crate::models::invoice::Invoice;
use crate::models::invoice_line_item::InvoiceLineItem;

#[derive(Debug, Deserialize)]
pub struct LineItemInput {
    pub description: String,
    pub quantity: i64,
    pub unit_price: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvoiceRequest {
    pub customer_id: String,
    pub issue_date: String,
    pub due_date: String,
    pub currency: String,
    pub tax_rate: i64,
    pub notes: Option<String>,
    pub line_items: Vec<LineItemInput>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateInvoiceRequest {
    pub customer_id: Option<String>,
    pub issue_date: Option<String>,
    pub due_date: Option<String>,
    pub currency: Option<String>,
    pub tax_rate: Option<i64>,
    pub notes: Option<String>,
    pub line_items: Vec<LineItemInput>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LineItemDto {
    pub id: String,
    pub description: String,
    pub quantity: i64,
    pub unit_price: i64,
    pub line_total: i64,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct InvoiceDto {
    pub id: String,
    pub invoice_number: String,
    pub customer_id: String,
    pub customer_name: String,
    pub customer_email: Option<String>,
    pub customer_address_line_1: Option<String>,
    pub customer_address_line_2: Option<String>,
    pub customer_city: Option<String>,
    pub customer_postcode: Option<String>,
    pub customer_country: Option<String>,
    pub issue_date: String,
    pub due_date: String,
    pub status: String,
    pub currency: String,
    pub notes: Option<String>,
    pub subtotal_amount: i64,
    pub tax_amount: i64,
    pub total_amount: i64,
    pub tax_rate: i64,
    pub line_items: Vec<LineItemDto>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct InvoiceListDto {
    pub id: String,
    pub invoice_number: String,
    pub customer_name: String,
    pub issue_date: String,
    pub due_date: String,
    pub status: String,
    pub currency: String,
    pub total_amount: i64,
}

impl From<InvoiceLineItem> for LineItemDto {
    fn from(item: InvoiceLineItem) -> Self {
        LineItemDto {
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            sort_order: item.sort_order,
        }
    }
}

impl InvoiceDto {
    pub fn from_parts(
        invoice: Invoice,
        line_items: Vec<InvoiceLineItem>,
        customer: Customer,
    ) -> Self {
        InvoiceDto {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_id: invoice.customer_id,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_address_line_1: customer.address_line_1,
            customer_address_line_2: customer.address_line_2,
            customer_city: customer.city,
            customer_postcode: customer.postcode,
            customer_country: customer.country,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            status: invoice.status,
            currency: invoice.currency,
            notes: invoice.notes,
            subtotal_amount: invoice.subtotal_amount,
            tax_amount: invoice.tax_amount,
            total_amount: invoice.total_amount,
            tax_rate: invoice.tax_rate,
            line_items: line_items.into_iter().map(LineItemDto::from).collect(),
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
        }
    }
}

impl InvoiceListDto {
    pub fn from_invoice_with_customer(invoice: Invoice, customer_name: String) -> Self {
        InvoiceListDto {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            status: invoice.status,
            currency: invoice.currency,
            total_amount: invoice.total_amount,
        }
    }
}
