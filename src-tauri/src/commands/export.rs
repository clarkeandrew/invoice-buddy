use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::errors::app_error::AppError;

#[tauri::command]
pub fn save_pdf_bytes(path: String, data: Vec<u8>) -> Result<String, AppError> {
    let file_path = PathBuf::from(&path);

    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| AppError::Filesystem(format!("Failed to create directory: {}", e)))?;
    }

    fs::write(&file_path, &data)
        .map_err(|e| AppError::Filesystem(format!("Failed to write PDF: {}", e)))?;

    Ok(path)
}

#[tauri::command]
pub fn preview_pdf_bytes(file_name: String, data: Vec<u8>) -> Result<String, AppError> {
    let stem: String = Path::new(&file_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("invoice")
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect();

    let ts = chrono::Utc::now().timestamp_millis();
    let mut path = env::temp_dir();
    path.push("invoice-buddy");
    fs::create_dir_all(&path)
        .map_err(|e| AppError::Filesystem(format!("Failed to create temp dir: {}", e)))?;
    path.push(format!("{}-{}.pdf", stem, ts));

    fs::write(&path, &data)
        .map_err(|e| AppError::Filesystem(format!("Failed to write PDF: {}", e)))?;

    open_path(&path)?;
    Ok(path.to_string_lossy().into_owned())
}

#[cfg(target_os = "macos")]
fn open_path(path: &Path) -> Result<(), AppError> {
    Command::new("open")
        .arg(path)
        .spawn()
        .map_err(|e| AppError::Filesystem(format!("Failed to open PDF: {}", e)))?;
    Ok(())
}

#[cfg(target_os = "linux")]
fn open_path(path: &Path) -> Result<(), AppError> {
    Command::new("xdg-open")
        .arg(path)
        .spawn()
        .map_err(|e| AppError::Filesystem(format!("Failed to open PDF: {}", e)))?;
    Ok(())
}

#[cfg(target_os = "windows")]
fn open_path(path: &Path) -> Result<(), AppError> {
    Command::new("cmd")
        .args(["/C", "start", ""])
        .arg(path)
        .spawn()
        .map_err(|e| AppError::Filesystem(format!("Failed to open PDF: {}", e)))?;
    Ok(())
}
