import { useEffect } from "react";

function formatNotificationTime(value) {
  try {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function NotificationsPanel({
  notifications = [],
  onBack,
  onMarkAllRead,
}) {
  const items = Array.isArray(notifications) ? notifications : [];
  const unreadCount = items.filter((item) => !item?.read).length;

  useEffect(() => {
    try {
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.setAttribute("name", "viewport");
        document.head.appendChild(viewport);
      }
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
      );
    } catch {}
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg,#4C1D95 0%,#6D28D9 14%,#8B5CF6 26%,#F5F3FF 26%,#FFFFFF 100%)",
        padding:
          "max(18px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom))",
        overflowX: "hidden",
        WebkitTextSizeAdjust: "100%",
        touchAction: "manipulation",
        fontFamily:
          "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes tnl-notif-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tnl-notif-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.55); }
          50% { box-shadow: 0 0 0 6px rgba(124,58,237,0); }
        }
      `}</style>

      {/* decorative top glow */}
      <span
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: -80,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(167,139,250,0) 70%)",
          filter: "blur(8px)",
        }}
      />
      <span
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: -40,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 70%)",
          filter: "blur(6px)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack?.();
          }}
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.30)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 100%)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 900,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            boxShadow:
              "0 8px 20px -8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
            transition: "transform .15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
          onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              textShadow: "0 1px 2px rgba(76,29,149,0.30)",
            }}
          >
            Notificações
          </div>
          <div
            style={{
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 800,
              color: "#FFFFFF",
              padding: "3px 10px",
              borderRadius: 999,
              background:
                unreadCount > 0
                  ? "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.16) 100%)"
                  : "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.30)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              letterSpacing: "0.01em",
            }}
          >
            {unreadCount > 0 ? (
              <>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    animation: "tnl-notif-pulse 1.6s ease-in-out infinite",
                  }}
                />
                {unreadCount} não lidas
              </>
            ) : (
              <>✓ Tudo atualizado</>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkAllRead?.();
          }}
          style={{
            minHeight: 46,
            padding: "0 14px",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.30)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.10) 100%)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            color: "#FFFFFF",
            fontSize: 13.5,
            fontWeight: 800,
            cursor: "pointer",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            boxShadow:
              "0 8px 20px -8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
            letterSpacing: "-0.005em",
            transition: "transform .15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ✓ Lidas
        </button>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 60%,#F8F4FF 100%)",
            borderRadius: 28,
            padding: "48px 24px",
            textAlign: "center",
            boxShadow:
              "0 24px 60px -12px rgba(76,29,149,0.22), 0 8px 20px -10px rgba(17,24,39,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
            border: "1px solid rgba(167,139,250,0.30)",
            overflow: "hidden",
            animation: "tnl-notif-in 320ms ease-out",
          }}
        >
          <span
            aria-hidden
            style={{
              pointerEvents: "none",
              position: "absolute",
              top: -50,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(167,139,250,0.22) 0%, rgba(167,139,250,0) 70%)",
              filter: "blur(8px)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              margin: "0 auto 14px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              background:
                "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 60%,#DDD6FE 100%)",
              border: "1px solid rgba(167,139,250,0.40)",
              boxShadow:
                "0 12px 26px -10px rgba(124,58,237,0.40), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            🔔
          </div>
          <div
            style={{
              position: "relative",
              fontSize: 18,
              fontWeight: 900,
              marginBottom: 8,
              letterSpacing: "-0.015em",
              background:
                "linear-gradient(135deg,#1F2937 0%,#4C1D95 65%,#6D28D9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Nenhuma notificação
          </div>
          <div
            style={{
              position: "relative",
              fontSize: 13.5,
              lineHeight: 1.5,
              color: "#6B7280",
              fontWeight: 600,
              maxWidth: 280,
              margin: "0 auto",
            }}
          >
            Atualizações de listas compartilhadas aparecerão aqui.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, idx) => {
            const read = Boolean(item?.read);
            return (
              <div
                key={item?.id}
                style={{
                  position: "relative",
                  background: read
                    ? "linear-gradient(180deg,#FFFFFF 0%,#FAFAFB 100%)"
                    : "linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 60%,#F8F4FF 100%)",
                  borderRadius: 22,
                  padding: 16,
                  border: read
                    ? "1px solid rgba(229,231,235,0.9)"
                    : "1px solid rgba(167,139,250,0.38)",
                  boxShadow: read
                    ? "0 6px 16px -8px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"
                    : "0 18px 40px -14px rgba(124,58,237,0.32), 0 6px 14px -8px rgba(17,24,39,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  overflow: "hidden",
                  animation: `tnl-notif-in 320ms ease-out ${Math.min(idx, 6) * 40}ms both`,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {!read && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 12,
                      bottom: 12,
                      width: 3,
                      borderRadius: 999,
                      background:
                        "linear-gradient(180deg,#6D28D9 0%,#8B5CF6 100%)",
                      boxShadow: "0 0 10px rgba(124,58,237,0.5)",
                    }}
                  />
                )}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    borderRadius: 16,
                    background: read
                      ? "linear-gradient(135deg,#F3F4F6 0%,#E5E7EB 100%)"
                      : "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
                    color: read ? "#6B7280" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 900,
                    border: read
                      ? "1px solid rgba(229,231,235,0.9)"
                      : "1px solid rgba(167,139,250,0.40)",
                    boxShadow: read
                      ? "inset 0 1px 0 rgba(255,255,255,0.9)"
                      : "0 10px 22px -8px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
                  }}
                >
                  {read ? "✓" : "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 6,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: read ? "#374151" : "#111827",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.25,
                      }}
                    >
                      {item?.meta?.listName || "Atualização"}
                    </div>
                    {!read && (
                      <span
                        aria-label="Não lida"
                        style={{
                          width: 10,
                          height: 10,
                          minWidth: 10,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg,#7C3AED 0%,#9F67FA 100%)",
                          marginTop: 4,
                          boxShadow:
                            "0 0 0 3px rgba(124,58,237,0.18), 0 2px 6px rgba(124,58,237,0.45)",
                          animation: "tnl-notif-pulse 1.8s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      color: read ? "#6B7280" : "#4B5563",
                      fontWeight: 600,
                    }}
                  >
                    {item?.message}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      fontSize: 11.5,
                      color: "#6B7280",
                      fontWeight: 700,
                      alignItems: "center",
                    }}
                  >
                    {item?.meta?.actorName && (
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 999,
                          background:
                            "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 100%)",
                          border: "1px solid rgba(167,139,250,0.35)",
                          color: "#6D28D9",
                          letterSpacing: "0.01em",
                        }}
                      >
                        Por {item.meta.actorName}
                      </span>
                    )}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      🕐 {formatNotificationTime(item?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
