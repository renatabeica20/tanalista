export default function ConfirmDeleteModal({
  open,
  title = "Excluir?",
  message = "Essa ação não pode ser desfeita.",
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        background: "rgba(17,24,39,0.46)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#FFFFFF",
          borderRadius: 28,
          padding: 24,
          boxShadow: "0 28px 80px rgba(17,24,39,0.28)",
          border: "1px solid #FEE2E2",
          transform: "translateY(-10px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              margin: "0 auto 12px",
              background: "#FEF2F2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              border: "1px solid #FECACA",
            }}
          >
            🗑️
          </div>
          <div style={{ fontWeight: 950, fontSize: 20, color: "#111827", marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.45 }}>
            {message}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              minHeight: 50,
              padding: 14,
              borderRadius: 18,
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              color: "#374151",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              minHeight: 50,
              padding: 14,
              borderRadius: 18,
              background: "linear-gradient(135deg,#DC2626,#EF4444)",
              border: "none",
              color: "white",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 12px 24px rgba(220,38,38,0.22)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
