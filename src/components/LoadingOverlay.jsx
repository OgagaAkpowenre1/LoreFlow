import { memo } from "react";
import { Loader2 } from "lucide-react";
import { useLoreStore } from "../store";

// Renders nothing when idle — mounted once in App.jsx alongside the other
// overlays. While busy, it's a full-screen backdrop that intentionally
// DOES capture pointer events (blocks clicks to everything behind it);
// once isBusy flips back to false this unmounts entirely, so there's no
// leftover overlay to worry about blocking anything afterward.
function LoadingOverlay() {
  const isBusy = useLoreStore((s) => s.isBusy);
  const busyLabel = useLoreStore((s) => s.busyLabel);

  if (!isBusy) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-white/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 bg-white px-6 py-5 rounded-xl shadow-2xl border border-gray-200">
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <p className="text-sm font-medium text-gray-600">{busyLabel}</p>
      </div>
    </div>
  );
}

export default memo(LoadingOverlay);
