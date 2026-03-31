import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

const toneClasses = {
  danger: {
    icon: "text-rose-600 dark:text-rose-300",
    button:
      "border-rose-300/80 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-200"
  },
  warning: {
    icon: "text-amber-600 dark:text-amber-300",
    button:
      "border-amber-300/80 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200"
  }
};

const ConfirmActionModal = ({
  isOpen,
  title = "Confirm action",
  description = "Are you sure you want to continue?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  loading = false,
  tone = "danger"
}) => {
  const palette = toneClasses[tone] || toneClasses.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClass="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <AlertTriangle size={18} className={palette.icon} />
          <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-indigo hover:text-brand-indigo disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${palette.button}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;
