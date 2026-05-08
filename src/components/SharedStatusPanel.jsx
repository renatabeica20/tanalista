export default function SharedStatusPanel({
  currentList,
  checkedItems,
  totalItems,
  originText = "",
  sharedUpdateNotice,
  sharedSyncing,
  onRefresh,
  formatRelativeSyncTime,
}) {
  if (currentList?.isShared !== true) return null;

  const progressPct = totalItems ? Math.round((checkedItems / totalItems) * 100) : 0;
  const lastUpdate = currentList.lastCloudSeenAt || currentList.lastSyncedAt || currentList.pulledAt;

  return (
    <div style={{ margin: "10px 20px 0", background: "#EEF2FF", border: "1px solid #C4B5FD", borderRadius: 18, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, color: "#4C1D95" }}>
      <span style={{ fontSize: 18 }}>🤝</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 13 }}>Lista compartilhada</div>
        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
          {originText ? `${originText} · ` : ""}{checkedItems}/{totalItems} itens concluídos
        </div>
        <div style={{ height: 7, background: "rgba(109,40,217,0.16)", borderRadius: 999, overflow: "hidden", marginTop: 7 }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#7C3AED,#A855F7)", borderRadius: 999, transition: "width 0.35s" }} />
        </div>
        <div style={{ marginTop: 7, fontSize: 11, fontWeight: 900, color: "#312E81", background: "rgba(255,255,255,0.62)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 999, padding: "5px 8px", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span>🕒</span>
          <span>Última atualização: {formatRelativeSyncTime(lastUpdate)}</span>
        </div>
        {sharedUpdateNotice && (
          <div style={{ marginTop: 7, fontSize: 11, fontWeight: 900, color: sharedUpdateNotice.type === "conflict" ? "#B91C1C" : "#047857", background: sharedUpdateNotice.type === "conflict" ? "#FEF2F2" : "#ECFDF5", border: "1px solid " + (sharedUpdateNotice.type === "conflict" ? "#FECACA" : "#A7F3D0"), borderRadius: 999, padding: "5px 8px", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span>{sharedUpdateNotice.type === "conflict" ? "⚠️" : "🔄"}</span>
            <span>{sharedUpdateNotice.msg}</span>
          </div>
        )}
      </div>
      <button
        onClick={onRefresh}
        disabled={sharedSyncing}
        style={{ border: "none", borderRadius: 16, padding: "10px 12px", background: sharedSyncing ? "#DDD6FE" : "#6D28D9", color: "white", fontSize: 12, fontWeight: 900, cursor: sharedSyncing ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: "0 10px 20px rgba(109,40,217,0.18)" }}
      >
        {sharedSyncing ? "Atualizando..." : "Atualizar"}
      </button>
    </div>
  );
}
