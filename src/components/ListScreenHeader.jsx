import BudgetProgress from './BudgetProgress';

// Mesmo THEME_MAP da CreateListScreen — cor por tipo de lista
const THEME_MAP = {
  mercado:     { color: "#6D28D9", dark: "#4C1D95", light: "#8B5CF6", glow: "rgba(76,29,149,0.55)",  glowSub: "rgba(124,58,237,0.35)" },
  supermercado:{ color: "#6D28D9", dark: "#4C1D95", light: "#8B5CF6", glow: "rgba(76,29,149,0.55)",  glowSub: "rgba(124,58,237,0.35)" },
  festa:       { color: "#EA580C", dark: "#9A3412", light: "#FB923C", glow: "rgba(154,52,18,0.50)",  glowSub: "rgba(234,88,12,0.30)" },
  eventos:     { color: "#EA580C", dark: "#9A3412", light: "#FB923C", glow: "rgba(154,52,18,0.50)",  glowSub: "rgba(234,88,12,0.30)" },
  construcao:  { color: "#B45309", dark: "#78350F", light: "#D97706", glow: "rgba(120,53,15,0.50)",  glowSub: "rgba(180,83,9,0.30)" },
  eletrico:    { color: "#1D4ED8", dark: "#1E3A8A", light: "#3B82F6", glow: "rgba(30,58,138,0.55)",  glowSub: "rgba(29,78,216,0.30)" },
  escolar:     { color: "#15803D", dark: "#14532D", light: "#22C55E", glow: "rgba(20,83,45,0.52)",   glowSub: "rgba(21,128,61,0.28)" },
  farmacia:    { color: "#BE185D", dark: "#831843", light: "#EC4899", glow: "rgba(131,24,67,0.52)",  glowSub: "rgba(190,24,93,0.28)" },
  condominio:  { color: "#0F4C75", dark: "#0B3559", light: "#3282B8", glow: "rgba(11,53,89,0.52)",   glowSub: "rgba(15,76,117,0.28)" },
  outros:      { color: "#374151", dark: "#1F2937", light: "#6B7280", glow: "rgba(31,41,55,0.50)",   glowSub: "rgba(55,65,81,0.28)" },
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
    <div style={{ padding: "18px 16px 24px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${theme.dark} 0%, ${theme.color} 48%, ${theme.light} 100%)`,
          borderRadius: 32,
          padding: "22px 22px 24px",
          boxShadow: `0 1px 0 rgba(255,255,255,0.20) inset, 0 -1px 0 rgba(0,0,0,0.10) inset, 0 30px 60px -16px ${theme.glow}, 0 12px 26px -10px ${theme.glowSub}, 0 2px 6px -2px rgba(15,23,42,0.18)`,
          border: "1px solid rgba(255,255,255,0.22)",
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
              "radial-gradient(circle at 12% 8%, rgba(255,255,255,0.34), transparent 42%), radial-gradient(circle at 92% -8%, rgba(244,114,182,0.26), transparent 44%), radial-gradient(circle at 100% 110%, rgba(99,102,241,0.30), transparent 48%), radial-gradient(circle at 0% 100%, rgba(255,255,255,0.10), transparent 40%)",
            pointerEvents: "none",
          }}
        />
        {/* Inner glow ring */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 32,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 24px rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />
        {/* Subtle top sheen */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            top: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <button
              onClick={onBackHome}
              title="Voltar para a tela inicial"
              aria-label="Voltar"
              data-tour-step="list_back_home"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #F5F3FF 100%)",
                border: "1px solid rgba(255,255,255,0.85)",
                borderRadius: "50%",
                width: 46,
                height: 46,
                color: theme.dark,
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow:
                  "0 12px 26px -8px rgba(15,23,42,0.45), 0 2px 4px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(15,23,42,0.05)",
                transition: "transform 160ms ease, box-shadow 220ms ease",
                animation: showFinished
                  ? "tnlPulseBack 1.2s ease-in-out infinite"
                  : "none",
                flexShrink: 0,
                ...highlight(tour("list_back_home")),
              }}
            >
              ←
            </button>

            <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 19.5,
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.02em",
                  textShadow: "0 2px 10px rgba(0,0,0,0.22), 0 1px 2px rgba(0,0,0,0.18)",
                }}
              >
                {currentList?.name}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 8,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.95)",
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 999,
                  padding: "4px 11px",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  letterSpacing: "0.02em",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.10)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#A7F3D0",
                    boxShadow: "0 0 10px rgba(167,243,208,1), 0 0 2px rgba(167,243,208,0.9)",
                  }}
                />
                {checkedItems}/{totalItems} itens concluídos
              </div>
            </div>

            <button
              onClick={onShare}
              data-tour-step="list_share"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%)",
                border: "1px solid rgba(255,255,255,0.38)",
                borderRadius: 999,
                padding: "10px 15px",
                color: "white",
                fontSize: 12.5,
                fontWeight: 800,
                letterSpacing: "-0.005em",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow:
                  "0 10px 24px -6px rgba(0,0,0,0.28), 0 2px 4px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                flexShrink: 0,
                transition: "background 180ms ease, transform 160ms ease, box-shadow 200ms ease",
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
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.18)",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={onStartTour}
                  style={{
                    border: "1px solid rgba(255,255,255,0.40)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 100%)",
                    color: "white",
                    borderRadius: 999,
                    padding: "9px 18px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "-0.005em",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow:
                      "0 8px 18px -4px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.06)",
                    WebkitTapHighlightColor: "transparent",
                    transition: "transform 160ms ease, box-shadow 200ms ease",
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
