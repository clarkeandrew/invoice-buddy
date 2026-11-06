use tauri::State;
use uuid::Uuid;

use crate::dto::invoice_dto::{
    CreateInvoiceRequest, InvoiceDto, InvoiceListDto, UpdateInvoiceRequest,
};
use crate::errors::app_error::AppError;
use crate::models::invoice::Invoice;
use crate::models::invoice_line_item::InvoiceLineItem;
use crate::repositories::{customer_repository, invoice_repository};
use crate::services::invoice_calculation_service::{
    calc_line_total, calc_subtotal, calc_tax, calc_total,
};
use crate::services::invoice_number_service;
use crate::DbState;

const VALID_STATUSES: &[&str] = &["draft", "sent", "paid", "overdue", "cancelled"];

fn normalize_notes(notes: Option<String>) -> Option<String> {
    notes.and_then(|s| {
        let t = s.trim().to_string();
        if t.is_empty() {
            None
        } else {
            Some(t)
        }
    })
}

#[tauri::command]
pub fn list_invoices(state: State<'_, DbState>) -> Result<Vec<InvoiceListDto>, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let invoices = invoice_repository::list_invoices(&conn)?;
    Ok(invoices
        .into_iter()
        .map(|(inv, name)| InvoiceListDto::from_invoice_with_customer(inv, name))
        .collect())
}

#[tauri::command]
pub fn get_invoice(state: State<'_, DbState>, id: String) -> Result<InvoiceDto, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let (invoice, items, customer) = invoice_repository::get_invoice(&conn, &id)?;
    Ok(InvoiceDto::from_parts(invoice, items, customer))
}

#[tauri::command]
pub fn create_invoice(
    state: State<'_, DbState>,
    payload: CreateInvoiceRequest,
) -> Result<InvoiceDto, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    if payload.line_items.is_empty() {
        return Err(AppError::Validation(
            "Invoice must have at least one line item".to_string(),
        ));
    }

    // Wrap invoice number allocation + insert in a single transaction
    conn.execute_batch("BEGIN")?;

    let result = (|| -> Result<String, AppError> {
        let customer = customer_repository::get_customer(&conn, &payload.customer_id)?;
        let invoice_number =
            invoice_number_service::get_next_invoice_number(&conn, &customer.name)?;
        let invoice_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

        // Build line items and calculate totals
        let mut line_items = Vec::new();
        let mut item_tuples = Vec::new();

        for (idx, input) in payload.line_items.iter().enumerate() {
            let line_total = calc_line_total(input.quantity, input.unit_price);
            item_tuples.push((input.quantity, input.unit_price));

            line_items.push(InvoiceLineItem {
                id: Uuid::new_v4().to_string(),
                invoice_id: invoice_id.clone(),
                sort_order: idx as i64,
                description: input.description.clone(),
                quantity: input.quantity,
                unit_price: input.unit_price,
                line_total,
                created_at: now.clone(),
                updated_at: now.clone(),
            });
        }

        let subtotal = calc_subtotal(&item_tuples);
        let tax = calc_tax(subtotal, payload.tax_rate);
        let total = calc_total(subtotal, tax);

        let invoice = Invoice {
            id: invoice_id.clone(),
            customer_id: payload.customer_id,
            invoice_number,
            issue_date: payload.issue_date,
            due_date: payload.due_date,
            status: "draft".to_string(),
            currency: payload.currency,
            notes: normalize_notes(payload.notes),
            subtotal_amount: subtotal,
            tax_amount: tax,
            total_amount: total,
            tax_rate: payload.tax_rate,
            created_at: now.clone(),
            updated_at: now,
        };

        invoice_repository::create_invoice(&conn, &invoice, &line_items)?;
        Ok(invoice_id)
    })();

    match result {
        Ok(invoice_id) => {
            conn.execute_batch("COMMIT")?;
            let (inv, items, customer) = invoice_repository::get_invoice(&conn, &invoice_id)?;
            Ok(InvoiceDto::from_parts(inv, items, customer))
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            Err(e)
        }
    }
}

#[tauri::command]
pub fn update_invoice(
    state: State<'_, DbState>,
    id: String,
    payload: UpdateInvoiceRequest,
) -> Result<InvoiceDto, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    // Fetch existing invoice
    let (existing, _old_items, _customer) = invoice_repository::get_invoice(&conn, &id)?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let tax_rate = payload.tax_rate.unwrap_or(existing.tax_rate);

    // Build new line items
    let mut line_items = Vec::new();
    let mut item_tuples = Vec::new();

    for (idx, input) in payload.line_items.iter().enumerate() {
        let line_total = calc_line_total(input.quantity, input.unit_price);
        item_tuples.push((input.quantity, input.unit_price));

        line_items.push(InvoiceLineItem {
            id: Uuid::new_v4().to_string(),
            invoice_id: id.clone(),
            sort_order: idx as i64,
            description: input.description.clone(),
            quantity: input.quantity,
            unit_price: input.unit_price,
            line_total,
            created_at: now.clone(),
            updated_at: now.clone(),
        });
    }

    let subtotal = calc_subtotal(&item_tuples);
    let tax = calc_tax(subtotal, tax_rate);
    let total = calc_total(subtotal, tax);

    let invoice = Invoice {
        id: id.clone(),
        customer_id: payload.customer_id.unwrap_or(existing.customer_id),
        invoice_number: existing.invoice_number,
        issue_date: payload.issue_date.unwrap_or(existing.issue_date),
        due_date: payload.due_date.unwrap_or(existing.due_date),
        status: existing.status,
        currency: payload.currency.unwrap_or(existing.currency),
        notes: normalize_notes(payload.notes),
        subtotal_amount: subtotal,
        tax_amount: tax,
        total_amount: total,
        tax_rate,
        created_at: existing.created_at,
        updated_at: now,
    };

    invoice_repository::update_invoice(&conn, &invoice, &line_items)?;

    let (inv, items, customer_name) = invoice_repository::get_invoice(&conn, &id)?;
    Ok(InvoiceDto::from_parts(inv, items, customer_name))
}

#[tauri::command]
pub fn delete_invoice(state: State<'_, DbState>, id: String) -> Result<(), AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let (existing, _, _) = invoice_repository::get_invoice(&conn, &id)?;
    if existing.status != "cancelled" {
        return Err(AppError::Validation(
            "Only cancelled invoices can be permanently deleted. Cancel the invoice first."
                .to_string(),
        ));
    }
    invoice_repository::delete_invoice(&conn, &id)
}

#[tauri::command]
pub fn update_invoice_status(
    state: State<'_, DbState>,
    id: String,
    status: String,
) -> Result<InvoiceDto, AppError> {
    if !VALID_STATUSES.contains(&status.as_str()) {
        return Err(AppError::Validation(format!(
            "Invalid status '{}'. Must be one of: {}",
            status,
            VALID_STATUSES.join(", ")
        )));
    }
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    invoice_repository::update_invoice_status(&conn, &id, &status)?;
    let (inv, items, customer_name) = invoice_repository::get_invoice(&conn, &id)?;
    Ok(InvoiceDto::from_parts(inv, items, customer_name))
}
