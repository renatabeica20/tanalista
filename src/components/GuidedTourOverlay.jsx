import { useEffect, useState, useCallback } from "react";

export default function GuidedTourOverlay({
  step,
  index,
  total,
  onNext,
  onPrev,
  onClose,
  onSkip,
  showPrev = true,
  showSkip = true,
}) {
  if (!step) return null;

  const isLast = index >= total - 1;
  const primaryLabel = isLast ? "Fechar" : "Próximo";
  const progress = ((index + 1) / Math.max(total, 1)) * 100;
  const targetId = step?.id || step?.targetId || null;

  const [targetRect, setTargetRect] = useState(null);

  const findEl = useCallback(() => {
    if (typeof document === "undefined" || !targetId) return null;
    let el = document.querySelector(`[data-tour-step="${targetId}"]`);
    if (el) return el;
    // Suporte a data-tour-also="id1 id2 id3"
    el = Array.from(document.querySelectorAll("[data-tour-also]")).find(
      (node) => (node.getAttribute("data-tour-also") || "").split(" ").includes(targetId)
    );
    return el || null;
  }, [targetId]);

  const measureEl = useCallback((el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    const pad = 8;
    return {
      x: r.left - pad,
      y: r.top - pad,
      w: r.width + pad * 2,
      h: r.height + pad * 2,
      centerY: r.top + r.height / 2,
    };
  }, []);

  useEffect(() => {
    setTargetRect(null);
    if (!targetId) return;
    let cancelled = false;
    const timers = [];

    const attempt = () => {
      const el = findEl();
      if (!el) return false;
      try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {}
      const r = measureEl(el);
      if (r && !cancelled) { setTargetRect(r); return true; }
      return false;
    };

    if (!attempt()) {
      timers.push(setTimeout(() => {
        if (!attempt()) timers.push(setTimeout(() => attempt(), 350));
      }, 120));
    } else {
      timers.push(setTimeout(() => {
        if (cancelled) return;
        const r = measureEl(findEl());
        if (r) setTargetRect(r);
      }, 500));
    }

    const onLayout = () => {
      if (cancelled) return;
      const r = measureEl(findEl());
      if (r) setTargetRect(r);
    };
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [targetId, findEl, measureEl]);

  // Posiciona o card do pop-up evitando cobrir o elemento destacado.
  // Se o elemento está na metade inferior da tela → card aparece no topo.
  // Se está na metade superior → card aparece na base.
  const screenH = typeof window !== "undefined" ? window.innerHeight : 900;
  const elementInBottomHalf = targetRect ? targetRect.centerY > screenH / 2 : false;
  const cardPosition = elementInBottomHalf ? { top: 88 } : { bottom: 88 };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:620, pointerEvents:"none" }}>
      <style>{`
        @keyframes tnl-tour-fade { from{opacity:0} to{opacity:1} }
        @keyframes tnl-tour-pop  { from{transform:translateY(12px) scale(0.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes tnl-tour-icon { 0%{transform:scale(0.6) rotate(-8deg);opacity:0} 60%{transform:scale(1.08) rotate(2deg);opacity:1} 100%{transform:scale(1) rotate(0)} }
        @keyframes tnl-tour-shine{ 0%{transform:translateX(-100%)} 100%{transform:translateX(220%)} }
        @keyframes tnl-tour-ring {
          0%,100%{ opacity:1; box-shadow:0 0 0 3px rgba(255,255,255,0.95), 0 0 0 7px rgba(124,58,237,0.7), 0 0 28px 4px rgba(124,58,237,0.35); }
          50%    { opacity:1; box-shadow:0 0 0 5px rgba(255,255,255,1),   0 0 0 12px rgba(124,58,237,0.9), 0 0 40px 8px rgba(124,58,237,0.5); }
        }
      `}</style>

      {/* Backdrop escuro simples */}
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(15,23,42,0.72)",
        backdropFilter:"blur(2px)",
        WebkitBackdropFilter:"blur(2px)",
        pointerEvents:"none",
        animation:"tnl-tour-fade 220ms ease-out",
      }} />

      {/* Janela transparente sobre o elemento destacado */}
      {targetRect && (
        <div style={{
          position:"fixed",
          left: targetRect.x,
          top: targetRect.y,
          width: targetRect.w,
          height: targetRect.h,
          borderRadius: 18,
          background: "transparent",
          boxShadow: "0 0 0 9999px rgba(15,23,42,0.72)",
          pointerEvents: "none",
          zIndex: 621,
          animation: "tnl-tour-ring 1.6s ease-in-out infinite",
        }} />
      )}

      {/* Card do passo */}
      <div style={{
        position:"absolute", left:14, right:14,
        ...cardPosition,
        margin:"0 auto", maxWidth:400,
        background:"linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 60%,#F8F4FF 100%)",
        borderRadius:28, padding:"20px 20px 18px",
        boxShadow:"0 30px 80px -12px rgba(76,29,149,0.45),0 12px 28px -10px rgba(17,24,39,0.28),inset 0 1px 0 rgba(255,255,255,0.95)",
        border:"1px solid rgba(167,139,250,0.32)",
        pointerEvents:"auto", overflow:"hidden",
        animation:"tnl-tour-pop 320ms cubic-bezier(0.22,1,0.36,1)",
        WebkitTapHighlightColor:"transparent",
        zIndex: 622,
      }}>
        <span aria-hidden style={{pointerEvents:"none",position:"absolute",top:-60,right:-50,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.28) 0%,rgba(167,139,250,0) 70%)",filter:"blur(6px)"}}/>
        <span aria-hidden style={{pointerEvents:"none",position:"absolute",bottom:-70,left:-50,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.20) 0%,rgba(124,58,237,0) 70%)",filter:"blur(8px)"}}/>

        <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
          <div style={{width:50,height:50,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,background:"linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 60%,#DDD6FE 100%)",border:"1px solid rgba(167,139,250,0.35)",boxShadow:"0 10px 22px -8px rgba(124,58,237,0.40),inset 0 1px 0 rgba(255,255,255,0.9)",flexShrink:0,animation:"tnl-tour-icon 420ms cubic-bezier(0.22,1,0.36,1)"}}>
            {step.icon}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:900,color:"#6D28D9",textTransform:"uppercase",letterSpacing:"0.08em",display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:999,background:"linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 100%)",border:"1px solid rgba(167,139,250,0.30)"}}>
              Passo {index + 1} de {total}
            </div>
            <div style={{fontSize:20,fontWeight:900,lineHeight:1.15,marginTop:8,letterSpacing:"-0.015em",background:"linear-gradient(135deg,#1F2937 0%,#4C1D95 65%,#6D28D9 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              {step.title}
            </div>
            <div style={{fontSize:13.5,color:"#4B5563",fontWeight:600,lineHeight:1.5,marginTop:6}}>
              {step.text}
            </div>
          </div>
        </div>

        <div style={{position:"relative",height:8,background:"linear-gradient(180deg,#F1EEFB 0%,#EDE9FE 100%)",borderRadius:999,overflow:"hidden",margin:"10px 0 18px",boxShadow:"inset 0 1px 2px rgba(76,29,149,0.10)"}}>
          <div style={{position:"relative",height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#4C1D95 0%,#7C3AED 50%,#9F67FA 100%)",borderRadius:999,transition:"width 500ms cubic-bezier(0.22,1,0.36,1)",overflow:"hidden"}}>
            <span aria-hidden style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.55) 50%,rgba(255,255,255,0) 100%)",animation:"tnl-tour-shine 1.8s ease-in-out infinite"}}/>
          </div>
        </div>

        <div style={{position:"relative",display:"grid",gridTemplateColumns:showPrev&&index>0?"1fr 1.4fr":"1fr",gap:10}}>
          {showPrev && index > 0 && (
            <button onClick={onPrev} style={{minHeight:52,border:"1.5px solid rgba(167,139,250,0.40)",background:"linear-gradient(180deg,#FFFFFF 0%,#F8F7FF 100%)",borderRadius:18,padding:"14px 18px",fontWeight:800,fontSize:15,color:"#4C1D95",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 6px rgba(76,29,149,0.08),inset 0 1px 0 rgba(255,255,255,0.9)",transition:"transform .15s ease",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}
              onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
              onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"} onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
              ← Voltar
            </button>
          )}
          <button onClick={isLast ? onClose : onNext} style={{minHeight:52,border:"none",background:"linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",color:"#FFFFFF",borderRadius:18,padding:"14px 18px",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 16px 32px -8px rgba(76,29,149,0.55),0 6px 14px rgba(124,58,237,0.30),inset 0 1px 0 rgba(255,255,255,0.35)",transition:"transform .15s ease",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}
            onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            onTouchStart={e=>e.currentTarget.style.transform="scale(0.97)"} onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
            {primaryLabel}{!isLast?" →":""}
          </button>
        </div>

        {showSkip && !isLast && (
          <button onClick={onSkip||onClose} style={{position:"relative",marginTop:12,width:"100%",border:"none",background:"transparent",color:"#6B7280",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",padding:"8px 12px",borderRadius:12,transition:"color .2s ease,background .2s ease",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}
            onMouseEnter={e=>{e.currentTarget.style.color="#4C1D95";e.currentTarget.style.background="rgba(167,139,250,0.10)"}}
            onMouseLeave={e=>{e.currentTarget.style.color="#6B7280";e.currentTarget.style.background="transparent"}}>
            Pular tutorial
          </button>
        )}
      </div>
    </div>
  );
}
