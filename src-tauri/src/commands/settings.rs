use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};

use crate::dto::invoice_dto::InvoiceListDto;
use crate::errors::app_error::AppError;
use crate::models::company_profile::CompanyProfile;
use crate::models::settings::Settings;
use crate::repositories::{customer_repository, invoice_repository, settings_repository};
use crate::DbState;

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub invoice_prefix: Option<String>,
    pub default_tax_rate: Option<i64>,
    pub default_currency: Option<String>,
    pub accent_color: Option<String>,
    pub font_choice: Option<String>,
    pub footer_text: Option<String>,
    pub show_notes: Option<bool>,
    pub show_payment_details: Option<bool>,
    pub show_footer: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCompanyProfileRequest {
    pub company_name: String,
    pub address_line_1: Option<String>,
    pub address_line_2: Option<String>,
    pub city: Option<String>,
    pub postcode: Option<String>,
    pub country: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub tax_number: Option<String>,
    pub payment_details: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DashboardSummary {
    pub total_customers: i64,
    pub total_invoices: i64,
    pub draft_count: i64,
    pub sent_count: i64,
    pub paid_count: i64,
    pub overdue_count: i64,
    pub recent_invoices: Vec<InvoiceListDto>,
}

#[tauri::command]
pub fn get_company_profile(state: State<'_, DbState>) -> Result<CompanyProfile, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    settings_repository::get_company_profile(&conn)
}

#[tauri::command]
pub fn update_company_profile(
    state: State<'_, DbState>,
    payload: UpdateCompanyProfileRequest,
) -> Result<CompanyProfile, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let mut profile = settings_repository::get_company_profile(&conn)?;
    profile.name = payload.company_name;
    profile.address_line_1 = payload.address_line_1.unwrap_or_default();
    profile.address_line_2 = payload.address_line_2.unwrap_or_default();
    profile.city = payload.city.unwrap_or_default();
    profile.postcode = payload.postcode.unwrap_or_default();
    profile.country = payload.country.unwrap_or_default();
    profile.email = payload.email.unwrap_or_default();
    profile.phone = payload.phone.unwrap_or_default();
    profile.tax_number = payload.tax_number.unwrap_or_default();
    profile.payment_details = payload.payment_details.unwrap_or_default();
    settings_repository::update_company_profile(&conn, &profile)
}

#[tauri::command]
pub fn get_settings(state: State<'_, DbState>) -> Result<Settings, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    settings_repository::get_settings(&conn)
}

#[tauri::command]
pub fn update_settings(
    state: State<'_, DbState>,
    payload: UpdateSettingsRequest,
) -> Result<Settings, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let mut settings = settings_repository::get_settings(&conn)?;
    if let Some(prefix) = payload.invoice_prefix {
        settings.invoice_prefix = prefix;
    }
    if let Some(rate) = payload.default_tax_rate {
        settings.default_tax_rate = rate;
    }
    if let Some(currency) = payload.default_currency {
        settings.default_currency = currency;
    }
    if let Some(color) = payload.accent_color {
        settings.accent_color = color;
    }
    if let Some(font) = payload.font_choice {
        settings.font_choice = font;
    }
    if let Some(text) = payload.footer_text {
        settings.footer_text = text;
    }
    if let Some(v) = payload.show_notes {
        settings.show_notes = v;
    }
    if let Some(v) = payload.show_payment_details {
        settings.show_payment_details = v;
    }
    if let Some(v) = payload.show_footer {
        settings.show_footer = v;
    }
    settings_repository::update_settings(&conn, &settings)
}

#[tauri::command]
pub fn upload_logo(
    app: AppHandle,
    state: State<'_, DbState>,
    data: Vec<u8>,
    filename: String,
) -> Result<String, AppError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let logos_dir = app_data_dir.join("logos");
    fs::create_dir_all(&logos_dir)
        .map_err(|e| AppError::Filesystem(format!("Failed to create logos directory: {}", e)))?;

    // Sanitize filename: keep only the extension
    let ext = PathBuf::from(&filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_string();
    let safe_name = format!("logo.{}", ext);
    let dest = logos_dir.join(&safe_name);

    fs::write(&dest, &data)
        .map_err(|e| AppError::Filesystem(format!("Failed to write logo file: {}", e)))?;

    let logo_path = dest
        .to_str()
        .ok_or_else(|| AppError::Internal("Invalid path encoding".to_string()))?
        .to_string();

    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    settings_repository::update_logo_path(&conn, &logo_path)?;

    Ok(logo_path)
}

#[tauri::command]
pub fn remove_logo(state: State<'_, DbState>) -> Result<(), AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let profile = settings_repository::get_company_profile(&conn)?;

    if !profile.logo_path.is_empty() {
        let path = PathBuf::from(&profile.logo_path);
        if path.exists() {
            fs::remove_file(&path)
                .map_err(|e| AppError::Filesystem(format!("Failed to delete logo file: {}", e)))?;
        }
    }

    settings_repository::update_logo_path(&conn, "")?;
    Ok(())
}

#[tauri::command]
pub fn get_dashboard_summary(state: State<'_, DbState>) -> Result<DashboardSummary, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let total_customers = customer_repository::list_customers(&conn)?.len() as i64;

    let all_invoices = invoice_repository::list_invoices(&conn)?;
    let total_invoices = all_invoices.len() as i64;

    let mut draft_count: i64 = 0;
    let mut sent_count: i64 = 0;
    let mut paid_count: i64 = 0;
    let mut overdue_count: i64 = 0;

    for (inv, _) in &all_invoices {
        match inv.status.as_str() {
            "draft" => draft_count += 1,
            "sent" => sent_count += 1,
            "paid" => paid_count += 1,
            "overdue" => overdue_count += 1,
            _ => {}
        }
    }

    // Take the 5 most recent invoices for the dashboard
    let recent_invoices: Vec<InvoiceListDto> = all_invoices
        .into_iter()
        .take(5)
        .map(|(inv, name)| InvoiceListDto::from_invoice_with_customer(inv, name))
        .collect();

    Ok(DashboardSummary {
        total_customers,
        total_invoices,
        draft_count,
        sent_count,
        paid_count,
        overdue_count,
        recent_invoices,
    })
}
