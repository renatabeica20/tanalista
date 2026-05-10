import ModalSheet from "./ModalSheet";

/**
 * Agrupador visual para futuras folhas inferiores do app.
 *
 * Esta primeira versão é intencionalmente conservadora: mantém a API simples
 * e evita alterar regras de negócio sensíveis no App.jsx. Nas próximas etapas,
 * os modais específicos podem ser movidos para cá gradualmente.
 */
export default function BottomSheets({ children }) {
  return <>{children}</>;
}

export function AppBottomSheet({ open, title, onClose, children, maxHeight = "86vh" }) {
  if (!open) return null;

  return (
    <ModalSheet title={title} onClose={onClose} maxHeight={maxHeight}>
      <style>{`
        @keyframes tnl-sheet-content-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tnl-sheet-close-btn {
          transition: transform 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms ease, background 200ms ease;
        }
        .tnl-sheet-close-btn:hover {
          transform: rotate(90deg) scale(1.05);
          box-shadow: 0 10px 24px -8px rgba(76,29,149,0.45);
        }
        .tnl-sheet-close-btn:active {
          transform: rotate(90deg) scale(0.94);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          animation: "tnl-sheet-content-in 280ms cubic-bezier(0.22,1,0.36,1) both",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {(title || onClose) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingBottom: 14,
              borderBottom: "1px solid rgba(167,139,250,0.22)",
              position: "relative",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {title ? (
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#111827",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.25,
                    background:
                      "linear-gradient(135deg, #1F2937 0%, #4C1D95 70%, #6D28D9 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {title}
                </div>
              ) : null}
            </div>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="tnl-sheet-close-btn"
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid rgba(167,139,250,0.35)",
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%)",
                  color: "#6D28D9",
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                  boxShadow:
                    "0 4px 12px -4px rgba(76,29,149,0.25), inset 0 1px 0 rgba(255,255,255,0.9)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                ×
              </button>
            ) : null}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {children}
        </div>
      </div>
    </ModalSheet>
  );
}
