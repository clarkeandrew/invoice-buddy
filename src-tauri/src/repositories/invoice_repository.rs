use rusqlite::{params, Connection};

use crate::errors::app_error::AppError;
use crate::models::customer::Customer;
use crate::models::invoice::Invoice;
use crate::models::invoice_line_item::InvoiceLineItem;

fn row_to_invoice(row: &rusqlite::Row) -> rusqlite::Result<Invoice> {
    Ok(Invoice {
        id: row.get(0)?,
        customer_id: row.get(1)?,
        invoice_number: row.get(2)?,
        issue_date: row.get(3)?,
        due_date: row.get(4)?,
        status: row.get(5)?,
        currency: row.get(6)?,
        notes: row.get(7)?,
        subtotal_amount: row.get(8)?,
        tax_amount: row.get(9)?,
        total_amount: row.get(10)?,
        tax_rate: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

fn row_to_line_item(row: &rusqlite::Row) -> rusqlite::Result<InvoiceLineItem> {
    Ok(InvoiceLineItem {
        id: row.get(0)?,
        invoice_id: row.get(1)?,
        sort_order: row.get(2)?,
        description: row.get(3)?,
        quantity: row.get(4)?,
        unit_price: row.get(5)?,
        line_total: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

/// List all invoices with their customer names, ordered by issue date descending.
pub fn list_invoices(conn: &Connection) -> Result<Vec<(Invoice, String)>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT i.id, i.customer_id, i.invoice_number, i.issue_date, i.due_date,
                i.status, i.currency, i.notes, i.subtotal_amount, i.tax_amount,
                i.total_amount, i.tax_rate, i.created_at, i.updated_at,
                c.name
         FROM invoices i
         JOIN customers c ON c.id = i.customer_id
         ORDER BY i.issue_date DESC",
    )?;

    let rows = stmt.query_map([], |row| {
        let invoice = row_to_invoice(row)?;
        let customer_name: String = row.get(14)?;
        Ok((invoice, customer_name))
    })?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row?);
    }
    Ok(results)
}

/// Get a single invoice with its line items and customer.
pub fn get_invoice(
    conn: &Connection,
    id: &str,
) -> Result<(Invoice, Vec<InvoiceLineItem>, Customer), AppError> {
    let invoice_and_customer = conn
        .query_row(
            "SELECT i.id, i.customer_id, i.invoice_number, i.issue_date, i.due_date,
                    i.status, i.currency, i.notes, i.subtotal_amount, i.tax_amount,
                    i.total_amount, i.tax_rate, i.created_at, i.updated_at,
                    c.id, c.name, c.contact_name, c.email, c.phone,
                    c.address_line_1, c.address_line_2, c.city, c.postcode, c.country,
                    c.notes, c.created_at, c.updated_at
             FROM invoices i
             JOIN customers c ON c.id = i.customer_id
             WHERE i.id = ?1",
            params![id],
            |row| {
                let invoice = row_to_invoice(row)?;
                let customer = Customer {
                    id: row.get(14)?,
                    name: row.get(15)?,
                    contact_name: row.get(16)?,
                    email: row.get(17)?,
                    phone: row.get(18)?,
                    address_line_1: row.get(19)?,
                    address_line_2: row.get(20)?,
                    city: row.get(21)?,
                    postcode: row.get(22)?,
                    country: row.get(23)?,
                    notes: row.get(24)?,
                    created_at: row.get(25)?,
                    updated_at: row.get(26)?,
                };
                Ok((invoice, customer))
            },
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Invoice with id '{}' not found", id))
            }
            _ => AppError::Database(e.to_string()),
        })?;

    let (invoice, customer) = invoice_and_customer;

    // Fetch line items
    let mut stmt = conn.prepare(
        "SELECT id, invoice_id, sort_order, description, quantity, unit_price,
                line_total, created_at, updated_at
         FROM invoice_line_items
         WHERE invoice_id = ?1
         ORDER BY sort_order ASC",
    )?;

    let items = stmt
        .query_map(params![id], row_to_line_item)?
        .collect::<Result<Vec<_>, _>>()?;

    Ok((invoice, items, customer))
}

