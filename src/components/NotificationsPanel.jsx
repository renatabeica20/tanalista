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
          "linear-gradient(180deg,#4F46E5 0%,#7C3AED 22%,#F3F4F6 22%,#FFFFFF 100%)",
        padding:
          "max(18px, env(safe-area-inset-top)) 16px max(28px, env(safe-area-inset-bottom))",
        overflowX: "hidden",
        WebkitTextSizeAdjust: "100%",
        touchAction: "manipulation",
        fontFamily:
          "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 18,
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
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.16)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 900,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ←
        </button>

        <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 950,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
            }}
          >
            Notificações
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            {unreadCount > 0
              ? `${unreadCount} não lidas`
              : "Tudo atualizado"}
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
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(255,255,255,0.16)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 900,
            cursor: "pointer",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Lidas
        </button>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 28,
            padding: "42px 24px",
            textAlign: "center",
            boxShadow: "0 24px 60px rgba(79,70,229,0.14)",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Nenhuma notificação
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: "#6B7280",
              fontWeight: 600,
            }}
          >
            Atualizações de listas compartilhadas aparecerão aqui.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item) => {
            const read = Boolean(item?.read);

            return (
              <div
                key={item?.id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  padding: 16,
                  border: read
                    ? "1px solid #E5E7EB"
                    : "1px solid rgba(124,58,237,0.22)",
                  boxShadow: read
                    ? "0 10px 24px rgba(15,23,42,0.05)"
                    : "0 18px 44px rgba(124,58,237,0.12)",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    minWidth: 46,
                    borderRadius: 18,
                    background: read
                      ? "#F3F4F6"
                      : "linear-gradient(135deg,#6366F1,#8B5CF6)",
                    color: read ? "#6B7280" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 900,
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
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#111827",
                      }}
                    >
                      {item?.meta?.listName || "Atualização"}
                    </div>

                    {!read && (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          minWidth: 10,
                          borderRadius: "50%",
                          background: "#7C3AED",
                          marginTop: 5,
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#4B5563",
                      fontWeight: 600,
                    }}
                  >
                    {item?.message}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      fontSize: 12,
                      color: "#6B7280",
                      fontWeight: 700,
                    }}
                  >
                    {item?.meta?.actorName && (
                      <span>Por {item.meta.actorName}</span>
                    )}

                    <span>{formatNotificationTime(item?.createdAt)}</span>
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
