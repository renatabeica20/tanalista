import BudgetProgress from './BudgetProgress';

// Mesmo THEME_MAP da CreateListScreen — cor por tipo de lista
const THEME_MAP = {
  mercado:    { color: "#6D28D9", dark: "#4C1D95", light: "#8B5CF6", glow: "rgba(76,29,149,0.55)", glowSub: "rgba(124,58,237,0.35)" },
  supermercado:{ color: "#6D28D9", dark: "#4C1D95", light: "#8B5CF6", glow: "rgba(76,29,149,0.55)", glowSub: "rgba(124,58,237,0.35)" },
  festa:      { color: "#EA580C", dark: "#9A3412", light: "#FB923C", glow: "rgba(154,52,18,0.50)", glowSub: "rgba(234,88,12,0.30)" },
  eventos:    { color: "#EA580C", dark: "#9A3412", light: "#FB923C", glow: "rgba(154,52,18,0.50)", glowSub: "rgba(234,88,12,0.30)" },
  construcao: { color: "#B45309", dark: "#78350F", light: "#D97706", glow: "rgba(120,53,15,0.50)",  glowSub: "rgba(180,83,9,0.30)" },
  eletrico:   { color: "#1D4ED8", dark: "#1E3A8A", light: "#3B82F6", glow: "rgba(30,58,138,0.55)", glowSub: "rgba(29,78,216,0.30)" },
  escolar:    { color: "#15803D", dark: "#14532D", light: "#22C55E", glow: "rgba(20,83,45,0.52)",  glowSub: "rgba(21,128,61,0.28)" },
  farmacia:   { color: "#BE185D", dark: "#831843", light: "#EC4899", glow: "rgba(131,24,67,0.52)", glowSub: "rgba(190,24,93,0.28)" },
  condominio: { color: "#0F4C75", dark: "#0B3559", light: "#3282B8", glow: "rgba(11,53,89,0.52)",  glowSub: "rgba(15,76,117,0.28)" },
  outros:     { color: "#374151", dark: "#1F2937", light: "#6B7280", glow: "rgba(31,41,55,0.50)",  glowSub: "rgba(55,65,81,0.28)" },
};

function getTheme(listType) {
  const key = String(listType || "mercado")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z]/g, "");
  return THEME_MAP[key] || THEME_MAP.mercado;
}

export default function ListScreenHeader({
  currentList,
  listType,
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
  onStartTour,
  isTourStep,
  tourHighlightStyle,
  WhatsAppIcon,
  fmtR,
}) {
  const highlight =
    typeof tourHighlightStyle === "function" ? tourHighlightStyle : () => ({});
  const tour = typeof isTourStep === "function" ? isTourStep : () => false;
  const SafeWhatsAppIcon = WhatsAppIcon || (() => <span>📤</span>);

  const theme = getTheme(listType || currentList?.type);

  return (
    <div style={{ padding: "16px 16px 22px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${theme.dark} 0%, ${theme.color} 45%, ${theme.light} 100%)`,
          borderRadius: 28,
          padding: "20px 20px 22px",
          boxShadow: `0 24px 50px -12px ${theme.glow}, 0 8px 18px -6px ${theme.glowSub}`,
          border: "1px solid rgba(255,255,255,0.18)",
          transition: "background .4s ease, box-shadow .4s ease",
        }}
      >
        {/* Decorative glows */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 15% 10%, rgba(255,255,255,0.28), transparent 38%), radial-gradient(circle at 92% -5%, rgba(244,114,182,0.22), transparent 40%), radial-gradient(circle at 100% 100%, rgba(99,102,241,0.28), transparent 45%)",
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

        <div style={{ position: "relative" }}>
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
                color: theme.dark,
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(8px)",
                boxShadow:
                  "0 10px 22px -6px rgba(15,23,42,0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
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
                    boxShadow: "0 0 8px rgba(167,243,208,0.9)",
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
                  ? { background: "#FFFFFF", color: theme.dark, border: "3px solid #FFFFFF" }
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
              listThemeColor={theme.color}
            />
            {onStartTour && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
                <button
                  onClick={onStartTour}
                  style={{
                    border: "1px solid rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 999,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  ✨ Como usar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
