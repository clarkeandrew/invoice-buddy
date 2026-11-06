import { useState } from "react";
import { useCompanyProfile, useSettings } from "@/features/settings/hooks";
import type { CompanyProfileFormData, SettingsFormData } from "@/features/settings/validators";
import { settingsSchema, appearanceSchema } from "@/features/settings/validators";
import { ACCENT_PRESETS } from "@/lib/invoice-appearance";
import CompanyProfileForm from "@/components/settings/CompanyProfileForm";
import DataSection from "@/components/settings/DataSection";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function Settings() {
  const { profile, loading: profileLoading, update: updateProfile, refetch: refetchProfile } = useCompanyProfile();
  const { settings, loading: settingsLoading, update: updateSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleProfileSubmit(data: CompanyProfileFormData) {
    await updateProfile(data);
  }

  async function handleSaveAll() {
    setSaving(true);
    setSaveResult(null);

    const errors: string[] = [];

    const formIds = ["company-profile-form", "invoice-defaults-form", "invoice-appearance-form"];

    for (const id of formIds) {
      const form = document.getElementById(id) as HTMLFormElement | null;
      if (form) {
        if (!form.checkValidity()) {
          errors.push(`${id.replace(/-/g, " ")} has validation errors`);
        } else {
          form.requestSubmit();
        }
      }
    }

    // Let async form handlers settle
    await new Promise((r) => setTimeout(r, 300));

    setSaving(false);
    if (errors.length > 0) {
      setSaveResult({ success: false, message: errors.join(". ") });
    } else {
      setSaveResult({ success: true, message: "All settings saved" });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 z-10 py-3 -mt-3">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="flex items-center gap-3">
          {saveResult && (
            <span className={`text-sm ${saveResult.success ? "text-green-600" : "text-red-600"}`}>
              {saveResult.message}
            </span>
          )}
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Company Profile */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Profile</h2>
          {profileLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <CompanyProfileForm
              initialValues={profile}
              onSubmit={handleProfileSubmit}
              onProfileRefresh={refetchProfile}
            />
          )}
        </section>

        {/* Invoice Defaults */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Defaults</h2>
          {settingsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <InvoiceDefaultsForm
              initialValues={settings}
              onSubmit={updateSettings}
            />
          )}
        </section>

        {/* Invoice Appearance */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Appearance</h2>
          {settingsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <InvoiceAppearanceForm
              initialValues={settings}
              onSubmit={updateSettings}
            />
          )}
        </section>

        {/* Data */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data</h2>
          <DataSection />
        </section>
      </div>
    </div>
  );
}

function InvoiceDefaultsForm({
  initialValues,
  onSubmit,
}: {
  initialValues: { invoice_prefix: string; default_tax_rate: number; default_currency: string } | null;
  onSubmit: (data: { invoice_prefix?: string; default_tax_rate?: number; default_currency?: string }) => Promise<unknown>;
}) {
  const [prefix, setPrefix] = useState(initialValues?.invoice_prefix ?? "INV-");
  const [taxRate, setTaxRate] = useState(initialValues?.default_tax_rate ?? 1000);
  const [taxRateDraft, setTaxRateDraft] = useState<string | null>(null);
  const [currency, setCurrency] = useState(initialValues?.default_currency ?? "EUR");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: SettingsFormData = {
      invoice_prefix: prefix,
      default_tax_rate: taxRate,
      default_currency: currency,
    };
    const result = settingsSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <form id="invoice-defaults-form" onSubmit={handleSubmit} className="space-y-4">
      {errors._form && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{errors._form}</div>
      )}

      <Input
        label="Invoice Prefix"
        value={prefix}
        onChange={(e) => { setPrefix(e.target.value); }}
        error={errors.invoice_prefix}
        placeholder="INV-"
      />

      <Input
        label="Default VAT Rate (%)"
        type="number"
        step="0.01"
        value={taxRateDraft ?? (taxRate / 100).toFixed(2)}
        onFocus={() => setTaxRateDraft((taxRate / 100).toFixed(2))}
        onChange={(e) => { setTaxRateDraft(e.target.value); }}
        onBlur={() => {
          setTaxRate(Math.round(parseFloat(taxRateDraft ?? "0") * 100) || 0);
          setTaxRateDraft(null);
        }}
        error={errors.default_tax_rate}
      />

      <Input
        label="Default Currency"
        value={currency}
        onChange={(e) => { setCurrency(e.target.value.toUpperCase()); }}
        error={errors.default_currency}
        placeholder="EUR"
        maxLength={3}
      />
    </form>
  );
}

