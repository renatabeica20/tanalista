import { useState } from "react";

/**
 * AppHeader — visual premium.
 * Mantém props (userName, onSwitchUser, onNotifications, unreadCount),
 * callbacks, navegação e regras de exibição.
 */
export default function AppHeader({
  userName,
  onSwitchUser,
  onNotifications,
  unreadCount = 0,
}) {
  if (!userName) return null;

  const [hoverBell, setHoverBell] = useState(false);
  const [hoverOut, setHoverOut] = useState(false);

  const initial = String(userName).trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 120,
        width: "100%",
        maxWidth: "100%",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.82) 100%)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        borderBottom: "1px solid rgba(229,231,235,0.85)",
        paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
        paddingRight: "max(14px, env(safe-area-inset-right, 0px))",
        paddingBottom: 12,
        paddingLeft: "max(14px, env(safe-area-inset-left, 0px))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        boxSizing: "border-box",
        overflow: "hidden",
        flexWrap: "nowrap",
        boxShadow:
          "0 10px 28px -12px rgba(76,29,149,0.18), 0 2px 6px rgba(17,24,39,0.04)",
      }}
    >
      {/* faixa decorativa sutil */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(167,139,250,0.10), transparent 60%), radial-gradient(120% 80% at 100% 0%, rgba(236,72,153,0.06), transparent 60%)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          flex: "1 1 auto",
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background:
              "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #8B5CF6 100%)",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: "-0.01em",
            flexShrink: 0,
            boxShadow:
              "0 8px 18px -6px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.28)",
            border: "1px solid rgba(255,255,255,0.4)",
          }}
        >
          {initial}
        </div>

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6D28D9",
              opacity: 0.85,
            }}
          >
            Tá na Lista
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: "#0F172A",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              letterSpacing: "-0.01em",
            }}
          >
            Olá, {userName}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          minWidth: 0,
          position: "relative",
        }}
      >
        <button
          onClick={onNotifications}
          aria-label="Notificações"
          onMouseEnter={() => setHoverBell(true)}
          onMouseLeave={() => setHoverBell(false)}
          style={{
            position: "relative",
            border: "1px solid rgba(221,214,254,0.9)",
            background:
              "linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)",
            color: "#6D28D9",
            borderRadius: 14,
            width: 38,
            height: 38,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: hoverBell
              ? "0 12px 24px -8px rgba(109,40,217,0.32), inset 0 1px 0 rgba(255,255,255,0.9)"
              : "0 8px 18px -8px rgba(109,40,217,0.20), inset 0 1px 0 rgba(255,255,255,0.9)",
            transform: hoverBell ? "translateY(-1px)" : "translateY(0)",
            transition: "transform 160ms ease, box-shadow 220ms ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                minWidth: 18,
                height: 18,
                padding: "0 4px",
                background:
                  "linear-gradient(135deg, #F43F5E 0%, #DC2626 100%)",
                color: "#FFFFFF",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #FFFFFF",
                boxShadow: "0 4px 10px rgba(220,38,38,0.45)",
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onSwitchUser}
          onMouseEnter={() => setHoverOut(true)}
          onMouseLeave={() => setHoverOut(false)}
          style={{
            border: "1px solid rgba(229,231,235,0.95)",
            background: hoverOut
              ? "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%)"
              : "#FFFFFF",
            color: "#6D28D9",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.01em",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: hoverOut
              ? "0 12px 24px -8px rgba(17,24,39,0.14), inset 0 1px 0 #FFFFFF"
              : "0 8px 18px -8px rgba(17,24,39,0.10), inset 0 1px 0 #FFFFFF",
            transform: hoverOut ? "translateY(-1px)" : "translateY(0)",
            transition: "transform 160ms ease, box-shadow 220ms ease, background 220ms ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Sair
        </button>
      </div>
    </div>
  );
}
