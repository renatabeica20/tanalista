import { useEffect } from "react";

export default function NotificationsScreen({
  notifications = [],
  onBack,
  onMarkAllRead,
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    onMarkAllRead?.();
  }, []);

  const typeMeta = (type) => {
    if (type === "shared-accepted")
      return { icon: "☑️", color: "#047857", bg: "#ECFDF5" };

    if (type === "started")
      return { icon: "🛒", color: "#6D28D9", bg: "#F5F3FF" };

    if (type === "finished")
      return { icon: "🧾", color: "#B91C1C", bg: "#FEF2F2" };

    return { icon: "🔔", color: "#374151", bg: "#F9FAFB" };
  };

  const formatNotifTime = (value) => {
    try {
      const d = new Date(value);

      if (Number.isNaN(d.getTime())) return "";

      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#FAF7FF 0%,#FFFFFF 52%,#F8FAFC 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#5B21B6,#8B5CF6)",
            borderRadius: 28,
            padding: 20,
            color: "#FFFFFF",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <button
              onClick={onBack}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.28)",
                background: "rgba(255,255,255,0.16)",
                color: "#FFFFFF",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ←
            </button>

            <div
              style={{
                textAlign: "center",
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  lineHeight: 1.1,
                }}
              >
                Notificações
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: 0.86,
                  marginTop: 5,
                }}
              >
                {unreadCount > 0
                  ? `${unreadCount} nova(s)`
                  : "Tudo em dia"}
              </div>
            </div>

            <div style={{ width: 44 }} />
          </div>
        </div>

        {!notifications.length ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 24,
              padding: 28,
              marginTop: 18,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 8 }}>🔔</div>

            <div
              style={{
                fontSize: 19,
                fontWeight: 900,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Nenhuma notificação
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                lineHeight: 1.45,
              }}
            >
              As atualizações de listas aparecerão aqui.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 18,
            }}
          >
            {notifications.map((n) => {
              const meta = typeMeta(n.type);

              return (
                <div
                  key={n.id}
                  style={{
                    background: "#FFFFFF",
                    border: n.read
                      ? "1px solid #E5E7EB"
                      : "2px solid #DDD6FE",
                    borderRadius: 18,
                    padding: 14,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: meta.bg,
                      color: meta.color,
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: n.read ? 750 : 900,
                        color: "#111827",
                        lineHeight: 1.3,
                      }}
                    >
                      {n.title}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#6B7280",
                        marginTop: 5,
                      }}
                    >
                      {formatNotifTime(n.createdAt)}
                    </div>
                  </div>

                  {!n.read && (
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 999,
                        background: "#DC2626",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
