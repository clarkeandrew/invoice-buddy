import { useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import {
  exportData,
  importData,
  type ImportResult,
} from "@/features/settings/data-transfer-api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function DataSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingImportPath, setPendingImportPath] = useState<string | null>(
    null
  );

  async function handleExport() {
    setMessage(null);
    const path = await save({
      filters: [{ name: "JSONL", extensions: ["jsonl"] }],
      defaultPath: "invoice-buddy-export.jsonl",
    });
    if (!path) return;

    setExporting(true);
    try {
      const result = await exportData(path);
      setMessage({
        type: "success",
        text: `Exported ${result.customers} customers, ${result.invoices} invoices, ${result.line_items} line items.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleImportClick() {
    setMessage(null);
    const path = await open({
      filters: [{ name: "JSONL", extensions: ["jsonl"] }],
      multiple: false,
      directory: false,
    });
    if (!path) return;

    setPendingImportPath(path);
    setConfirmOpen(true);
  }

  async function handleImportConfirm() {
    setConfirmOpen(false);
    if (!pendingImportPath) return;

    setImporting(true);
    try {
      const result = await importData(pendingImportPath);
      setImportResult(result);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setImporting(false);
      setPendingImportPath(null);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={exporting || importing}
        >
          {exporting ? "Exporting..." : "Export Data"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleImportClick}
          disabled={exporting || importing}
        >
          {importing ? "Importing..." : "Import Data"}
        </Button>
      </div>

      {message && (
        <p
          className={`mt-3 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Export all data to a portable JSONL file for backup or migration. Import
        will merge data, updating only records that are newer than existing ones.
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Import Data"
        message="This will merge imported data with your existing data. Records that are newer in the import file will overwrite existing records. This action cannot be undone."
        confirmLabel="Import"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleImportConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingImportPath(null);
        }}
      />

      <Modal
        open={importResult !== null}
        onClose={() => setImportResult(null)}
        title="Import Complete"
      >
        {importResult && <ImportResultTable result={importResult} />}
        <div className="flex justify-end mt-4">
          <Button onClick={() => setImportResult(null)}>Close</Button>
        </div>
      </Modal>
    </>
  );
}

function ImportResultTable({ result }: { result: ImportResult }) {
  const rows = [
    { label: "Company Profile", counts: result.company_profile },
    { label: "Settings", counts: result.settings },
    { label: "Customers", counts: result.customers },
    { label: "Invoices", counts: result.invoices },
    { label: "Line Items", counts: result.line_items },
  ];

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 font-medium text-gray-700">Entity</th>
            <th className="text-right py-2 font-medium text-gray-700">Created</th>
            <th className="text-right py-2 font-medium text-gray-700">Updated</th>
            <th className="text-right py-2 font-medium text-gray-700">Skipped</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-gray-100">
              <td className="py-2 text-gray-900">{row.label}</td>
              <td className="py-2 text-right text-green-600">{row.counts.created}</td>
              <td className="py-2 text-right text-blue-600">{row.counts.updated}</td>
              <td className="py-2 text-right text-gray-500">{row.counts.skipped}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.errors > 0 && (
        <p className="mt-3 text-sm text-amber-600">
          {result.errors} malformed line{result.errors !== 1 ? "s" : ""} skipped.
        </p>
      )}
    </div>
  );
}
