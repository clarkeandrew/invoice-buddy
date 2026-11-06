use rusqlite::Connection;

use crate::errors::app_error::AppError;
use crate::repositories::settings_repository;

/// Get the next invoice number using the configured prefix, customer code, and sequence.
pub fn get_next_invoice_number(conn: &Connection, customer_name: &str) -> Result<String, AppError> {
    settings_repository::get_next_invoice_number(conn, customer_name)
}

#[cfg(test)]
mod tests {
    use crate::db::connection::initialize_database;
    use tempfile::TempDir;

    #[test]
    fn test_sequential_invoice_numbers() {
        let tmp = TempDir::new().unwrap();
        let conn = initialize_database(tmp.path()).unwrap();

        let first = super::get_next_invoice_number(&conn, "Smyth Accounting").unwrap();
        let second = super::get_next_invoice_number(&conn, "Jones Ltd").unwrap();

        assert_eq!(first, "INV-SMYTHA-0001");
        assert_eq!(second, "INV-JONESL-0002");
    }

    #[test]
    fn test_customer_name_without_letters_omits_code() {
        let tmp = TempDir::new().unwrap();
        let conn = initialize_database(tmp.path()).unwrap();

        let number = super::get_next_invoice_number(&conn, "123").unwrap();

        assert_eq!(number, "INV-0001");
    }
}