function InvoiceAppearanceForm({
  initialValues,
  onSubmit,
}: {
  initialValues: {
    accent_color: string;
    font_choice: string;
    footer_text: string;
    show_notes: boolean;
    show_payment_details: boolean;
    show_footer: boolean;
  } | null;
  onSubmit: (data: {
    accent_color?: string;
    font_choice?: string;
    footer_text?: string;
    show_notes?: boolean;
    show_payment_details?: boolean;
    show_footer?: boolean;
  }) => Promise<unknown>;
}) {
  const [accentColor, setAccentColor] = useState(initialValues?.accent_color ?? "#2563eb");
  const [fontChoice, setFontChoice] = useState(initialValues?.font_choice ?? "sans-serif");
  const [footerText, setFooterText] = useState(initialValues?.footer_text ?? "Thank you for your business");
  const [showNotes, setShowNotes] = useState(initialValues?.show_notes ?? true);
  const [showPaymentDetails, setShowPaymentDetails] = useState(initialValues?.show_payment_details ?? true);
  const [showFooter, setShowFooter] = useState(initialValues?.show_footer ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      accent_color: accentColor,
      font_choice: fontChoice,
      footer_text: footerText,
      show_notes: showNotes,
      show_payment_details: showPaymentDetails,
      show_footer: showFooter,
    };
    const result = appearanceSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : String(err) });
    }
  }

  const fontOptions = [
    { value: "sans-serif", label: "Sans-serif" },
    { value: "serif", label: "Serif" },
    { value: "monospace", label: "Monospace" },
  ];

  return (
    <form id="invoice-appearance-form" onSubmit={handleSubmit} className="space-y-5">
      {errors._form && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{errors._form}</div>
      )}

      {/* Accent Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
        <div className="flex items-center gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              title={preset.name}
              onClick={() => { setAccentColor(preset.hex); }}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                accentColor === preset.hex ? "border-gray-900 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          ))}
          <input
            type="color"
            value={accentColor}
            onChange={(e) => { setAccentColor(e.target.value); }}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => { setAccentColor(e.target.value); }}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md"
            placeholder="#2563eb"
          />
        </div>
        {errors.accent_color && <p className="text-sm text-red-600 mt-1">{errors.accent_color}</p>}
      </div>

      {/* Font */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Font</label>
        <div className="flex gap-4">
          {fontOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="font_choice"
                value={opt.value}
                checked={fontChoice === opt.value}
                onChange={() => { setFontChoice(opt.value); }}
                className="text-blue-600"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer Text */}
      <Input
        label="Footer Text"
        value={footerText}
        onChange={(e) => { setFooterText(e.target.value); }}
        error={errors.footer_text}
        placeholder="Thank you for your business"
        maxLength={200}
      />

      {/* Section Visibility */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Section Visibility</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showNotes}
              onChange={(e) => { setShowNotes(e.target.checked); }}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Show Notes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPaymentDetails}
              onChange={(e) => { setShowPaymentDetails(e.target.checked); }}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Show Payment Details</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFooter}
              onChange={(e) => { setShowFooter(e.target.checked); }}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-700">Show Footer</span>
          </label>
        </div>
      </div>

    </form>
  );
}
