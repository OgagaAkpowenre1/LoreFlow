import { memo } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useLoreStore } from "../store";

const STYLES = {
  success: {
    icon: CheckCircle2,
    classes: "bg-green-50 border-green-200 text-green-800",
    iconClasses: "text-green-500",
  },
  error: {
    icon: XCircle,
    classes: "bg-red-50 border-red-200 text-red-800",
    iconClasses: "text-red-500",
  },
  info: {
    icon: Info,
    classes: "bg-blue-50 border-blue-200 text-blue-800",
    iconClasses: "text-blue-500",
  },
};

// Individual toast is its own component (not inlined in the map below) so
// each one only re-renders for its own dismiss click, not the whole list.
const Toast = memo(function Toast({ id, type, message }) {
  const dismissToast = useLoreStore((s) => s.dismissToast);
  const { icon: Icon, classes, iconClasses } = STYLES[type] || STYLES.info;

  return (
    <div
      className={`flex items-start gap-2 min-w-[280px] max-w-sm p-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200 ${classes}`}
      role="status"
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${iconClasses}`} />
      <p className="text-sm font-medium flex-grow break-words">{message}</p>
      <button
        onClick={() => dismissToast(id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
});

// Only field read from the store: the toasts array itself. Everything else
// this component needs (dismissToast) is grabbed per-toast in <Toast>, so
// a click on one toast's dismiss button doesn't re-render its siblings.
function ToastContainer() {
  const toasts = useLoreStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
}

export default memo(ToastContainer);