/// Create a new invoice with its line items.
/// Caller is responsible for wrapping in a transaction if needed.
pub fn create_invoice(
    conn: &Connection,
    invoice: &Invoice,
    items: &[InvoiceLineItem],
) -> Result<(), AppError> {
    conn.execute(
        "INSERT INTO invoices (id, customer_id, invoice_number, issue_date, due_date,
         status, currency, notes, subtotal_amount, tax_amount, total_amount, tax_rate,
         created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            invoice.id,
            invoice.customer_id,
            invoice.invoice_number,
            invoice.issue_date,
            invoice.due_date,
            invoice.status,
            invoice.currency,
            invoice.notes,
            invoice.subtotal_amount,
            invoice.tax_amount,
            invoice.total_amount,
            invoice.tax_rate,
            invoice.created_at,
            invoice.updated_at,
        ],
    )?;

    insert_line_items(conn, items)?;
    Ok(())
}

/// Update an existing invoice: replace all line items inside a transaction.
pub fn update_invoice(
    conn: &Connection,
    invoice: &Invoice,
    items: &[InvoiceLineItem],
) -> Result<(), AppError> {
    conn.execute_batch("BEGIN")?;

    let result = (|| -> Result<(), AppError> {
        conn.execute(
            "UPDATE invoices SET customer_id = ?1, invoice_number = ?2, issue_date = ?3,
             due_date = ?4, status = ?5, currency = ?6, notes = ?7, subtotal_amount = ?8,
             tax_amount = ?9, total_amount = ?10, tax_rate = ?11, updated_at = ?12
             WHERE id = ?13",
            params![
                invoice.customer_id,
                invoice.invoice_number,
                invoice.issue_date,
                invoice.due_date,
                invoice.status,
                invoice.currency,
                invoice.notes,
                invoice.subtotal_amount,
                invoice.tax_amount,
                invoice.total_amount,
                invoice.tax_rate,
                invoice.updated_at,
                invoice.id,
            ],
        )?;

        // Delete old line items and insert new ones
        conn.execute(
            "DELETE FROM invoice_line_items WHERE invoice_id = ?1",
            params![invoice.id],
        )?;

        insert_line_items(conn, items)?;
        Ok(())
    })();

    match result {
        Ok(()) => {
            conn.execute_batch("COMMIT")?;
            Ok(())
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            Err(e)
        }
    }
}

/// Delete an invoice and its line items inside a transaction.
pub fn delete_invoice(conn: &Connection, id: &str) -> Result<(), AppError> {
    conn.execute_batch("BEGIN")?;

    let result = (|| -> Result<(), AppError> {
        conn.execute(
            "DELETE FROM invoice_line_items WHERE invoice_id = ?1",
            params![id],
        )?;

        let affected = conn.execute("DELETE FROM invoices WHERE id = ?1", params![id])?;
        if affected == 0 {
            return Err(AppError::NotFound(format!(
                "Invoice with id '{}' not found",
                id
            )));
        }
        Ok(())
    })();

    match result {
        Ok(()) => {
            conn.execute_batch("COMMIT")?;
            Ok(())
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            Err(e)
        }
    }
}

/// Update only the status of an invoice.
pub fn update_invoice_status(conn: &Connection, id: &str, status: &str) -> Result<(), AppError> {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let affected = conn.execute(
        "UPDATE invoices SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![status, now, id],
    )?;
    if affected == 0 {
        return Err(AppError::NotFound(format!(
            "Invoice with id '{}' not found",
            id
        )));
    }
    Ok(())
}

/// List all invoices (without customer join), ordered by issue date descending.
pub fn list_all_invoices(conn: &Connection) -> Result<Vec<Invoice>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, customer_id, invoice_number, issue_date, due_date,
                status, currency, notes, subtotal_amount, tax_amount,
                total_amount, tax_rate, created_at, updated_at
         FROM invoices
         ORDER BY issue_date DESC",
    )?;

    let rows = stmt
        .query_map([], row_to_invoice)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

/// List all line items, ordered by invoice_id then sort_order.
pub fn list_all_line_items(conn: &Connection) -> Result<Vec<InvoiceLineItem>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, invoice_id, sort_order, description, quantity, unit_price,
                line_total, created_at, updated_at
         FROM invoice_line_items
         ORDER BY invoice_id, sort_order",
    )?;

    let rows = stmt
        .query_map([], row_to_line_item)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

fn insert_line_items(conn: &Connection, items: &[InvoiceLineItem]) -> Result<(), AppError> {
    for item in items {
        conn.execute(
            "INSERT INTO invoice_line_items (id, invoice_id, sort_order, description,
             quantity, unit_price, line_total, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                item.id,
                item.invoice_id,
                item.sort_order,
                item.description,
                item.quantity,
                item.unit_price,
                item.line_total,
                item.created_at,
                item.updated_at,
            ],
        )?;
    }
    Ok(())
}
