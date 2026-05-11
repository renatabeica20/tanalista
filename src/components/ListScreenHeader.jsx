import BudgetProgress from './BudgetProgress';

export default function ListScreenHeader({
  currentList,
  checkedItems,
  totalItems,
  fullTotal,
  budget,
  budgetDiff,
  budgetPctLabel,
  progressColor,
  pct,
  showFinished,
  onBackHome,
  onShare,
  isTourStep,
  tourHighlightStyle,
  WhatsAppIcon,
  fmtR,
}) {
  const highlight =
    typeof tourHighlightStyle === "function" ? tourHighlightStyle : () => ({});
  const tour = typeof isTourStep === "function" ? isTourStep : () => false;
  const SafeWhatsAppIcon = WhatsAppIcon || (() => <span>📤</span>);



  return (
    <div style={{ padding: "16px 16px 22px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #4C1D95 0%, #6D28D9 45%, #8B5CF6 100%)",
          borderRadius: 28,
          padding: "20px 20px 22px",
          boxShadow:
            "0 24px 50px -12px rgba(76, 29, 149, 0.55), 0 8px 18px -6px rgba(124, 58, 237, 0.35)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* Decorative glows */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 15% 10%, rgba(255,255,255,0.28), transparent 38%), radial-gradient(circle at 92% -5%, rgba(244, 114, 182, 0.22), transparent 40%), radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.28), transparent 45%)",
            pointerEvents: "none",
          }}
        />
        {/* Subtle top sheen */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <button
              onClick={onBackHome}
              title="Voltar para a tela inicial"
              aria-label="Voltar"
              data-tour-step="list_back_home"
              style={{
                background: "rgba(255,255,255,0.98)",
                border: "1px solid rgba(255,255,255,0.7)",
                borderRadius: "50%",
                width: 44,
                height: 44,
                color: "#4C1D95",
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                boxShadow:
                  "0 10px 22px -6px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
                transition: "transform 160ms ease, box-shadow 200ms ease",
                animation: showFinished
                  ? "tnlPulseBack 1.2s ease-in-out infinite"
                  : "none",
                ...highlight(tour("list_back_home")),
              }}
            >
              ←
            </button>

            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 19,
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: -0.3,
                  textShadow: "0 2px 8px rgba(0,0,0,0.18)",
                }}
              >
                {currentList?.name}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  padding: "3px 10px",
                  backdropFilter: "blur(6px)",
                  letterSpacing: 0.2,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#A7F3D0",
                    boxShadow: "0 0 8px rgba(167, 243, 208, 0.9)",
                  }}
                />
                {checkedItems}/{totalItems} itens concluídos
              </div>
            </div>

            <button
              onClick={onShare}
              data-tour-step="list_share"
              style={{
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.32)",
                borderRadius: 999,
                padding: "9px 14px",
                color: "white",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                backdropFilter: "blur(10px)",
                boxShadow:
                  "0 8px 20px -4px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.18)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                transition: "background 180ms ease, transform 160ms ease",
                ...(tour("list_share")
                  ? {
                      background: "#FFFFFF",
                      color: "#4C1D95",
                      border: "3px solid #FFFFFF",
                    }
                  : {}),
                ...highlight(tour("list_share")),
              }}
            >
              <SafeWhatsAppIcon size={17} /> Enviar lista
            </button>
          </div>

          <div data-tour-step="list_progress">
          <BudgetProgress
            checkedItems={checkedItems}
            totalItems={totalItems}
            fullTotal={fullTotal}
            budget={budget}
            budgetDiff={budgetDiff}
            budgetPctLabel={budgetPctLabel}
            progressColor={progressColor}
            pct={pct}
            fmtR={fmtR}
            highlighted={tour("list_progress")}
            highlightStyle={highlight(tour("list_progress"))}
          />
          </div>
        </div>
      </div>
    </div>
  );
}
