export default function ConfirmModal({
  title,
  children,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  secondaryLabel,
  onConfirm,
  onSecondary,
  onCancel,
  busy = false,
  danger = false,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-stone-300 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="font-display text-xl font-semibold text-ink">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:bg-stone-100 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          {secondaryLabel && (
            <button
              type="button"
              disabled={busy}
              onClick={onSecondary}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-stone-50 disabled:opacity-50"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              danger
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-leaf hover:bg-leaf-dark'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
