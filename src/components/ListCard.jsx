export default function ListCard({
  list,
  variant = "recent",
  listMenuId,
  setListMenuId,
  setCurrentList,
  setScreen,
  setSearch,
  setCollapsedCats,
  formatListDate,
  getListOriginMeta,
  isListFinished,
  openListForEdit,
  setShareTargetList,
  setShareModal,
  duplicateList,
  stopListSharing,
  setConfirmDelete,
  getListCardStats,
  fmtR,
  WhatsAppIcon,
}) {
  const icons = {
    mercado: "🛒",
    festa: "🎉",
    construcao: "🏗️",
    eletrico: "⚡",
    escolar: "🏫",
    farmacia: "💊",
    condominio: "🏢",
    outros: "📦",
  };

  const originMeta = getListOriginMeta(list);
  const shared = list.isShared === true;
  const finished = isListFinished(list);
  const editableCopy = Boolean(
    list?.editableCopy ||
    list?.status === "draft" ||
    list?.isCopy ||
    list?.copiedFrom ||
    list?.copiedFromId
  );
  const canEditList = !finished || editableCopy;
  const stats = variant === "history" ? getListCardStats(list) : null;
  const isHistory = variant === "history";

  const openList = () => {
    setCurrentList(list);
    setScreen("list");
    setSearch("");
    setCollapsedCats({});
  };

  const openShare = () => {
    setCurrentList(list);
    setShareTargetList(list);
    setShareModal(true);
    setListMenuId(null);
  };

  const cardStyle = isHistory
    ? {
        background: "rgba(255,255,255,0.98)",
        borderRadius: 22,
        boxShadow: "0 12px 28px rgba(17,24,39,0.06)",
        border: "1px solid #E5E7EB",
        overflow: "visible",
        position: "relative",
      }
    : {
        background: "rgba(255,255,255,0.98)",
        borderRadius: 20,
        boxShadow: "0 10px 24px rgba(17,24,39,0.07)",
        border: "1px solid #E5E7EB",
        overflow: "visible",
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      };

  const rowStyle = isHistory
    ? { display: "flex", alignItems: "center", gap: 12, padding: "14px", cursor: "pointer" }
    : {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        cursor: "pointer",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      };

  const iconStyle = isHistory
    ? {
        width: 42,
        height: 42,
        borderRadius: 16,
        background: "linear-gradient(135deg,#F5F3FF,#EEF2FF)",
        border: "1px solid #DDD6FE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        flexShrink: 0,
      }
    : {
        width: 40,
        height: 40,
        borderRadius: 15,
        background: "linear-gradient(135deg,#F5F3FF,#EEF2FF)",
        border: "1px solid #DDD6FE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 21,
        flexShrink: 0,
      };

  const menuButtonStyle = isHistory
    ? {
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "7px 11px",
        cursor: "pointer",
        fontWeight: 900,
        fontSize: 18,
        color: "#4B5563",
        fontFamily: "inherit",
        lineHeight: 1,
      }
    : {
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "6px 10px",
        cursor: "pointer",
        fontWeight: 900,
        fontSize: 17,
        color: "#4B5563",
        fontFamily: "inherit",
        lineHeight: 1,
      };

  const menuItemStyle = (color = "#111827") => ({
    width: "100%",
    padding: "12px 16px",
    border: "none",
    background: "none",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 600,
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: "inherit",
  });

  return (
    <div key={list.id} style={cardStyle}>
      <div onClick={openList} style={rowStyle}>
        <div style={iconStyle}>{icons[list.type] || "📦"}</div>

        {isHistory ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {list.name || "Lista sem nome"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 700 }}>{formatListDate(list.createdAt)}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: finished ? "#B91C1C" : "#047857", background: finished ? "#FEE2E2" : "#ECFDF5", border: "1px solid " + (finished ? "#FCA5A5" : "#A7F3D0"), borderRadius: 999, padding: "4px 9px", whiteSpace: "nowrap" }}>
                {finished ? "Finalizada" : "Em aberto"}
              </span>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 800 }}>{fmtR(stats?.fullTotal || list.total || 0)}</span>
            </div>
            {originMeta && (
              <div style={{ fontSize: 11, color: originMeta.type === "received" ? "#4C1D95" : "#047857", fontWeight: 800, marginTop: 4 }}>
                {originMeta.icon} {originMeta.text}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ textAlign: "center", minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                {list.name || "Lista sem nome"}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap", marginTop: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: finished ? "#B91C1C" : "#047857", background: finished ? "#FEE2E2" : "#ECFDF5", border: "1px solid " + (finished ? "#FCA5A5" : "#A7F3D0"), borderRadius: 999, padding: "4px 9px", whiteSpace: "nowrap" }}>
                  {finished ? "Finalizada" : "Em aberto"}
                </span>
                {shared && (
                  <span style={{ fontSize: 10, fontWeight: 900, color: "#6D28D9", background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 999, padding: "4px 9px", whiteSpace: "nowrap" }}>
                    Compartilhada
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5, fontWeight: 700, textAlign: "center" }}>
              {formatListDate(list.createdAt)}
            </div>
            {originMeta && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: originMeta.type === "received" ? "#EEF2FF" : "#ECFDF5", border: "1px solid " + (originMeta.type === "received" ? "#C4B5FD" : "#A7F3D0"), color: originMeta.type === "received" ? "#4C1D95" : "#047857", fontSize: 11, fontWeight: 900 }}>
                  <span>{originMeta.icon}</span>
                  <span>{originMeta.text}</span>
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setListMenuId(listMenuId === list.id ? null : list.id)} style={menuButtonStyle}>
            ⋯
          </button>
          {listMenuId === list.id && (
            <div style={{ position: "absolute", right: 0, top: 42, background: "#FFFFFF", borderRadius: 20, boxShadow: "0 18px 42px rgba(17,24,39,0.16)", border: "1px solid #E5E7EB", zIndex: 500, minWidth: 230, overflow: "hidden" }}>
              {canEditList && <button onClick={(e) => { e.stopPropagation(); openListForEdit(list); }} style={menuItemStyle()}>✏️ Editar lista</button>}
              <button onClick={openShare} style={menuItemStyle("#25D366")}><WhatsAppIcon size={18} /> Enviar lista</button>
              <button onClick={() => duplicateList(list)} style={menuItemStyle()}>📄 Fazer cópia</button>
              {shared && <button onClick={() => stopListSharing(list)} style={menuItemStyle("#6D28D9")}>🔒 Encerrar compartilhamento</button>}
              <div style={{ height: 1, background: "#F3F4F6" }} />
              <button onClick={() => { setConfirmDelete(list.id); setListMenuId(null); }} style={menuItemStyle("#DC2626")}>🗑 Excluir lista</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
