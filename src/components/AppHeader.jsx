export default function AppHeader({
  userName,
  onSwitchUser,
  onNotifications,
  unreadCount = 0,
}) {
  if (!userName) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 120,
        width: "100%",
        maxWidth: "100%",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
        paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        paddingBottom: 10,
        paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        boxSizing: "border-box",
        overflow: "hidden",
        flexWrap: "nowrap",
        boxShadow: "0 8px 22px rgba(17,24,39,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 900,
          color: "#111827",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          paddingRight: 6,
          minWidth: 0,
          flex: "1 1 auto",
        }}
      >
        Olá, {userName}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        <button
          onClick={onNotifications}
          aria-label="Notificações"
          style={{
            position: "relative",
            border: "1px solid #DDD6FE",
            background: "#F5F3FF",
            color: "#6D28D9",
            borderRadius: 999,
            width: 34,
            height: 34,
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 18px rgba(109,40,217,0.10)",
          }}
        >
          🔔

          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 17,
                height: 17,
                background: "#DC2626",
                color: "#FFFFFF",
                borderRadius: "50%",
                fontSize: 10,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #FFFFFF",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onSwitchUser}
          style={{
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
            color: "#6D28D9",
            borderRadius: 999,
            padding: "7px 12px",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 8px 18px rgba(17,24,39,0.06)",
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
