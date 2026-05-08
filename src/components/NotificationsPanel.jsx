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

      const previousOverflowX = document.body.style.overflowX;
      const previousTouchAction = document.body.style.touchAction;

      document.body.style.overflowX = "hidden";
      document.body.style.touchAction = "manipulation";

      return () => {
        document.body.style.overflowX = previousOverflowX;
        document.body.style.touchAction = previousTouchAction;
      };
    } catch {
      return undefined;
    }
  }, []);

  const handleBack = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (typeof onBack === "function") onBack();
  };

  const handleMarkAllRead = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (typeof onMarkAllRead === "function") onMarkAllRead();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        minWidth: 0,
        margin: "0 auto",
        minHeight: "100dvh",
        background: "linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 42%,#FFFFFF 100%)",
        fontFamily: "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
        position: "relative",
        overflowX: "hidden",
        boxSizing: "border-box",
        WebkitTextSizeAdjust: "100%",
        touchAction: "manipulation",
        isolation: "isolate",
        padding: "max(14px, env(safe-area-inset-top)) 14px max(24px, env(safe-area-inset-bottom))",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "8px 0 12px",
          background: "linear-gradient(180deg,rgba(238,242,255,0.98),rgba(248,250,252,0.92))",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            onTouchEnd={(event) => {
              event.preventDefault();
              handleBack(event);
            }}
            aria-label="Voltar"
            style={{
              width: 46,
              height: 46,
              minWidth: 46,
              minHeight: 46,
              borderRadius: 16,
              border: "1px solid #E5E7EB",
              background: "#FFFFFF",
              color: "#111827",
              fontSize: 20,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 24px rgba(17,24,39,0.08)",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              WebkitAppearance: "none",
              appearance: "none",
              userSelect: "none",
            }}
          >
            ←
          </button>

          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.15,
                fontWeight: 950,
                color: "#111827",
                letterSpacing: "-0.02em",
              }}
            >
              Notificações
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.3,
                fontWeight: 800,
                color: "#6B7280",
                marginTop: 3,
              }}
            >
              {unreadCount > 0
                ? `${unreadCount} ${unreadCount === 1 ? "não lida" : "não lidas"}`
                : "Tudo em dia"}
            </div>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            onTouchEnd={(event) => {
              event.preventDefault();
              handleMarkAllRead(event);
            }}
            disabled={!items.length}
            style={{
              minHeight: 46,
              minWidth: 80,
              borderRadius: 16,
              border: "1px solid #DDD6FE",
              background: items.length ? "#F5F3FF" : "#F3F4F6",
              color: items.length ? "#6D28D9" : "#9CA3AF",
              fontSize: 16,
              lineHeight: 1.1,
              fontWeight: 900,
              cursor: items.length ? "pointer" : "not-allowed",
              padding: "0 12px",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              WebkitAppearance: "none",
              appearance: "none",
              userSelect: "none",
            }}
          >
            Lidas
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            marginTop: 22,
            background: "#FFFFFF",
            border: "1px dashed #D1D5DB",
            borderRadius: 24,
            padding: "34px 22px",
            textAlign: "center",
            boxShadow: "0 14px 34px rgba(17,24,39,0.05)",
          }}
        >
          <div style={{ fontSize: 34, marginBottom: 8 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 950, color: "#111827", marginBottom: 6 }}>
            Nenhuma notificação
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#6B7280", lineHeight: 1.45 }}>
            Atualizações de listas compartilhadas aparecerão aqui.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 12 }}>
          {items.map((item) => {
            const read = Boolean(item?.read);
            const title = item?.meta?.listName || item?.type || "Atualização";
            const message = item?.message || "Atualização em lista compartilhada";
            const createdAt = formatNotificationTime(item?.createdAt);
            const actorName = item?.meta?.actorName || "";

            return (
              <div
                key={item?.id || `${message}-${createdAt}`}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#FFFFFF",
                  border: `1px solid ${read ? "#E5E7EB" : "#DDD6FE"}`,
                  borderRadius: 22,
                  padding: 15,
                  boxShadow: read
                    ? "0 10px 24px rgba(17,24,39,0.05)"
                    : "0 16px 34px rgba(109,40,217,0.12)",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    minWidth: 42,
                    borderRadius: 16,
                    background: read ? "#F3F4F6" : "#F5F3FF",
                    color: read ? "#6B7280" : "#6D28D9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    border: `1px solid ${read ? "#E5E7EB" : "#DDD6FE"}`,
                  }}
                >
                  {read ? "✓" : "🔔"}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        lineHeight: 1.25,
                        fontWeight: 950,
                        color: "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {title}
                    </div>

                    {!read && (
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          minWidth: 9,
                          borderRadius: "50%",
                          background: "#6D28D9",
                          boxShadow: "0 0 0 4px rgba(109,40,217,0.12)",
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.45,
                      fontWeight: 700,
                      color: "#4B5563",
                      wordBreak: "break-word",
                    }}
                  >
                    {message}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 9,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#6B7280",
                    }}
                  >
                    {actorName && <span>Por {actorName}</span>}
                    {createdAt && <span>{createdAt}</span>}
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
