import { invoke } from "@tauri-apps/api/core";
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "./types";

export async function listCustomers(): Promise<Customer[]> {
  return invoke<Customer[]>("list_customers");
}

export async function getCustomer(id: string): Promise<Customer> {
  return invoke<Customer>("get_customer", { id });
}

export async function createCustomer(
  payload: CreateCustomerRequest,
): Promise<Customer> {
  return invoke<Customer>("create_customer", { payload });
}

export async function updateCustomer(
  id: string,
  payload: Omit<UpdateCustomerRequest, "id">,
): Promise<Customer> {
  return invoke<Customer>("update_customer", { id, payload });
}

export async function deleteCustomer(id: string): Promise<void> {
  return invoke<void>("delete_customer", { id });
}
