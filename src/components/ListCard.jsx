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
  const TYPE_META = {
    mercado:    { icon: "🛒", label: "Supermercado", color: "#6D28D9", soft: "#F5F3FF", border: "#DDD6FE" },
    festa:      { icon: "🎉", label: "Eventos",      color: "#EA580C", soft: "#FFF7ED", border: "#FED7AA" },
    construcao: { icon: "🏗️", label: "Construção",   color: "#B45309", soft: "#FFFBEB", border: "#FDE68A" },
    eletrico:   { icon: "⚡", label: "Elétrico",     color: "#1D4ED8", soft: "#EFF6FF", border: "#BFDBFE" },
    escolar:    { icon: "🏫", label: "Escolar",      color: "#15803D", soft: "#F0FDF4", border: "#BBF7D0" },
    farmacia:   { icon: "💊", label: "Farmácia",     color: "#BE185D", soft: "#FDF2F8", border: "#FBCFE8" },
    condominio: { icon: "🏢", label: "Condomínio",   color: "#0F4C75", soft: "#EFF6FF", border: "#BFDBFE" },
    outros:     { icon: "📦", label: "Outras",       color: "#374151", soft: "#F9FAFB", border: "#E5E7EB" },
  };

  const typeMeta = TYPE_META[list?.type] || TYPE_META.outros;

  const originMeta = getListOriginMeta(list);
  const shared = list.isShared === true;

  const editableCopy = Boolean(
    list?.editableCopy === true ||
    list?.isCopy === true ||
    list?.copyMode === "prelist" ||
    list?.copiedFrom ||
    list?.copiedFromId ||
    list?.copiedFromListId ||
    list?.status === "draft"
  );

  const finished = editableCopy ? false : isListFinished(list);
  const canEditList = editableCopy || !finished;
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

  const cardStyle = {
    background: isHistory
      ? "linear-gradient(180deg, #FFFFFF 0%, #FBFAFE 100%)"
      : `linear-gradient(180deg, #FFFFFF 0%, ${typeMeta.soft} 130%)`,
    borderRadius: isHistory ? 18 : 22,
    boxShadow: isHistory
      ? `0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 16px -8px ${typeMeta.color}22, 0 1px 2px rgba(15,23,42,0.05)`
      : `0 1px 0 rgba(255,255,255,0.95) inset, 0 18px 36px -16px ${typeMeta.color}38, 0 6px 14px -8px ${typeMeta.color}22, 0 1px 2px rgba(15,23,42,0.05)`,
    border: `1px solid ${typeMeta.border}`,
    overflow: "visible",
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    transition: "box-shadow 240ms ease, transform 200ms ease, border-color 200ms ease",
  };

  const rowStyle = isHistory
    ? { display:"flex", alignItems:"center", gap:14, padding:"15px 16px", cursor:"pointer", width:"100%", boxSizing:"border-box", position:"relative" }
    : { display:"flex", alignItems:"center", gap:13, padding:"16px 15px", cursor:"pointer", width:"100%", maxWidth:"100%", boxSizing:"border-box", position:"relative" };

  const iconStyle = {
    width: isHistory ? 46 : 48,
    height: isHistory ? 46 : 48,
    borderRadius: 15,
    background: `linear-gradient(135deg, ${typeMeta.soft} 0%, #FFFFFF 55%, ${typeMeta.soft} 130%)`,
    border: `1px solid ${typeMeta.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isHistory ? 22 : 23,
    flexShrink: 0,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 ${typeMeta.color}10, 0 6px 14px -6px ${typeMeta.color}38, 0 1px 2px rgba(15,23,42,0.06)`,
    textShadow: `0 1px 2px ${typeMeta.color}33`,
    transition: "transform 180ms ease, box-shadow 200ms ease",
  };

  const menuButtonStyle = {
    background: `linear-gradient(180deg, #FFFFFF 0%, ${typeMeta.soft} 100%)`,
    border: `1px solid ${typeMeta.border}`,
    borderRadius: 12,
    padding: isHistory ? "8px 12px" : "7px 11px",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: isHistory ? 18 : 17,
    color: typeMeta.color,
    fontFamily: "inherit",
    lineHeight: 1,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 6px -2px ${typeMeta.color}2A`,
    transition: "background 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 200ms ease",
  };

  const menuItemStyle = (color = "#0F172A") => ({
    width: "100%",
    padding: "12px 14px",
    border: "none",
    background: "none",
    textAlign: "left",
    fontSize: 13.5,
    fontWeight: 700,
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 11,
    fontFamily: "inherit",
    letterSpacing: "-0.005em",
    transition: "background 140ms ease, transform 140ms ease",
  });

  // Badge de tipo de lista — colorido por tipo
  const typeBadge = (
    <span style={{
      fontSize: 9.5,
      fontWeight: 900,
      color: typeMeta.color,
      background: `linear-gradient(180deg, #FFFFFF, ${typeMeta.soft})`,
      border: `1px solid ${typeMeta.border}`,
      borderRadius: 999,
      padding: "4px 9px",
      whiteSpace: "nowrap",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px ${typeMeta.color}1A`,
    }}>
      {typeMeta.icon} {typeMeta.label}
    </span>
  );

  const statusBadge = (
    <span style={{
      fontSize: 9.5,
      fontWeight: 900,
      color: finished ? "#B91C1C" : "#047857",
      background: finished
        ? "linear-gradient(180deg,#FEF2F2,#FECACA)"
        : "linear-gradient(180deg,#F0FDF4,#D1FAE5)",
      border: "1px solid " + (finished ? "#FCA5A5" : "#A7F3D0"),
      borderRadius: 999,
      padding: "4px 10px",
      whiteSpace: "nowrap",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      boxShadow: finished
        ? "inset 0 1px 0 rgba(255,255,255,0.85), 0 1px 2px rgba(185,28,28,0.12)"
        : "inset 0 1px 0 rgba(255,255,255,0.85), 0 1px 2px rgba(4,120,87,0.12)",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>
      <span aria-hidden style={{ width:5, height:5, borderRadius:"50%", background: finished?"#DC2626":"#10B981", boxShadow: finished?"0 0 6px rgba(220,38,38,0.55)":"0 0 6px rgba(16,185,129,0.55)" }}/>
      {finished ? "Finalizada" : "Em aberto"}
    </span>
  );

  return (
    <div key={list.id} style={cardStyle}>
      {/* Accent stripe — distinct per variant */}
      {isHistory ? (
        <span aria-hidden style={{ position:"absolute", left:0, top:10, bottom:10, width:3, borderRadius:999, background:`linear-gradient(180deg, ${typeMeta.color}, ${typeMeta.color}66)`, boxShadow:`0 0 10px ${typeMeta.color}55` }}/>
      ) : (
        <span aria-hidden style={{ position:"absolute", left:14, right:14, top:0, height:3, borderRadius:"0 0 999px 999px", background:`linear-gradient(90deg, transparent, ${typeMeta.color}, transparent)`, opacity:0.85 }}/>
      )}
      <div onClick={openList} style={rowStyle}>
        <div style={iconStyle}>{typeMeta.icon}</div>

        {isHistory ? (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:14.5, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.015em" }}>
              {list.name || "Lista sem nome"}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginTop:7 }}>
              <span style={{ fontSize:11, color:"#64748B", fontWeight:700, letterSpacing:0.1 }}>
                {formatListDate(list.createdAt)}
              </span>
              {typeBadge}
              {statusBadge}
              <span style={{ fontSize:11.5, color:"#047857", fontWeight:900, fontVariantNumeric:"tabular-nums", background:"linear-gradient(180deg, rgba(236,253,245,0.95), rgba(209,250,229,0.85))", border:"1px solid rgba(4,120,87,0.22)", borderRadius:8, padding:"3px 9px", letterSpacing:"-0.005em", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.85)" }}>
                {fmtR(stats?.fullTotal || list.total || 0)}
              </span>
            </div>
            {originMeta && (
              <div style={{ fontSize:10.5, color:originMeta.type==="received"?"#4C1D95":"#047857", fontWeight:800, marginTop:7, letterSpacing:0.2, textTransform:"uppercase" }}>
                {originMeta.icon} {originMeta.text}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ textAlign:"center", minWidth:0 }}>
              <div style={{ fontWeight:900, fontSize:15.5, color:"#0F172A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%", letterSpacing:"-0.02em" }}>
                {list.name || "Lista sem nome"}
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, flexWrap:"wrap", marginTop:7 }}>
                {typeBadge}
                {statusBadge}
                {shared && (
                  <span style={{ fontSize:9.5, fontWeight:900, color:"#6D28D9", background:"linear-gradient(180deg,#FAF5FF,#EDE9FE)", border:"1px solid #DDD6FE", borderRadius:999, padding:"4px 9px", whiteSpace:"nowrap", letterSpacing:"0.06em", textTransform:"uppercase", display:"inline-flex", alignItems:"center", gap:4, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(109,40,217,0.18)" }}>
                    🔗 Compartilhada
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize:10.5, color:"#94A3B8", marginTop:7, fontWeight:700, textAlign:"center", letterSpacing:0.2, textTransform:"uppercase" }}>
              {formatListDate(list.createdAt)}
            </div>
            {originMeta && (
              <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 11px", borderRadius:999, background:originMeta.type==="received"?"linear-gradient(180deg,#F5F3FF,#E0E7FF)":"linear-gradient(180deg,#F0FDF4,#D1FAE5)", border:"1px solid "+(originMeta.type==="received"?"#C4B5FD":"#A7F3D0"), color:originMeta.type==="received"?"#4C1D95":"#047857", fontSize:10, fontWeight:900, letterSpacing:"0.06em", textTransform:"uppercase", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 4px rgba(15,23,42,0.04)" }}>
                  <span>{originMeta.icon}</span>
                  <span>{originMeta.text}</span>
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ position:"relative", flexShrink:0 }} onClick={(e)=>e.stopPropagation()}>
          <button
            onClick={(e)=>{e.preventDefault();e.stopPropagation();setListMenuId(listMenuId===list.id?null:list.id);}}
            style={menuButtonStyle}
            aria-label="Mais opções"
          >⋯</button>
          {listMenuId===list.id&&(
            <div onClick={(e)=>e.stopPropagation()} style={{ position:"absolute", right:0, top:46, background:"linear-gradient(180deg, #FFFFFF 0%, #FBFAFE 100%)", borderRadius:18, boxShadow:"0 28px 60px -12px rgba(76,29,149,0.32), 0 10px 24px -10px rgba(15,23,42,0.12), 0 2px 4px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)", border:"1px solid rgba(100,80,200,0.16)", zIndex:9999, minWidth:248, overflow:"hidden", padding:6, backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)" }}>
              {canEditList&&(
                <button onClick={(e)=>{e.preventDefault();e.stopPropagation();setListMenuId(null);openListForEdit(list);}} style={{...menuItemStyle(),borderRadius:12}}>
                  ✏️ Editar lista
                </button>
              )}
              <button onClick={(e)=>{e.preventDefault();e.stopPropagation();openShare();}} style={{...menuItemStyle("#25D366"),borderRadius:12}}>
                <WhatsAppIcon size={18}/> Enviar lista
              </button>
              <button onClick={(e)=>{e.preventDefault();e.stopPropagation();setListMenuId(null);duplicateList(list);}} style={{...menuItemStyle(),borderRadius:12}}>
                📄 Fazer cópia
              </button>
              {shared&&(
                <button onClick={(e)=>{e.preventDefault();e.stopPropagation();setListMenuId(null);stopListSharing(list);}} style={{...menuItemStyle("#6D28D9"),borderRadius:12}}>
                  🔒 Encerrar compartilhamento
                </button>
              )}
              <div style={{ height:1, background:"linear-gradient(90deg, transparent, rgba(100,80,200,0.18), transparent)", margin:"6px 10px" }}/>
              <button onClick={(e)=>{e.preventDefault();e.stopPropagation();setListMenuId(null);setConfirmDelete(list.id);}} style={{...menuItemStyle("#DC2626"),borderRadius:12}}>
                🗑 Excluir lista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
