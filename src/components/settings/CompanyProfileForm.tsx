import { useState, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { companyProfileSchema, type CompanyProfileFormData } from "@/features/settings/validators";
import type { CompanyProfile } from "@/features/settings/types";
import { uploadLogo, removeLogo } from "@/features/settings/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import LogoCropModal from "./LogoCropModal";

interface CompanyProfileFormProps {
  initialValues?: CompanyProfile | null;
  onSubmit: (data: CompanyProfileFormData) => Promise<void>;
  onProfileRefresh?: () => void;
}

export default function CompanyProfileForm({ initialValues, onSubmit, onProfileRefresh }: CompanyProfileFormProps) {
  const [formData, setFormData] = useState<CompanyProfileFormData>({
    company_name: initialValues?.company_name ?? "",
    address_line_1: initialValues?.address_line_1 ?? "",
    address_line_2: initialValues?.address_line_2 ?? "",
    city: initialValues?.city ?? "",
    postcode: initialValues?.postcode ?? "",
    country: initialValues?.country ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    tax_number: initialValues?.tax_number ?? "",
    payment_details: initialValues?.payment_details ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPath, setLogoPath] = useState(initialValues?.logo_path ?? "");
  const [logoCacheBust, setLogoCacheBust] = useState(Date.now());
  const [logoUploading, setLogoUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState("");
  const [pendingFilename, setPendingFilename] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(field: keyof CompanyProfileFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImageSrc(reader.result as string);
      setPendingFilename(file.name);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    setCropModalOpen(false);
    setLogoUploading(true);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const data = Array.from(new Uint8Array(arrayBuffer));
      const ext = pendingFilename.split(".").pop() ?? "png";
      const path = await uploadLogo(data, `logo.${ext}`);
      setLogoPath(path);
      setLogoCacheBust(Date.now());
      onProfileRefresh?.();
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : String(err) });
    } finally {
      setLogoUploading(false);
      setPendingImageSrc("");
      setPendingFilename("");
    }
  }

  function handleCropCancel() {
    setCropModalOpen(false);
    setPendingImageSrc("");
    setPendingFilename("");
  }

  async function handleRemoveLogo() {
    setLogoUploading(true);
    try {
      await removeLogo();
      setLogoPath("");
      onProfileRefresh?.();
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : String(err) });
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = companyProfileSchema.safeParse(formData);
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
    <form id="company-profile-form" onSubmit={handleSubmit} className="space-y-4">
      {errors._form && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{errors._form}</div>
      )}
      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
        <div className="flex items-center gap-4">
          {logoPath ? (
            <div className="flex items-center gap-4">
              <img
                src={`${convertFileSrc(logoPath)}?t=${logoCacheBust}`}
                alt="Company logo"
                className="h-16 max-w-[200px] object-contain rounded border border-gray-200 bg-white p-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleRemoveLogo}
                disabled={logoUploading}
              >
                Remove Logo
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                No logo
              </div>
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoUpload}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={logoUploading}
            />
          </div>
        </div>
      </div>

      <Input
        label="Company Name"
        value={formData.company_name}
        onChange={(e) => handleChange("company_name", e.target.value)}
        error={errors.company_name}
        required
      />

      <Input
        label="Address Line 1"
        value={formData.address_line_1}
        onChange={(e) => handleChange("address_line_1", e.target.value)}
      />

      <Input
        label="Address Line 2"
        value={formData.address_line_2}
        onChange={(e) => handleChange("address_line_2", e.target.value)}
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => handleChange("city", e.target.value)}
        />
        <Input
          label="Postcode"
          value={formData.postcode}
          onChange={(e) => handleChange("postcode", e.target.value)}
        />
        <Input
          label="Country"
          value={formData.country}
          onChange={(e) => handleChange("country", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={errors.email}
        />
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      <Input
        label="Tax / VAT Number"
        value={formData.tax_number}
        onChange={(e) => handleChange("tax_number", e.target.value)}
      />

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Details
        </label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          value={formData.payment_details}
          onChange={(e) => handleChange("payment_details", e.target.value)}
          placeholder="Bank name, account number, sort code, etc."
        />
      </div>

      <LogoCropModal
        open={cropModalOpen}
        imageSrc={pendingImageSrc}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </form>
  );
}
