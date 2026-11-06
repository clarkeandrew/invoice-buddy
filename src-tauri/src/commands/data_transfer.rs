use std::fs;
use std::io::{BufRead, BufReader, Write};

use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::errors::app_error::AppError;
use crate::models::company_profile::CompanyProfile;
use crate::models::customer::Customer;
use crate::models::invoice::Invoice;
use crate::models::invoice_line_item::InvoiceLineItem;
use crate::models::settings::Settings;
use crate::repositories::{customer_repository, invoice_repository, settings_repository};
use crate::DbState;

#[derive(Debug, Serialize)]
pub struct ExportResult {
    pub customers: usize,
    pub invoices: usize,
    pub line_items: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct EntityImportCounts {
    pub created: usize,
    pub updated: usize,
    pub skipped: usize,
}

impl EntityImportCounts {
    fn new() -> Self {
        Self {
            created: 0,
            updated: 0,
            skipped: 0,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub customers: EntityImportCounts,
    pub invoices: EntityImportCounts,
    pub line_items: EntityImportCounts,
    pub company_profile: EntityImportCounts,
    pub settings: EntityImportCounts,
    pub errors: usize,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "entity_type")]
enum ExportRecord {
    #[serde(rename = "metadata")]
    Metadata {
        version: u32,
        #[allow(dead_code)]
        exported_at: String,
        #[allow(dead_code)]
        app: String,
    },
    #[serde(rename = "customer")]
    Customer { data: Customer },
    #[serde(rename = "invoice")]
    Invoice { data: Invoice },
    #[serde(rename = "invoice_line_item")]
    InvoiceLineItem { data: InvoiceLineItem },
    #[serde(rename = "company_profile")]
    CompanyProfile { data: CompanyProfile },
    #[serde(rename = "settings")]
    Settings { data: Settings },
}

#[tauri::command]
pub fn export_data(state: State<'_, DbState>, path: String) -> Result<ExportResult, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let company_profile = settings_repository::get_company_profile(&conn)?;
    let settings = settings_repository::get_settings(&conn)?;
    let customers = customer_repository::list_customers(&conn)?;
    let invoices = invoice_repository::list_all_invoices(&conn)?;
    let line_items = invoice_repository::list_all_line_items(&conn)?;

    let result = ExportResult {
        customers: customers.len(),
        invoices: invoices.len(),
        line_items: line_items.len(),
    };

    let file = fs::File::create(&path)
        .map_err(|e| AppError::Filesystem(format!("Failed to create export file: {}", e)))?;
    let mut writer = std::io::BufWriter::new(file);

    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    // Metadata line
    let metadata = serde_json::json!({
        "entity_type": "metadata",
        "version": 1,
        "exported_at": now,
        "app": "invoice-buddy"
    });
    writeln!(writer, "{}", metadata)
        .map_err(|e| AppError::Filesystem(format!("Failed to write export: {}", e)))?;

    // Company profile (clear logo_path)
    let mut profile_export = company_profile;
    profile_export.logo_path = String::new();
    let line = serde_json::json!({ "entity_type": "company_profile", "data": profile_export });
    writeln!(writer, "{}", line)
        .map_err(|e| AppError::Filesystem(format!("Failed to write export: {}", e)))?;

    // Settings
    let line = serde_json::json!({ "entity_type": "settings", "data": settings });
    writeln!(writer, "{}", line)
        .map_err(|e| AppError::Filesystem(format!("Failed to write export: {}", e)))?;

    // Customers
    for customer in &customers {
        let line = serde_json::json!({ "entity_type": "customer", "data": customer });
        writeln!(writer, "{}", line)
            .map_err(|e| AppError::Filesystem(format!("Failed to write export: {}", e)))?;
    }

    // Invoices
    for invoice in &invoices {
        let line = serde_json::json!({ "entity_type": "invoice", "data": invoice });
        writeln!(writer, "{}", line)
            .map_err(|e| AppError::Filesystem(format!("Failed to write export: {}", e)))?;
    }

    // Line items
    for item in &line_items {
        let line = serde_json::json!({ "entity_type": "invoice_line_item", "data": item });
        writeln!(writer, "{}", line)
            .map_err(|e| AppError::Filesystem(format!("Failed to write export: {}", e)))?;
    }

    writer
        .flush()
        .map_err(|e| AppError::Filesystem(format!("Failed to flush export: {}", e)))?;

    Ok(result)
}

#[tauri::command]
pub fn import_data(state: State<'_, DbState>, path: String) -> Result<ImportResult, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let file = fs::File::open(&path)
        .map_err(|e| AppError::Filesystem(format!("Failed to open import file: {}", e)))?;
    let reader = BufReader::new(file);

    // Parse all records
    let mut records = Vec::new();
    let mut errors: usize = 0;
    let mut version_validated = false;

    for line in reader.lines() {
        let line = line.map_err(|e| AppError::Filesystem(format!("Failed to read line: {}", e)))?;
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        match serde_json::from_str::<ExportRecord>(line) {
            Ok(record) => {
                // Validate metadata version on first metadata record
                if let ExportRecord::Metadata { version, .. } = &record {
                    if *version != 1 {
                        return Err(AppError::Validation(format!(
                            "Unsupported export version: {}. Expected version 1.",
                            version
                        )));
                    }
                    version_validated = true;
                    continue; // Don't add metadata to records
                }
                records.push(record);
            }
            Err(_) => {
                errors += 1;
            }
        }
    }

    if !version_validated {
        return Err(AppError::Validation(
            "Import file missing metadata line with version info.".to_string(),
        ));
    }

    // Begin transaction
    conn.execute_batch("BEGIN")
        .map_err(|e| AppError::Database(e.to_string()))?;

    let result = import_records(&conn, &records, errors);

    match result {
        Ok(import_result) => {
            conn.execute_batch("COMMIT")
                .map_err(|e| AppError::Database(e.to_string()))?;
            Ok(import_result)
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            Err(e)
        }
    }
}

fn import_records(
    conn: &rusqlite::Connection,
    records: &[ExportRecord],
    errors: usize,
) -> Result<ImportResult, AppError> {
    let mut result = ImportResult {
        customers: EntityImportCounts::new(),
        invoices: EntityImportCounts::new(),
        line_items: EntityImportCounts::new(),
        company_profile: EntityImportCounts::new(),
        settings: EntityImportCounts::new(),
        errors,
    };

    // Track which invoices were created or updated (so we know whether to import their line items)
    let mut affected_invoice_ids = std::collections::HashSet::new();

    // Process in FK-dependency order: company_profile, settings, customers, invoices, line_items
    for record in records {
        if let ExportRecord::CompanyProfile { data } = record {
            import_company_profile(conn, data, &mut result.company_profile)?;
        }
    }

    for record in records {
        if let ExportRecord::Settings { data } = record {
            import_settings(conn, data, &mut result.settings)?;
        }
    }

    for record in records {
        if let ExportRecord::Customer { data } = record {
            import_customer(conn, data, &mut result.customers)?;
        }
    }

    for record in records {
        if let ExportRecord::Invoice { data } = record {
            let action = import_invoice(conn, data, &mut result.invoices)?;
            if action != ImportAction::Skipped {
                affected_invoice_ids.insert(data.id.clone());
            }
        }
    }

    // For affected invoices, delete existing line items first
    for invoice_id in &affected_invoice_ids {
        conn.execute(
            "DELETE FROM invoice_line_items WHERE invoice_id = ?1",
            params![invoice_id],
        )?;
    }

    // Import line items for affected invoices
    for record in records {
        if let ExportRecord::InvoiceLineItem { data } = record {
            if affected_invoice_ids.contains(&data.invoice_id) {
                conn.execute(
                    "INSERT INTO invoice_line_items (id, invoice_id, sort_order, description,
                         quantity, unit_price, line_total, created_at, updated_at)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                    params![
                        data.id,
                        data.invoice_id,
                        data.sort_order,
                        data.description,
                        data.quantity,
                        data.unit_price,
                        data.line_total,
                        data.created_at,
                        data.updated_at,
                    ],
                )?;
                result.line_items.created += 1;
            } else {
                result.line_items.skipped += 1;
            }
        }
    }

