use rusqlite::{params, Connection};
use uuid::Uuid;

use crate::dto::customer_dto::{CreateCustomerRequest, UpdateCustomerRequest};
use crate::errors::app_error::AppError;
use crate::models::customer::Customer;

pub fn list_customers(conn: &Connection) -> Result<Vec<Customer>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, name, contact_name, email, phone, address_line_1, address_line_2,
                city, postcode, country, notes, created_at, updated_at
         FROM customers
         ORDER BY name ASC",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(Customer {
            id: row.get(0)?,
            name: row.get(1)?,
            contact_name: row.get(2)?,
            email: row.get(3)?,
            phone: row.get(4)?,
            address_line_1: row.get(5)?,
            address_line_2: row.get(6)?,
            city: row.get(7)?,
            postcode: row.get(8)?,
            country: row.get(9)?,
            notes: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })?;

    let mut customers = Vec::new();
    for row in rows {
        customers.push(row?);
    }
    Ok(customers)
}

pub fn get_customer(conn: &Connection, id: &str) -> Result<Customer, AppError> {
    conn.query_row(
        "SELECT id, name, contact_name, email, phone, address_line_1, address_line_2,
                city, postcode, country, notes, created_at, updated_at
         FROM customers WHERE id = ?1",
        params![id],
        |row| {
            Ok(Customer {
                id: row.get(0)?,
                name: row.get(1)?,
                contact_name: row.get(2)?,
                email: row.get(3)?,
                phone: row.get(4)?,
                address_line_1: row.get(5)?,
                address_line_2: row.get(6)?,
                city: row.get(7)?,
                postcode: row.get(8)?,
                country: row.get(9)?,
                notes: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        },
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => {
            AppError::NotFound(format!("Customer with id '{}' not found", id))
        }
        _ => AppError::Database(e.to_string()),
    })
}

pub fn create_customer(
    conn: &Connection,
    dto: &CreateCustomerRequest,
) -> Result<Customer, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO customers (id, name, contact_name, email, phone, address_line_1,
         address_line_2, city, postcode, country, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            id,
            dto.name,
            dto.contact_name,
            dto.email,
            dto.phone,
            dto.address_line_1,
            dto.address_line_2,
            dto.city,
            dto.postcode,
            dto.country,
            dto.notes,
            now,
            now,
        ],
    )?;

    get_customer(conn, &id)
}

pub fn update_customer(
    conn: &Connection,
    id: &str,
    dto: &UpdateCustomerRequest,
) -> Result<Customer, AppError> {
    // Fetch the existing customer first
    let existing = get_customer(conn, id)?;
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let name = dto.name.as_deref().unwrap_or(&existing.name);
    let contact_name = dto.contact_name.as_ref().or(existing.contact_name.as_ref());
    let email = dto.email.as_ref().or(existing.email.as_ref());
    let phone = dto.phone.as_ref().or(existing.phone.as_ref());
    let address_line_1 = dto
        .address_line_1
        .as_ref()
        .or(existing.address_line_1.as_ref());
    let address_line_2 = dto
        .address_line_2
        .as_ref()
        .or(existing.address_line_2.as_ref());
    let city = dto.city.as_ref().or(existing.city.as_ref());
    let postcode = dto.postcode.as_ref().or(existing.postcode.as_ref());
    let country = dto.country.as_ref().or(existing.country.as_ref());
    let notes = dto.notes.as_ref().or(existing.notes.as_ref());

    conn.execute(
        "UPDATE customers SET name = ?1, contact_name = ?2, email = ?3, phone = ?4,
         address_line_1 = ?5, address_line_2 = ?6, city = ?7, postcode = ?8,
         country = ?9, notes = ?10, updated_at = ?11
         WHERE id = ?12",
        params![
            name,
            contact_name,
            email,
            phone,
            address_line_1,
            address_line_2,
            city,
            postcode,
            country,
            notes,
            now,
            id,
        ],
    )?;

    get_customer(conn, id)
}

pub fn delete_customer(conn: &Connection, id: &str) -> Result<(), AppError> {
    let affected = conn.execute("DELETE FROM customers WHERE id = ?1", params![id])?;
    if affected == 0 {
        return Err(AppError::NotFound(format!(
            "Customer with id '{}' not found",
            id
        )));
    }
    Ok(())
}
