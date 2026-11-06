import { useState } from "react";
import { createCustomerSchema, type CreateCustomerFormData } from "@/features/customers/validators";
import type { Customer } from "@/features/customers/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface CustomerFormProps {
  initialValues?: Partial<Customer>;
  onSubmit: (data: CreateCustomerFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function CustomerForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CreateCustomerFormData>({
    name: initialValues?.name ?? "",
    contact_name: initialValues?.contact_name ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    address_line_1: initialValues?.address_line_1 ?? "",
    address_line_2: initialValues?.address_line_2 ?? "",
    city: initialValues?.city ?? "",
    postcode: initialValues?.postcode ?? "",
    country: initialValues?.country ?? "",
    notes: initialValues?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof CreateCustomerFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createCustomerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors._form && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {errors._form}
        </div>
      )}

      <Input
        label="Company / Customer Name"
        value={formData.name}
        onChange={(e) => handleChange("name", e.target.value)}
        error={errors.name}
        required
      />

      <Input
        label="Contact Name"
        value={formData.contact_name}
        onChange={(e) => handleChange("contact_name", e.target.value)}
        error={errors.contact_name}
      />

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
          error={errors.phone}
        />
      </div>

      <Input
        label="Address Line 1"
        value={formData.address_line_1}
        onChange={(e) => handleChange("address_line_1", e.target.value)}
        error={errors.address_line_1}
      />

      <Input
        label="Address Line 2"
        value={formData.address_line_2}
        onChange={(e) => handleChange("address_line_2", e.target.value)}
        error={errors.address_line_2}
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="City"
          value={formData.city}
          onChange={(e) => handleChange("city", e.target.value)}
          error={errors.city}
        />
        <Input
          label="Postcode"
          value={formData.postcode}
          onChange={(e) => handleChange("postcode", e.target.value)}
          error={errors.postcode}
        />
        <Input
          label="Country"
          value={formData.country}
          onChange={(e) => handleChange("country", e.target.value)}
          error={errors.country}
        />
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
