use tauri::State;

use crate::dto::customer_dto::{CreateCustomerRequest, CustomerDto, UpdateCustomerRequest};
use crate::errors::app_error::AppError;
use crate::repositories::customer_repository;
use crate::DbState;

#[tauri::command]
pub fn list_customers(state: State<'_, DbState>) -> Result<Vec<CustomerDto>, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let customers = customer_repository::list_customers(&conn)?;
    Ok(customers.into_iter().map(CustomerDto::from).collect())
}

#[tauri::command]
pub fn get_customer(state: State<'_, DbState>, id: String) -> Result<CustomerDto, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let customer = customer_repository::get_customer(&conn, &id)?;
    Ok(CustomerDto::from(customer))
}

#[tauri::command]
pub fn create_customer(
    state: State<'_, DbState>,
    payload: CreateCustomerRequest,
) -> Result<CustomerDto, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let customer = customer_repository::create_customer(&conn, &payload)?;
    Ok(CustomerDto::from(customer))
}

#[tauri::command]
pub fn update_customer(
    state: State<'_, DbState>,
    id: String,
    payload: UpdateCustomerRequest,
) -> Result<CustomerDto, AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let customer = customer_repository::update_customer(&conn, &id, &payload)?;
    Ok(CustomerDto::from(customer))
}

#[tauri::command]
pub fn delete_customer(state: State<'_, DbState>, id: String) -> Result<(), AppError> {
    let conn = state
        .0
        .lock()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    customer_repository::delete_customer(&conn, &id)
}
