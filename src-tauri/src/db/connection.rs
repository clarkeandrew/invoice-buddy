use std::path::Path;

use rusqlite::Connection;

use crate::db::migrations::run_migrations;
use crate::errors::app_error::AppError;

pub fn initialize_database(app_data_dir: &Path) -> Result<Connection, AppError> {
    // Create the data directory if it doesn't exist
    std::fs::create_dir_all(app_data_dir)
        .map_err(|e| AppError::Filesystem(format!("Failed to create app data directory: {}", e)))?;

    let db_path = app_data_dir.join("invoice_buddy.db");
    let conn = Connection::open(&db_path)?;

    // Enable WAL mode for better concurrent read performance
    conn.pragma_update(None, "journal_mode", "WAL")?;

    // Enable foreign key enforcement
    conn.pragma_update(None, "foreign_keys", "ON")?;

    // Run database migrations
    run_migrations(&conn)?;

    Ok(conn)
}
