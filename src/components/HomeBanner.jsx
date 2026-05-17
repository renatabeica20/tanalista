import BrandWordmark from "./BrandWordmark";
import ModuleIcon from "./ModuleIcon";

const MODULES = [
  { iconType: "compras",    name: "Compras",    desc: "Lista inteligente",    active: true  },
  { iconType: "festa",      name: "Festa",      desc: "Churrasco e eventos",  active: false },
  { iconType: "conta",      name: "Conta",      desc: "Dividir despesas",     active: false },
  { iconType: "saude",      name: "Saúde",      desc: "Receitas e remédios",  active: false },
  { iconType: "eventos",    name: "Eventos",    desc: "Convites e QR Code",   active: false },
  { iconType: "condominio", name: "Condomínio", desc: "Gestão e aprovações",  active: false },
];

export default function HomeBanner({ onStartTour, onOpenCompras, isTourStep }) {
  return (
    <>
      <style>{`
        @keyframes tnlHomeOrbDrift {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(8px,-10px,0) scale(1.05); }
        }
        @keyframes tnlHomeShimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes tnlHomeCardGlow {
          0%,100% { opacity: 0.55; }
          50% { opacity: 0.85; }
        }
        .tnl-home-tour-btn { transition: transform 200ms cubic-bezier(.2,.8,.2,1), background 220ms ease, box-shadow 240ms ease, border-color 220ms ease; }
        .tnl-home-tour-btn:hover { background: rgba(255,255,255,0.28) !important; border-color: rgba(255,255,255,0.6) !important; box-shadow: 0 14px 32px -10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.5) !important; transform: translateY(-1px); }
        .tnl-home-tour-btn:active { transform: translateY(0) scale(0.98); }
        .tnl-mod-card { transition: transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 260ms ease, border-color 220ms ease; }
        .tnl-mod-card-active:hover { transform: translateY(-3px); box-shadow: 0 28px 60px -14px rgba(109,40,217,0.65), 0 10px 24px -10px rgba(76,29,149,0.5), inset 0 1px 0 rgba(255,255,255,0.22) !important; }
        .tnl-mod-card-active:active { transform: translateY(-1px) scale(0.985); }
        .tnl-mod-card-inactive:hover { border-color: #DDD6FE !important; box-shadow: 0 10px 22px -10px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.9) !important; }
      `}</style>

      {/* ── BANNER SUPERIOR ── */}
      <div style={{
        background:"radial-gradient(120% 90% at 20% 0%, #8B5CF6 0%, transparent 55%), radial-gradient(120% 90% at 100% 100%, #5B21B6 0%, transparent 60%), linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#7C3AED 100%)",
        paddingTop:32,
        paddingRight:"max(16px, env(safe-area-inset-right, 0px))",
        paddingBottom:36,
        paddingLeft:"max(16px, env(safe-area-inset-left, 0px))",
        position:"relative",
        overflow:"hidden",
        boxShadow:"0 20px 56px -12px rgba(76,29,149,0.45), inset 0 -1px 0 rgba(255,255,255,0.08)",
      }}>
        {/* Grain / noise layer */}
        <div aria-hidden style={{position:"absolute",inset:0,background:"radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.08), transparent), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.06), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.05), transparent)",opacity:0.6,pointerEvents:"none",mixBlendMode:"overlay"}}/>
        {/* Orbes decorativos */}
        <div aria-hidden style={{position:"absolute",top:-90,right:-70,width:280,height:280,background:"radial-gradient(circle,rgba(196,181,253,0.35),rgba(255,255,255,0.08) 40%,transparent 70%)",borderRadius:"50%",pointerEvents:"none",animation:"tnlHomeOrbDrift 9s ease-in-out infinite",filter:"blur(2px)"}}/>
        <div aria-hidden style={{position:"absolute",bottom:-60,left:-50,width:220,height:220,background:"radial-gradient(circle,rgba(167,139,250,0.28),transparent 65%)",borderRadius:"50%",pointerEvents:"none",animation:"tnlHomeOrbDrift 11s ease-in-out infinite reverse",filter:"blur(2px)"}}/>
        <div aria-hidden style={{position:"absolute",top:"40%",left:"50%",width:120,height:120,transform:"translate(-50%,-50%)",background:"radial-gradient(circle,rgba(255,255,255,0.18),transparent 70%)",borderRadius:"50%",pointerEvents:"none",animation:"tnlHomeCardGlow 6s ease-in-out infinite"}}/>
        {/* Top highlight line */}
        <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",pointerEvents:"none"}}/>

        <div style={{position:"relative",maxWidth:520,width:"100%",margin:"0 auto",display:"flex",flexDirection:"column",gap:16,alignItems:"center"}}>
          <div style={{
            textAlign:"center",
            background:"linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.10) 60%, rgba(255,255,255,0.06) 100%)",
            border:"1px solid rgba(255,255,255,0.28)",
            borderRadius:30,
            padding:"24px 22px 20px",
            width:"100%",
            backdropFilter:"blur(22px) saturate(160%)",
            WebkitBackdropFilter:"blur(22px) saturate(160%)",
            boxShadow:"0 24px 48px -16px rgba(30,10,80,0.45), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(255,255,255,0.08)",
            position:"relative",
            overflow:"hidden",
          }}>
            {/* inner sheen */}
            <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:"55%",background:"linear-gradient(180deg, rgba(255,255,255,0.18), transparent)",borderTopLeftRadius:30,borderTopRightRadius:30,pointerEvents:"none"}}/>
            {/* shimmer */}
            <div aria-hidden style={{position:"absolute",top:0,bottom:0,left:0,width:"40%",background:"linear-gradient(105deg, transparent, rgba(255,255,255,0.22), transparent)",pointerEvents:"none",animation:"tnlHomeShimmer 6s ease-in-out infinite"}}/>

            <div style={{position:"relative"}}><BrandWordmark /></div>
            <div style={{position:"relative",color:"rgba(255,255,255,0.86)",fontSize:13,lineHeight:1.55,fontStyle:"italic",fontWeight:500,marginTop:14,letterSpacing:"0.005em",textShadow:"0 1px 8px rgba(30,10,80,0.35)"}}>Organize, compartilhe e controle o orçamento</div>
            <button
              onClick={onStartTour}
              className="tnl-home-tour-btn"
              style={{
                position:"relative",
                marginTop:18,
                border:"1.5px solid rgba(255,255,255,0.48)",
                borderRadius:999,
                padding:"12px 22px",
                background:"linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0.14))",
                color:"#FFFFFF",
                fontWeight:800,
                fontSize:13,
                letterSpacing:"0.01em",
                cursor:"pointer",
                fontFamily:"inherit",
                backdropFilter:"blur(10px)",
                WebkitBackdropFilter:"blur(10px)",
                boxShadow:"0 10px 24px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              ✨ Como usar o app
            </button>
          </div>
        </div>
      </div>

      {/* ── GRADE DE MÓDULOS ── */}
      <div style={{paddingTop:26,paddingRight:"max(14px, env(safe-area-inset-right, 0px))",paddingLeft:"max(14px, env(safe-area-inset-left, 0px))",maxWidth:720,width:"100%",margin:"0 auto",boxSizing:"border-box",overflowX:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span aria-hidden style={{width:18,height:2,borderRadius:2,background:"linear-gradient(90deg,#7C3AED,#C4B5FD)"}}/>
            <div style={{fontWeight:800,fontSize:11,color:"#6B7280",textTransform:"uppercase",letterSpacing:"1.4px"}}>Módulos</div>
          </div>
          <div style={{fontSize:11.5,color:"#6D28D9",fontWeight:800,background:"linear-gradient(180deg,#F5F0FF,#EDE4FF)",padding:"4px 11px",borderRadius:999,border:"1px solid #E0D4FF",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 6px -2px rgba(124,58,237,0.18)",letterSpacing:"0.01em"}}>6 áreas integradas</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginBottom:32}}>
          {MODULES.map(m => {
            const inactive = !m.active;
            return (
              <div
                key={m.name}
                role="button"
                tabIndex={m.active ? 0 : -1}
                aria-label={m.active ? `Abrir módulo ${m.name}` : `${m.name} em breve`}
                data-tour-step={m.iconType === "compras" ? "home_compras" : undefined}
                onClick={() => { if (!m.active) return; onOpenCompras(); }}
                onKeyDown={(e) => {
                  if (!m.active) return;
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenCompras(); }
                }}
                className={"tnl-mod-card " + (m.active ? "tnl-mod-card-active" : "tnl-mod-card-inactive")}
                style={{
                  background: m.active
                    ? "radial-gradient(120% 80% at 50% 0%, rgba(196,181,253,0.35) 0%, transparent 55%), linear-gradient(155deg,#3B0F73 0%,#5B21B6 35%,#6D28D9 70%,#8B5CF6 100%)"
                    : "#FFFFFF",
                  borderRadius: 24,
                  padding: m.active ? "30px 16px 26px" : "20px 14px 18px",
                  cursor: m.active ? "pointer" : "not-allowed",
                  boxShadow: m.active
                    ? "0 36px 70px -16px rgba(76,29,149,0.7), 0 18px 36px -12px rgba(109,40,217,0.55), 0 6px 14px -6px rgba(59,15,115,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.15)"
                    : "0 4px 14px -4px rgba(17,24,39,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                  border: m.active
                    ? "1px solid rgba(255,255,255,0.22)"
                    : "1px solid #F3F4F6",
                  position:"relative", overflow:"hidden", textAlign:"center",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  minHeight: m.active ? 200 : 140,
                  WebkitTapHighlightColor:"transparent",
                }}>
                {m.active && (
                  <>
                    {/* top sheen */}
                    <div aria-hidden style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:"linear-gradient(180deg, rgba(255,255,255,0.18), transparent)",pointerEvents:"none"}}/>
                    {/* corner glow */}
                    <div aria-hidden style={{position:"absolute",top:-50,right:-50,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,255,255,0.32),rgba(255,255,255,0) 70%)",pointerEvents:"none",animation:"tnlHomeCardGlow 5s ease-in-out infinite"}}/>
                    {/* bottom highlight line */}
                    <div aria-hidden style={{position:"absolute",left:14,right:14,bottom:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)",pointerEvents:"none"}}/>
                    {/* badge ativo */}
                    <div style={{
                      position:"absolute",top:12,right:12,
                      background:"linear-gradient(180deg,#FFFFFF,#EDE4FF)",
                      color:"#4C1D95",fontSize:10,fontWeight:900,padding:"5px 12px",
                      borderRadius:180,textTransform:"uppercase",letterSpacing:"0.12em",
                      boxShadow:"0 10px 22px -6px rgba(0,0,0,0.4), 0 4px 10px -3px rgba(76,29,149,0.45), inset 0 1px 0 rgba(255,255,255,0.95)",
                      display:"inline-flex",alignItems:"center",gap:6,
                      border:"1px solid rgba(255,255,255,0.6)",
                    }}>
                      <span aria-hidden style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",boxShadow:"0 0 10px rgba(34,197,94,0.95)"}}/>
                      Ativo
                    </div>
                  </>
                )}
                {inactive && (
                  <>
                    {/* subtle decorative dotted ring */}
                    <div aria-hidden style={{position:"absolute",top:-40,right:-40,width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.06),transparent 70%)",pointerEvents:"none"}}/>
                    <div style={{
                      position:"absolute",top:11,right:11,
                      background:"#F3F4F6",
                      color:"#9CA3AF",fontSize:9,fontWeight:800,padding:"3.5px 10px",
                      borderRadius:180,textTransform:"uppercase",letterSpacing:"0.1em",
                      border:"1px solid #E5E7EB",
                    }}>Em breve</div>
                  </>
                )}
                <div style={{filter:inactive?"grayscale(1)":"none",opacity:inactive?0.35:1,transition:"filter 200ms ease, opacity 200ms ease",position:"relative",zIndex:1}}>
                  <ModuleIcon type={m.iconType} size={m.active?72:68} active={m.active} />
                </div>
                <div style={{position:"relative",zIndex:1,fontWeight:900,fontSize:m.active?16.5:13,color:m.active?"#FFFFFF":"#4B5563",marginTop:6,letterSpacing:"-0.015em",textShadow:m.active?"0 2px 10px rgba(30,10,80,0.4)":"none"}}>{m.name}</div>
                <div style={{position:"relative",zIndex:1,fontSize:12,color:m.active?"rgba(255,255,255,0.88)":"#9CA3AF",marginTop:4,fontWeight:500,letterSpacing:"0.005em"}}>{m.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
