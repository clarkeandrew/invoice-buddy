use rusqlite::{params, Connection};

use crate::errors::app_error::AppError;
use crate::models::company_profile::CompanyProfile;
use crate::models::settings::Settings;

pub fn get_company_profile(conn: &Connection) -> Result<CompanyProfile, AppError> {
    conn.query_row(
        "SELECT id, name, address_line_1, address_line_2, city, postcode, country,
                email, phone, tax_number, payment_details, logo_path, created_at, updated_at
         FROM company_profile WHERE id = 'default'",
        [],
        |row| {
            Ok(CompanyProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                address_line_1: row.get(2)?,
                address_line_2: row.get(3)?,
                city: row.get(4)?,
                postcode: row.get(5)?,
                country: row.get(6)?,
                email: row.get(7)?,
                phone: row.get(8)?,
                tax_number: row.get(9)?,
                payment_details: row.get(10)?,
                logo_path: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        },
    )
    .map_err(|e| AppError::Database(e.to_string()))
}

pub fn update_company_profile(
    conn: &Connection,
    profile: &CompanyProfile,
) -> Result<CompanyProfile, AppError> {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE company_profile SET name = ?1, address_line_1 = ?2, address_line_2 = ?3,
         city = ?4, postcode = ?5, country = ?6, email = ?7, phone = ?8,
         tax_number = ?9, payment_details = ?10, updated_at = ?11
         WHERE id = 'default'",
        params![
            profile.name,
            profile.address_line_1,
            profile.address_line_2,
            profile.city,
            profile.postcode,
            profile.country,
            profile.email,
            profile.phone,
            profile.tax_number,
            profile.payment_details,
            now,
        ],
    )?;

    get_company_profile(conn)
}

pub fn update_logo_path(conn: &Connection, logo_path: &str) -> Result<(), AppError> {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.execute(
        "UPDATE company_profile SET logo_path = ?1, updated_at = ?2 WHERE id = 'default'",
        params![logo_path, now],
    )?;
    Ok(())
}

pub fn get_settings(conn: &Connection) -> Result<Settings, AppError> {
    conn.query_row(
        "SELECT id, default_currency, default_tax_rate, invoice_prefix,
                next_invoice_sequence, accent_color, font_choice, footer_text,
                show_notes, show_payment_details, show_footer, created_at, updated_at
         FROM settings WHERE id = 'default'",
        [],
        |row| {
            Ok(Settings {
                id: row.get(0)?,
                default_currency: row.get(1)?,
                default_tax_rate: row.get(2)?,
                invoice_prefix: row.get(3)?,
                next_invoice_sequence: row.get(4)?,
                accent_color: row.get(5)?,
                font_choice: row.get(6)?,
                footer_text: row.get(7)?,
                show_notes: row.get(8)?,
                show_payment_details: row.get(9)?,
                show_footer: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        },
    )
    .map_err(|e| AppError::Database(e.to_string()))
}

pub fn update_settings(conn: &Connection, settings: &Settings) -> Result<Settings, AppError> {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "UPDATE settings SET default_currency = ?1, default_tax_rate = ?2,
         invoice_prefix = ?3, next_invoice_sequence = ?4,
         accent_color = ?5, font_choice = ?6, footer_text = ?7,
         show_notes = ?8, show_payment_details = ?9, show_footer = ?10,
         updated_at = ?11
         WHERE id = 'default'",
        params![
            settings.default_currency,
            settings.default_tax_rate,
            settings.invoice_prefix,
            settings.next_invoice_sequence,
            settings.accent_color,
            settings.font_choice,
            settings.footer_text,
            settings.show_notes,
            settings.show_payment_details,
            settings.show_footer,
            now,
        ],
    )?;

    get_settings(conn)
}

/// Build a short uppercase alphabetic code from a customer name (up to 6 chars).
fn customer_code(name: &str) -> String {
    name.chars()
        .filter(|c| c.is_ascii_alphabetic())
        .take(6)
        .collect::<String>()
        .to_ascii_uppercase()
}

/// Atomically reads the current invoice prefix + sequence number,
/// increments the sequence, and returns the formatted invoice number.
/// The customer name is embedded as a short code between the prefix and sequence.
pub fn get_next_invoice_number(conn: &Connection, customer_name: &str) -> Result<String, AppError> {
    let settings = get_settings(conn)?;
    let code = customer_code(customer_name);
    let invoice_number = if code.is_empty() {
        format!(
            "{}{:04}",
            settings.invoice_prefix, settings.next_invoice_sequence
        )
    } else {
        format!(
            "{}{}-{:04}",
            settings.invoice_prefix, code, settings.next_invoice_sequence
        )
    };

    conn.execute(
        "UPDATE settings SET next_invoice_sequence = next_invoice_sequence + 1,
         updated_at = datetime('now')
         WHERE id = 'default'",
        [],
    )?;

    Ok(invoice_number)
}
