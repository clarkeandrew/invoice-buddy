import { useState, useEffect, useCallback } from "react";
import type {
  CompanyProfile,
  Settings,
  UpdateCompanyProfileRequest,
  UpdateSettingsRequest,
} from "./types";
import * as api from "./api";

export function useCompanyProfile() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCompanyProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = async (data: UpdateCompanyProfileRequest) => {
    const updated = await api.updateCompanyProfile(data);
    setProfile(updated);
    return updated;
  };

  return { profile, loading, error, refetch: fetchProfile, update };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const update = async (data: UpdateSettingsRequest) => {
    const updated = await api.updateSettings(data);
    setSettings(updated);
    return updated;
  };

  return { settings, loading, error, refetch: fetchSettings, update };
}
