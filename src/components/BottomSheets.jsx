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
          0% { opacity: 0; transform: translateY(10px) scale(0.992); filter: blur(2px); }
          60% { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes tnl-sheet-close-pulse {
          0%, 100% { box-shadow: 0 6px 18px -6px rgba(76,29,149,0.32), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(76,29,149,0.08); }
          50% { box-shadow: 0 10px 26px -8px rgba(76,29,149,0.45), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(76,29,149,0.10); }
        }
        .tnl-sheet-close-btn {
          transition: transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 240ms ease, background 240ms ease, border-color 220ms ease, color 200ms ease;
        }
        .tnl-sheet-close-btn:hover {
          transform: rotate(90deg) scale(1.08);
          box-shadow: 0 14px 32px -10px rgba(76,29,149,0.55), inset 0 1px 0 rgba(255,255,255,0.95);
          background: linear-gradient(135deg, #FFFFFF 0%, #EDE9FE 100%);
          border-color: rgba(124,58,237,0.55);
        }
        .tnl-sheet-close-btn:active {
          transform: rotate(90deg) scale(0.92);
        }
        .tnl-sheet-close-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.45), 0 10px 24px -8px rgba(76,29,149,0.40);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          animation: "tnl-sheet-content-in 360ms cubic-bezier(0.22,1,0.36,1) both",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {(title || onClose) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              paddingBottom: 16,
              borderBottom: "1px solid transparent",
              borderImage: "linear-gradient(90deg, transparent, rgba(167,139,250,0.40), transparent) 1",
              position: "relative",
            }}
          >
            {/* glow sheen under header */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "10%",
                right: "10%",
                bottom: -1,
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.55), transparent)",
                filter: "blur(2px)",
                pointerEvents: "none",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {title ? (
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 900,
                    color: "#111827",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.25,
                    background:
                      "linear-gradient(135deg, #0F172A 0%, #4C1D95 55%, #7C3AED 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    textShadow: "0 1px 0 rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
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
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: "1px solid rgba(167,139,250,0.42)",
                  background:
                    "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 55%, #EDE9FE 100%)",
                  color: "#6D28D9",
                  fontSize: 19,
                  fontWeight: 900,
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                  boxShadow:
                    "0 6px 18px -6px rgba(76,29,149,0.32), 0 1px 2px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(76,29,149,0.08)",
                  WebkitTapHighlightColor: "transparent",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                ×
              </button>
            ) : null}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
        </div>
      </div>
    </ModalSheet>
  );
}
