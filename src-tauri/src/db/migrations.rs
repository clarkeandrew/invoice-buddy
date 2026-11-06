use rusqlite::Connection;

use crate::errors::app_error::AppError;

/// Run all pending database migrations in order.
pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    // Create migrations tracking table
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            name TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )?;

    let migrations: Vec<(&str, &str)> = vec![
        ("0001_initial", MIGRATION_0001),
        ("0002_company_profile", MIGRATION_0002),
        ("0003_settings", MIGRATION_0003),
        ("0004_logo", MIGRATION_0004),
        ("0005_default_eur", MIGRATION_0005),
        ("0006_invoice_appearance", MIGRATION_0006),
    ];

    for (name, sql) in migrations {
        let already_applied: bool = conn.query_row(
            "SELECT COUNT(*) > 0 FROM _migrations WHERE name = ?1",
            [name],
            |row| row.get(0),
        )?;

        if !already_applied {
            conn.execute_batch(sql)?;
            conn.execute("INSERT INTO _migrations (name) VALUES (?1)", [name])?;
        }
    }

    Ok(())
}

const MIGRATION_0001: &str = r#"
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    postcode TEXT,
    country TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id),
    invoice_number TEXT NOT NULL UNIQUE,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    subtotal_amount INTEGER NOT NULL DEFAULT 0,
    tax_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    tax_rate INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 100,
    unit_price INTEGER NOT NULL DEFAULT 0,
    line_total INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"#;

const MIGRATION_0002: &str = r#"
CREATE TABLE IF NOT EXISTS company_profile (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    address_line_1 TEXT DEFAULT '',
    address_line_2 TEXT DEFAULT '',
    city TEXT DEFAULT '',
    postcode TEXT DEFAULT '',
    country TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    tax_number TEXT DEFAULT '',
    payment_details TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO company_profile (id) VALUES ('default');
"#;

const MIGRATION_0003: &str = r#"
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    default_currency TEXT NOT NULL DEFAULT 'USD',
    default_tax_rate INTEGER NOT NULL DEFAULT 1000,
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    next_invoice_sequence INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (id) VALUES ('default');
"#;

const MIGRATION_0004: &str = r#"
ALTER TABLE company_profile ADD COLUMN logo_path TEXT DEFAULT '';
"#;

const MIGRATION_0005: &str = r#"
UPDATE settings SET default_currency = 'EUR', default_tax_rate = 2300 WHERE id = 'default';
"#;

const MIGRATION_0006: &str = r#"
ALTER TABLE settings ADD COLUMN accent_color TEXT NOT NULL DEFAULT '#2563eb';
ALTER TABLE settings ADD COLUMN font_choice TEXT NOT NULL DEFAULT 'sans-serif';
ALTER TABLE settings ADD COLUMN footer_text TEXT NOT NULL DEFAULT 'Thank you for your business';
ALTER TABLE settings ADD COLUMN show_notes INTEGER NOT NULL DEFAULT 1;
ALTER TABLE settings ADD COLUMN show_payment_details INTEGER NOT NULL DEFAULT 1;
ALTER TABLE settings ADD COLUMN show_footer INTEGER NOT NULL DEFAULT 1;
"#;
