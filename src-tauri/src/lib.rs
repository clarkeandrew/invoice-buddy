use std::sync::Mutex;

use tauri::Manager;

mod commands;
mod db;
mod dto;
mod errors;
mod models;
mod repositories;
mod services;
mod utils;

pub struct DbState(pub Mutex<rusqlite::Connection>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize the database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data directory");

            let conn = db::connection::initialize_database(&app_data_dir)
                .expect("Failed to initialize database");

            app.manage(DbState(Mutex::new(conn)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Customers
            commands::customers::list_customers,
            commands::customers::get_customer,
            commands::customers::create_customer,
            commands::customers::update_customer,
            commands::customers::delete_customer,
            // Invoices
            commands::invoices::list_invoices,
            commands::invoices::get_invoice,
            commands::invoices::create_invoice,
            commands::invoices::update_invoice,
            commands::invoices::delete_invoice,
            commands::invoices::update_invoice_status,
            // Settings
            commands::settings::get_company_profile,
            commands::settings::update_company_profile,
            commands::settings::get_settings,
            commands::settings::update_settings,
            commands::settings::get_dashboard_summary,
            commands::settings::upload_logo,
            commands::settings::remove_logo,
            // Export
            commands::export::save_pdf_bytes,
            commands::export::preview_pdf_bytes,
            // Data Transfer
            commands::data_transfer::export_data,
            commands::data_transfer::import_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
