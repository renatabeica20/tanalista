import ListCard from "./ListCard";

export default function RecentLists({
  visibleLists,
  recentLists,
  historyLists,
  showHistory,
  setShowHistory,
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
  const safeRecentLists = Array.isArray(recentLists) ? recentLists.slice(0,3) : [];
  const safeHistoryLists = [
    ...(Array.isArray(recentLists) ? recentLists.slice(3) : []),
    ...(Array.isArray(historyLists) ? historyLists : []),
  ];

  const listCardProps = {
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
  };

  return (
    <>
      <div style={{
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        gap:12,
        margin:"6px 0 14px",
        width:"100%",
        boxSizing:"border-box",
        clear:"both"
      }}>
        <div style={{fontWeight:900,fontSize:12,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.9px"}}>
          Listas recentes
        </div>
        {visibleLists.length>0&&(
          <div style={{fontSize:12,color:"#6B7280",fontWeight:800,flexShrink:0}}>
            {visibleLists.length} {visibleLists.length===1?"lista salva":"listas salvas"}
          </div>
        )}
      </div>

      {visibleLists.length===0?(
        <div style={{textAlign:"center",padding:"28px 20px",color:"#6B7280",background:"#FFFFFF",border:"1px dashed #D1D5DB",borderRadius:24,boxShadow:"0 12px 28px rgba(17,24,39,0.04)"}}>
          <p style={{fontSize:15,lineHeight:1.6,fontWeight:900,margin:"0 0 6px",color:"#111827"}}>Nenhuma lista ainda</p>
          <p style={{fontSize:13,lineHeight:1.5,fontWeight:600,margin:0}}>Entre em Compras para criar sua primeira lista.</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {safeRecentLists.map(list=>(
            <ListCard key={list.id} list={list} variant="recent" {...listCardProps} />
          ))}
        </div>
      )}

      {safeHistoryLists.length>0&&(
        <div style={{marginTop:18}}>
          <button onClick={()=>setShowHistory(v=>!v)} style={{width:"100%",padding:"14px 16px",borderRadius:18,background:"#FFFFFF",border:"1px solid #E5E7EB",color:"#111827",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 10px 24px rgba(17,24,39,0.05)"}}>
            <span>Histórico</span><span style={{color:"#6D28D9"}}>{showHistory?"Ocultar histórico":"Ver histórico"} ({safeHistoryLists.length})</span>
          </button>
          {showHistory&&(
            <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:12}}>
              {safeHistoryLists.map(list=>(
                <ListCard key={list.id} list={list} variant="history" {...listCardProps} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
