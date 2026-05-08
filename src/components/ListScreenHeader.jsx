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
  const highlight = typeof tourHighlightStyle === "function" ? tourHighlightStyle : () => ({});
  const tour = typeof isTourStep === "function" ? isTourStep : () => false;
  const SafeWhatsAppIcon = WhatsAppIcon || (() => <span>📤</span>);

  return (
    <div style={{ padding: "18px 16px 22px" }}>
      <div
        style={{
          position: "relative",
          overflow: tour("list_back_home") || tour("list_share") || tour("list_progress") ? "visible" : "hidden",
          zIndex: tour("list_back_home") || tour("list_share") || tour("list_progress") ? 636 : "auto",
          background: "linear-gradient(135deg,#4C1D95 0%,#6D28D9 54%,#8B5CF6 100%)",
          borderRadius: 28,
          padding: "18px 18px 20px",
          boxShadow: "0 22px 48px rgba(91,33,182,0.24)",
          border: "1px solid rgba(255,255,255,0.28)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 8%,rgba(255,255,255,0.22),transparent 32%),radial-gradient(circle at 90% 0%,rgba(255,255,255,0.14),transparent 34%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: tour("list_back_home") || tour("list_share") || tour("list_progress") ? 637 : 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button
              onClick={onBackHome}
              title="Voltar para a tela inicial"
              style={{
                background: "rgba(255,255,255,0.96)",
                border: "2px solid rgba(255,255,255,0.92)",
                borderRadius: "50%",
                width: 44,
                height: 44,
                color: "#4C1D95",
                fontSize: 24,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                boxShadow: "0 12px 28px rgba(17,24,39,0.24)",
                animation: showFinished ? "tnlPulseBack 1.2s ease-in-out infinite" : "none",
                ...highlight(tour("list_back_home")),
              }}
            >
              ←
            </button>
            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 20,
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentList?.name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.76)", fontWeight: 800, marginTop: 3 }}>
                {checkedItems}/{totalItems} itens concluídos
              </div>
            </div>
            <button
              onClick={onShare}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.30)",
                borderRadius: 180,
                padding: "8px 12px",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                ...(tour("list_share") ? { background: "#FFFFFF", color: "#4C1D95", border: "3px solid #FFFFFF" } : {}),
                ...highlight(tour("list_share")),
              }}
            >
              <SafeWhatsAppIcon size={17} /> Enviar lista
            </button>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 22,
              padding: "13px 14px",
              backdropFilter: "blur(10px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
              ...(tour("list_progress")
                ? { border: "3px solid rgba(255,255,255,0.98)", background: "rgba(255,255,255,0.18)" }
                : {}),
              ...highlight(tour("list_progress")),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "white" }}>{fmtR(fullTotal)}</span>
              {budget > 0 && <span style={{ fontWeight: 800, fontSize: 15, color: "rgba(255,255,255,0.8)" }}>{fmtR(budget)}</span>}
            </div>
            <div style={{ height: 10, background: "rgba(255,255,255,0.2)", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
              <div
                style={{
                  height: "100%",
                  background: progressColor,
                  borderRadius: 5,
                  width: `${pct}%`,
                  transition: "width 0.45s ease, background 0.6s",
                }}
              />
            </div>
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 900, lineHeight: 1.35 }}>
              {budget > 0 ? (
                <>
                  <div style={{ color: budgetDiff < 0 ? "#FECACA" : "#BBF7D0", fontSize: 15 }}>
                    {budgetDiff < 0 ? `⚠️ Ultrapassado: ${fmtR(Math.abs(budgetDiff))}` : `Saldo disponível: ${fmtR(budgetDiff)}`}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, marginTop: 2 }}>{budgetPctLabel}% do orçamento utilizado</div>
                </>
              ) : (
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                  {checkedItems}/{totalItems} itens · {budgetPctLabel}% concluído
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
