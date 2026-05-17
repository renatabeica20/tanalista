const TYPE_THEME = {
  mercado:     { grad: "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)", icon: "#4C1D95", soft: "#F5F3FF", border: "rgba(167,139,250,0.42)", badge: "linear-gradient(135deg,#6D28D9 0%,#8B5CF6 100%)", glow: "rgba(124,58,237,0.30)", shadow: "rgba(124,58,237,0.30)" },
  supermercado:{ grad: "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)", icon: "#4C1D95", soft: "#F5F3FF", border: "rgba(167,139,250,0.42)", badge: "linear-gradient(135deg,#6D28D9 0%,#8B5CF6 100%)", glow: "rgba(124,58,237,0.30)", shadow: "rgba(124,58,237,0.30)" },
  festa:       { grad: "linear-gradient(135deg,#C2410C 0%,#EA580C 50%,#F97316 100%)", icon: "#C2410C", soft: "#FFF7ED", border: "rgba(251,146,60,0.42)", badge: "linear-gradient(135deg,#EA580C 0%,#F97316 100%)", glow: "rgba(234,88,12,0.25)", shadow: "rgba(234,88,12,0.25)" },
  eventos:     { grad: "linear-gradient(135deg,#C2410C 0%,#EA580C 50%,#F97316 100%)", icon: "#C2410C", soft: "#FFF7ED", border: "rgba(251,146,60,0.42)", badge: "linear-gradient(135deg,#EA580C 0%,#F97316 100%)", glow: "rgba(234,88,12,0.25)", shadow: "rgba(234,88,12,0.25)" },
  construcao:  { grad: "linear-gradient(135deg,#92400E 0%,#B45309 50%,#D97706 100%)", icon: "#92400E", soft: "#FFFBEB", border: "rgba(217,119,6,0.42)",  badge: "linear-gradient(135deg,#B45309 0%,#D97706 100%)", glow: "rgba(180,83,9,0.25)",  shadow: "rgba(180,83,9,0.25)" },
  eletrico:    { grad: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#3B82F6 100%)", icon: "#1E3A8A", soft: "#EFF6FF", border: "rgba(59,130,246,0.42)",  badge: "linear-gradient(135deg,#1D4ED8 0%,#3B82F6 100%)", glow: "rgba(29,78,216,0.25)",  shadow: "rgba(29,78,216,0.25)" },
  escolar:     { grad: "linear-gradient(135deg,#14532D 0%,#15803D 50%,#22C55E 100%)", icon: "#14532D", soft: "#F0FDF4", border: "rgba(34,197,94,0.42)",   badge: "linear-gradient(135deg,#15803D 0%,#22C55E 100%)", glow: "rgba(21,128,61,0.25)",   shadow: "rgba(21,128,61,0.25)" },
  farmacia:    { grad: "linear-gradient(135deg,#831843 0%,#BE185D 50%,#EC4899 100%)", icon: "#831843", soft: "#FDF2F8", border: "rgba(236,72,153,0.42)",  badge: "linear-gradient(135deg,#BE185D 0%,#EC4899 100%)", glow: "rgba(190,24,93,0.25)",  shadow: "rgba(190,24,93,0.25)" },
  condominio:  { grad: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#3B82F6 100%)", icon: "#1E3A8A", soft: "#EFF6FF", border: "rgba(59,130,246,0.42)",  badge: "linear-gradient(135deg,#1D4ED8 0%,#3B82F6 100%)", glow: "rgba(29,78,216,0.25)",  shadow: "rgba(29,78,216,0.25)" },
};

const DEFAULT_THEME = TYPE_THEME.mercado;

export default function SharedStatusPanel({
  currentList,
  checkedItems,
  totalItems,
  originText = "",
  sharedUpdateNotice,
  formatRelativeSyncTime,
}) {
  if (currentList?.isShared !== true) return null;

  const t = TYPE_THEME[currentList?.type] || DEFAULT_THEME;

  const progressPct = totalItems
    ? Math.round((checkedItems / totalItems) * 100)
    : 0;
  const lastUpdate =
    currentList.lastCloudSeenAt ||
    currentList.lastSyncedAt ||
    currentList.pulledAt;

  const isConflict = sharedUpdateNotice?.type === "conflict";

  return (
    <div
      style={{
        position: "relative",
        margin: "10px 16px 12px",
        background: t.soft,
        border: `1px solid ${t.border}`,
        borderRadius: 22,
        padding: "14px 14px",
        display: "flex",
        alignItems: "stretch",
        gap: 12,
        boxShadow: `0 12px 28px -12px ${t.shadow}, 0 4px 10px -6px rgba(17,24,39,0.06), inset 0 1px 0 rgba(255,255,255,0.95)`,
        overflow: "hidden",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <style>{`
        @keyframes tnl-ssp-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
      `}</style>

      <span
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: -50,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${t.glow} 0%, rgba(167,139,250,0) 70%)`,
          filter: "blur(8px)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: 42,
          height: 42,
          minWidth: 42,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          background: t.grad,
          color: "#FFFFFF",
          border: `1px solid ${t.border}`,
          boxShadow: `0 10px 22px -8px ${t.shadow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
          flexShrink: 0,
        }}
      >
        🤝
      </div>

      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div
            style={{
              fontWeight: 900,
              fontSize: 13.5,
              letterSpacing: "-0.01em",
              background: t.grad,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Lista compartilhada
          </div>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 900,
              color: "#FFFFFF",
              padding: "2px 8px",
              borderRadius: 999,
              background: t.badge,
              boxShadow: `0 4px 10px -2px ${t.shadow}, inset 0 1px 0 rgba(255,255,255,0.30)`,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {progressPct}%
          </span>
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: t.icon,
            opacity: 0.92,
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {originText ? `${originText} · ` : ""}
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {checkedItems}/{totalItems}
          </span>{" "}
          itens concluídos
        </div>

        <div
          style={{
            position: "relative",
            height: 8,
            background: `linear-gradient(180deg, ${t.glow} 0%, ${t.glow} 100%)`,
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 9,
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              position: "relative",
              height: "100%",
              width: `${progressPct}%`,
              background: t.grad,
              borderRadius: 999,
              transition: "width 500ms cubic-bezier(0.22,1,0.36,1)",
              boxShadow: `0 0 10px ${t.shadow}, inset 0 1px 0 rgba(255,255,255,0.30)`,
              overflow: "hidden",
            }}
          >
            {progressPct > 0 && progressPct < 100 && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "40%",
                  height: "100%",
                  background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
                  animation: "tnl-ssp-shine 1.8s ease-in-out infinite",
                }}
              />
            )}
          </div>
        </div>

        <div style={{ marginTop: 9, display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: t.icon,
              background: "linear-gradient(180deg,#FFFFFF 0%,#FAFAFA 100%)",
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              padding: "4px 9px",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
              letterSpacing: "-0.005em",
            }}
          >
            <span>🕒</span>
            <span>Atualizado {formatRelativeSyncTime(lastUpdate)}</span>
          </span>

          {isConflict && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#B91C1C",
                background: "linear-gradient(180deg,#FEF2F2 0%,#FEE2E2 100%)",
                border: "1px solid rgba(252,165,165,0.85)",
                borderRadius: 999,
                padding: "4px 9px",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
                letterSpacing: "-0.005em",
              }}
            >
              <span>⚠️</span>
              <span>{sharedUpdateNotice.msg}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
