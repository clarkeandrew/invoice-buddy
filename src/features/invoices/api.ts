import { invoke } from "@tauri-apps/api/core";
import type {
  Invoice,
  InvoiceListItem,
  InvoiceStatus,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
} from "./types";

export async function listInvoices(): Promise<InvoiceListItem[]> {
  return invoke<InvoiceListItem[]>("list_invoices");
}

export async function getInvoice(id: string): Promise<Invoice> {
  return invoke<Invoice>("get_invoice", { id });
}

export async function createInvoice(
  payload: CreateInvoiceRequest,
): Promise<Invoice> {
  return invoke<Invoice>("create_invoice", { payload });
}

export async function updateInvoice(
  id: string,
  payload: Omit<UpdateInvoiceRequest, "id">,
): Promise<Invoice> {
  return invoke<Invoice>("update_invoice", { id, payload });
}

export async function deleteInvoice(id: string): Promise<void> {
  return invoke<void>("delete_invoice", { id });
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
): Promise<Invoice> {
  return invoke<Invoice>("update_invoice_status", { id, status });
}
