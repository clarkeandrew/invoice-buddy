import { invoke } from "@tauri-apps/api/core";

export interface EntityImportCounts {
  created: number;
  updated: number;
  skipped: number;
}

export interface ImportResult {
  customers: EntityImportCounts;
  invoices: EntityImportCounts;
  line_items: EntityImportCounts;
  company_profile: EntityImportCounts;
  settings: EntityImportCounts;
  errors: number;
}

export interface ExportResult {
  customers: number;
  invoices: number;
  line_items: number;
}

export function exportData(path: string): Promise<ExportResult> {
  return invoke("export_data", { path });
}

export function importData(path: string): Promise<ImportResult> {
  return invoke("import_data", { path });
}
