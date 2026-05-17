export default function SharedStatusPanel({
  currentList,
  checkedItems,
  totalItems,
  originText = "",
  sharedUpdateNotice,
  formatRelativeSyncTime,
}) {
  if (currentList?.isShared !== true) return null;

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
        background:
          "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 55%,#F3E8FF 100%)",
        border: "1px solid rgba(167,139,250,0.42)",
        borderRadius: 22,
        padding: "14px 14px",
        display: "flex",
        alignItems: "stretch",
        gap: 12,
        color: "#4C1D95",
        boxShadow:
          "0 12px 28px -12px rgba(124,58,237,0.30), 0 4px 10px -6px rgba(17,24,39,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
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

      {/* decorative glow */}
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
          background:
            "radial-gradient(circle, rgba(167,139,250,0.30) 0%, rgba(167,139,250,0) 70%)",
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
          background:
            "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
          color: "#FFFFFF",
          border: "1px solid rgba(167,139,250,0.45)",
          boxShadow:
            "0 10px 22px -8px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
          flexShrink: 0,
        }}
      >
        🤝
      </div>

      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              fontSize: 13.5,
              letterSpacing: "-0.01em",
              background:
                "linear-gradient(135deg,#4C1D95 0%,#6D28D9 100%)",
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
              background:
                "linear-gradient(135deg,#6D28D9 0%,#8B5CF6 100%)",
              boxShadow:
                "0 4px 10px -2px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.30)",
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
            color: "#6D28D9",
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
            background:
              "linear-gradient(180deg, rgba(76,29,149,0.10) 0%, rgba(76,29,149,0.16) 100%)",
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 9,
            boxShadow: "inset 0 1px 2px rgba(76,29,149,0.10)",
          }}
        >
          <div
            style={{
              position: "relative",
              height: "100%",
              width: `${progressPct}%`,
              background:
                "linear-gradient(90deg,#4C1D95 0%,#7C3AED 50%,#A855F7 100%)",
              borderRadius: 999,
              transition: "width 500ms cubic-bezier(0.22,1,0.36,1)",
              boxShadow:
                "0 0 10px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.30)",
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
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
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
              color: "#4C1D95",
              background: "linear-gradient(180deg,#FFFFFF 0%,#F8F4FF 100%)",
              border: "1px solid rgba(167,139,250,0.42)",
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
