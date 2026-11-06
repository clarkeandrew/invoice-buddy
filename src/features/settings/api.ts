import { invoke } from "@tauri-apps/api/core";
import type {
  CompanyProfile,
  Settings,
  UpdateCompanyProfileRequest,
  UpdateSettingsRequest,
} from "./types";

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return invoke<CompanyProfile>("get_company_profile");
}

export async function updateCompanyProfile(
  payload: UpdateCompanyProfileRequest,
): Promise<CompanyProfile> {
  return invoke<CompanyProfile>("update_company_profile", { payload });
}

export async function getSettings(): Promise<Settings> {
  return invoke<Settings>("get_settings");
}

export async function updateSettings(
  payload: UpdateSettingsRequest,
): Promise<Settings> {
  return invoke<Settings>("update_settings", { payload });
}

export async function uploadLogo(
  data: number[],
  filename: string,
): Promise<string> {
  return invoke<string>("upload_logo", { data, filename });
}

export async function removeLogo(): Promise<void> {
  return invoke<void>("remove_logo");
}