    Ok(result)
}

#[derive(Debug, PartialEq)]
enum ImportAction {
    Created,
    Updated,
    Skipped,
}

fn get_existing_updated_at(
    conn: &rusqlite::Connection,
    table: &str,
    id: &str,
) -> Result<Option<String>, AppError> {
    let sql = format!("SELECT updated_at FROM {} WHERE id = ?1", table);
    match conn.query_row(&sql, params![id], |row| row.get::<_, String>(0)) {
        Ok(val) => Ok(Some(val)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(AppError::Database(e.to_string())),
    }
}

fn import_company_profile(
    conn: &rusqlite::Connection,
    data: &CompanyProfile,
    counts: &mut EntityImportCounts,
) -> Result<(), AppError> {
    let existing = get_existing_updated_at(conn, "company_profile", &data.id)?;

    match existing {
        None => {
            // Shouldn't happen for company_profile (always has 'default'), but handle it
            counts.skipped += 1;
        }
        Some(existing_updated_at) => {
            if data.updated_at > existing_updated_at {
                conn.execute(
                    "UPDATE company_profile SET name = ?1, address_line_1 = ?2, address_line_2 = ?3,
                     city = ?4, postcode = ?5, country = ?6, email = ?7, phone = ?8,
                     tax_number = ?9, payment_details = ?10, updated_at = ?11
                     WHERE id = ?12",
                    params![
                        data.name,
                        data.address_line_1,
                        data.address_line_2,
                        data.city,
                        data.postcode,
                        data.country,
                        data.email,
                        data.phone,
                        data.tax_number,
                        data.payment_details,
                        data.updated_at,
                        data.id,
                    ],
                )?;
                counts.updated += 1;
            } else {
                counts.skipped += 1;
            }
        }
    }

    Ok(())
}

fn import_settings(
    conn: &rusqlite::Connection,
    data: &Settings,
    counts: &mut EntityImportCounts,
) -> Result<(), AppError> {
    let existing = get_existing_updated_at(conn, "settings", &data.id)?;

    match existing {
        None => {
            counts.skipped += 1;
        }
        Some(existing_updated_at) => {
            if data.updated_at > existing_updated_at {
                // Get existing settings to take MAX of next_invoice_sequence
                let existing_settings = settings_repository::get_settings(conn)?;
                let next_seq = std::cmp::max(
                    existing_settings.next_invoice_sequence,
                    data.next_invoice_sequence,
                );

                conn.execute(
                    "UPDATE settings SET default_currency = ?1, default_tax_rate = ?2,
                     invoice_prefix = ?3, next_invoice_sequence = ?4,
                     accent_color = ?5, font_choice = ?6, footer_text = ?7,
                     show_notes = ?8, show_payment_details = ?9, show_footer = ?10,
                     updated_at = ?11
                     WHERE id = ?12",
                    params![
                        data.default_currency,
                        data.default_tax_rate,
                        data.invoice_prefix,
                        next_seq,
                        data.accent_color,
                        data.font_choice,
                        data.footer_text,
                        data.show_notes,
                        data.show_payment_details,
                        data.show_footer,
                        data.updated_at,
                        data.id,
                    ],
                )?;
                counts.updated += 1;
            } else {
                // Even when skipping, still take MAX of next_invoice_sequence
                let existing_settings = settings_repository::get_settings(conn)?;
                if data.next_invoice_sequence > existing_settings.next_invoice_sequence {
                    conn.execute(
                        "UPDATE settings SET next_invoice_sequence = ?1 WHERE id = ?2",
                        params![data.next_invoice_sequence, data.id],
                    )?;
                }
                counts.skipped += 1;
            }
        }
    }

    Ok(())
}

fn import_customer(
    conn: &rusqlite::Connection,
    data: &Customer,
    counts: &mut EntityImportCounts,
) -> Result<(), AppError> {
    let existing = get_existing_updated_at(conn, "customers", &data.id)?;

    match existing {
        None => {
            conn.execute(
                "INSERT INTO customers (id, name, contact_name, email, phone, address_line_1,
                 address_line_2, city, postcode, country, notes, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
                    data.id,
                    data.name,
                    data.contact_name,
                    data.email,
                    data.phone,
                    data.address_line_1,
                    data.address_line_2,
                    data.city,
                    data.postcode,
                    data.country,
                    data.notes,
                    data.created_at,
                    data.updated_at,
                ],
            )?;
            counts.created += 1;
        }
        Some(existing_updated_at) => {
            if data.updated_at > existing_updated_at {
                conn.execute(
                    "UPDATE customers SET name = ?1, contact_name = ?2, email = ?3, phone = ?4,
                     address_line_1 = ?5, address_line_2 = ?6, city = ?7, postcode = ?8,
                     country = ?9, notes = ?10, updated_at = ?11
                     WHERE id = ?12",
                    params![
                        data.name,
                        data.contact_name,
                        data.email,
                        data.phone,
                        data.address_line_1,
                        data.address_line_2,
                        data.city,
                        data.postcode,
                        data.country,
                        data.notes,
                        data.updated_at,
                        data.id,
                    ],
                )?;
                counts.updated += 1;
            } else {
                counts.skipped += 1;
            }
        }
    }

    Ok(())
}

fn import_invoice(
    conn: &rusqlite::Connection,
    data: &Invoice,
    counts: &mut EntityImportCounts,
) -> Result<ImportAction, AppError> {
    let existing = get_existing_updated_at(conn, "invoices", &data.id)?;

    match existing {
        None => {
            conn.execute(
                "INSERT INTO invoices (id, customer_id, invoice_number, issue_date, due_date,
                 status, currency, notes, subtotal_amount, tax_amount, total_amount, tax_rate,
                 created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
                params![
                    data.id,
                    data.customer_id,
                    data.invoice_number,
                    data.issue_date,
                    data.due_date,
                    data.status,
                    data.currency,
                    data.notes,
                    data.subtotal_amount,
                    data.tax_amount,
                    data.total_amount,
                    data.tax_rate,
                    data.created_at,
                    data.updated_at,
                ],
            )?;
            counts.created += 1;
            Ok(ImportAction::Created)
        }
        Some(existing_updated_at) => {
            if data.updated_at > existing_updated_at {
                conn.execute(
                    "UPDATE invoices SET customer_id = ?1, invoice_number = ?2, issue_date = ?3,
                     due_date = ?4, status = ?5, currency = ?6, notes = ?7, subtotal_amount = ?8,
                     tax_amount = ?9, total_amount = ?10, tax_rate = ?11, updated_at = ?12
                     WHERE id = ?13",
                    params![
                        data.customer_id,
                        data.invoice_number,
                        data.issue_date,
                        data.due_date,
                        data.status,
                        data.currency,
                        data.notes,
                        data.subtotal_amount,
                        data.tax_amount,
                        data.total_amount,
                        data.tax_rate,
                        data.updated_at,
                        data.id,
                    ],
                )?;
                counts.updated += 1;
                Ok(ImportAction::Updated)
            } else {
                counts.skipped += 1;
                Ok(ImportAction::Skipped)
            }
        }
    }
}
