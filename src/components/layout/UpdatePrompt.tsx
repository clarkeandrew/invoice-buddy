import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import Button from "@/components/ui/Button";

/**
 * Checks GitHub Releases for a newer version once on startup and offers to
 * install it. Skipped in development, where the running build has no release.
 */
export default function UpdatePrompt() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    check()
      .then(setUpdate)
      .catch((err) => console.warn("Update check failed:", err));
  }, []);

  async function handleInstall() {
    if (!update) return;
    setError(null);
    setInstalling(true);
    let total = 0;
    let downloaded = 0;
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) setProgress(Math.round((downloaded / total) * 100));
        }
      });
      await relaunch();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setInstalling(false);
      setProgress(null);
    }
  }

  if (!update || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
    >
      <p className="text-sm font-medium text-gray-900">Update available: v{update.version}</p>
      <p className="mt-1 text-xs text-gray-500">
        You have v{update.currentVersion}. The app restarts to finish installing.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">Update failed: {error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        {!installing && (
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Later
          </Button>
        )}
        <Button size="sm" onClick={handleInstall} disabled={installing}>
          {installing
            ? progress !== null
              ? `Downloading ${progress}%`
              : "Installing..."
            : "Install and restart"}
        </Button>
      </div>
    </div>
  );
}
