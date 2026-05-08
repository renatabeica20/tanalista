import { useEffect, useRef, useState } from "react";

export default function AppUpdateController({
  getCurrentAppAssetSignature,
  fetchFreshAppAssetSignature,
  clearAppCachesBeforeReload,
  registerEvent,
  checkIntervalMs = 2 * 60 * 1000,
}) {
  const [updateNotice, setUpdateNotice] = useState({ show: false, checking: false });
  const updateNoticeShownRef = useRef(false);

  useEffect(() => {
    if (typeof getCurrentAppAssetSignature !== "function") return;

    const currentSignature = getCurrentAppAssetSignature();
    if (!currentSignature) return;

    let cancelled = false;

    const checkForUpdate = async () => {
      if (cancelled || updateNoticeShownRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (typeof fetchFreshAppAssetSignature !== "function") return;

      const freshSignature = await fetchFreshAppAssetSignature();
      if (cancelled || updateNoticeShownRef.current) return;

      if (freshSignature && freshSignature !== currentSignature) {
        updateNoticeShownRef.current = true;
        setUpdateNotice({ show: true, checking: false });
        registerEvent?.("app_update_available", {
          current_signature: currentSignature,
          fresh_signature: freshSignature,
        });
      }
    };

    const handleFocus = () => checkForUpdate();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    const firstTimer = window.setTimeout(checkForUpdate, 7000);
    const interval = window.setInterval(checkForUpdate, checkIntervalMs);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    getCurrentAppAssetSignature,
    fetchFreshAppAssetSignature,
    registerEvent,
    checkIntervalMs,
  ]);

  const updateAppNow = async () => {
    try {
      setUpdateNotice({ show: true, checking: true });
      registerEvent?.("app_update_clicked", { source: "update_notice" });
      if (typeof clearAppCachesBeforeReload === "function") {
        await clearAppCachesBeforeReload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      window.location.reload();
    }
  };

  const closeNotice = () => {
    setUpdateNotice({ show: false, checking: false });
    registerEvent?.("app_update_later", { source: "update_notice" });
  };

  if (!updateNotice.show) return null;

  return (
    <div style={{position:"fixed",left:14,right:14,bottom:86,zIndex:650,display:"flex",justifyContent:"center",pointerEvents:"none"}}>
      <div style={{width:"100%",maxWidth:420,background:"#FFFFFF",border:"1px solid #DDD6FE",borderRadius:22,padding:16,boxShadow:"0 24px 60px rgba(17,24,39,0.22)",pointerEvents:"auto"}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:44,height:44,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",color:"#FFFFFF",fontSize:22,boxShadow:"0 14px 28px rgba(109,40,217,0.24)",flexShrink:0}}>✨</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:950,fontSize:16,color:"#111827",lineHeight:1.2}}>Nova atualização disponível</div>
            <div style={{fontWeight:700,fontSize:13,color:"#6B7280",lineHeight:1.35,marginTop:4}}>Atualize para receber as melhorias mais recentes do Tá na Lista.</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:14}}>
          <button
            onClick={updateAppNow}
            disabled={updateNotice.checking}
            style={{flex:1,border:"none",borderRadius:16,padding:"12px 14px",background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",color:"#FFFFFF",fontWeight:950,fontSize:14,cursor:updateNotice.checking?"wait":"pointer",fontFamily:"inherit",boxShadow:"0 12px 26px rgba(109,40,217,0.22)",opacity:updateNotice.checking?0.75:1}}
          >
            {updateNotice.checking ? "Atualizando..." : "Atualizar agora"}
          </button>
          <button
            onClick={closeNotice}
            disabled={updateNotice.checking}
            style={{border:"2px solid #E5E7EB",borderRadius:16,padding:"12px 14px",background:"#FFFFFF",color:"#374151",fontWeight:900,fontSize:14,cursor:updateNotice.checking?"wait":"pointer",fontFamily:"inherit"}}
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
