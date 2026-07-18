import { useState, useEffect, useCallback } from "react";
import { HardDrive, AlertTriangle } from "lucide-react";
import { useLoreStore } from "../store";
import {
  getStorageMode,
  STORAGE_MODES,
  migrateStorageMode,
  PERSIST_KEY,
  localStorageRaw,
  indexedDBRaw,
} from "../store/persistAdapter"; 

const MODE_LABELS = {
  [STORAGE_MODES.LOCAL_STORAGE]: "Browser Storage (localStorage)",
  [STORAGE_MODES.INDEXED_DB]: "IndexedDB",
};

const WARNINGS = {
  [STORAGE_MODES.INDEXED_DB]:
    "Recommended for large projects — no practical size limit, and saving won't block the UI. Note: some browser sync/backup tools that only cover localStorage won't pick this data up.",
  [STORAGE_MODES.LOCAL_STORAGE]:
    "Not recommended above roughly 5MB — saves can silently fail once the browser's storage limit is hit. Only switch back for a small project.",
};

async function getCurrentSizeBytes(mode) {
  const raw =
    mode === STORAGE_MODES.INDEXED_DB ? indexedDBRaw : localStorageRaw;
  const blob = await raw.get(PERSIST_KEY);
  // UTF-16 approximation, matches the manual console check used earlier.
  return blob ? blob.length * 2 : 0;
}

export default function StorageModeSettings() {
  const setBusy = useLoreStore((s) => s.setBusy);
  const clearBusy = useLoreStore((s) => s.clearBusy);
  const addToast = useLoreStore((s) => s.addToast);

  const [mode] = useState(getStorageMode());
  const [sizeBytes, setSizeBytes] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const targetMode =
    mode === STORAGE_MODES.INDEXED_DB
      ? STORAGE_MODES.LOCAL_STORAGE
      : STORAGE_MODES.INDEXED_DB;

  const refreshSize = useCallback(() => {
    getCurrentSizeBytes(mode).then(setSizeBytes);
  }, [mode]);

  useEffect(() => {
    refreshSize();
  }, [refreshSize]);

  const handleConfirmSwitch = async () => {
    setConfirming(false);
    setBusy(`Switching to ${MODE_LABELS[targetMode]}...`);
    try {
      const result = await migrateStorageMode(targetMode);
      if (result.migrated) {
        addToast({
          type: "success",
          message: `Switched to ${MODE_LABELS[targetMode]}. Reloading...`,
          duration: null,
        });
        // persist's storage adapter is resolved once at store creation, so
        // a reload is the simplest reliable way to pick up the new backend.
        setTimeout(() => window.location.reload(), 800);
      } else {
        clearBusy();
      }
    } catch {
      clearBusy();
      addToast({
        type: "error",
        message: "Failed to switch storage mode. Your data was not moved.",
      });
    }
  };

  const sizeLabel =
    sizeBytes === null
      ? "…"
      : sizeBytes < 1024
        ? `${sizeBytes} B`
        : `${(sizeBytes / 1024).toFixed(2)} KB`;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h4 className="text-xs font-black uppercase text-gray-800 mb-2 flex items-center gap-2">
        <HardDrive size={14} className="text-blue-500" />
        Project Storage
      </h4>
      <p className="text-[10px] font-medium text-gray-500 mb-4 leading-relaxed max-w-2xl">
        Controls where your project data is saved in this browser.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
        <div className="text-xs font-bold text-gray-700">
          Current mode:{" "}
          <span className="text-blue-600">{MODE_LABELS[mode]}</span>
        </div>
        <div className="text-[10px] text-gray-400 uppercase font-bold">
          Project size: {sizeLabel}
        </div>
      </div>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs font-bold uppercase px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
        >
          Switch to {MODE_LABELS[targetMode]}
        </button>
      ) : (
        <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={16}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {WARNINGS[targetMode]} Switching reloads the app.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmSwitch}
              className="text-xs font-black uppercase px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Confirm Switch
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs font-bold uppercase px-4 py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
