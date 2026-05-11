import { useEffect } from "react";

export default function ConfirmDeleteModal({
  open,
  title = "Excluir?",
  message = "Essa ação não pode ser desfeita.",
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

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
        background:
          "radial-gradient(120% 80% at 50% 100%, rgba(76,29,149,0.42) 0%, rgba(17,24,39,0.55) 60%, rgba(15,23,42,0.62) 100%)",
        backdropFilter: "blur(10px) saturate(140%)",
        WebkitBackdropFilter: "blur(10px) saturate(140%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px 16px",
        animation: "tnl-cdm-fade 200ms ease-out",
      }}
    >
      <style>{`
        @keyframes tnl-cdm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tnl-cdm-pop {
          from { transform: translateY(14px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes tnl-cdm-icon {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #FDFBFF 60%, #F8F4FF 100%)",
          borderRadius: 28,
          padding: "28px 22px 22px",
          boxShadow:
            "0 30px 80px -12px rgba(76,29,149,0.38), 0 10px 28px -8px rgba(17,24,39,0.22), inset 0 1px 0 rgba(255,255,255,0.95)",
          border: "1px solid rgba(167,139,250,0.32)",
          animation: "tnl-cdm-pop 260ms cubic-bezier(0.22,1,0.36,1)",
          WebkitTapHighlightColor: "transparent",
          overflow: "hidden",
        }}
      >
        {/* decorative glow */}
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0) 70%)",
            filter: "blur(6px)",
          }}
        />
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            bottom: -60,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167,139,250,0.22) 0%, rgba(167,139,250,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        <div style={{ position: "relative", textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 14px",
              background:
                "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 60%, #FECACA 100%)",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              border: "1px solid rgba(239,68,68,0.28)",
              boxShadow:
                "0 10px 24px -8px rgba(220,38,38,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
              animation: "tnl-cdm-icon 360ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            🗑️
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 21,
              letterSpacing: "-0.01em",
              marginBottom: 8,
              background:
                "linear-gradient(135deg,#1F2937 0%,#4C1D95 70%,#6D28D9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14.5,
              color: "#6B7280",
              lineHeight: 1.5,
              fontWeight: 600,
              maxWidth: 300,
              margin: "0 auto",
            }}
          >
            {message}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <button
            onClick={onCancel}
            style={{
              minHeight: 52,
              padding: "14px 12px",
              borderRadius: 18,
              background:
                "linear-gradient(180deg,#FFFFFF 0%,#F8F7FF 100%)",
              border: "1.5px solid rgba(167,139,250,0.35)",
              color: "#4C1D95",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.005em",
              boxShadow:
                "0 2px 6px rgba(76,29,149,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
              transition: "transform .15s ease, box-shadow .2s ease",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              minHeight: 52,
              padding: "14px 12px",
              borderRadius: 18,
              background:
                "linear-gradient(135deg,#B91C1C 0%,#DC2626 50%,#EF4444 100%)",
              border: "none",
              color: "white",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.005em",
              boxShadow:
                "0 14px 28px -8px rgba(220,38,38,0.55), 0 4px 10px rgba(220,38,38,0.25), inset 0 1px 0 rgba(255,255,255,0.35)",
              transition: "transform .15s ease, box-shadow .2s ease",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
