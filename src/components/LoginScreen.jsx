import AppLogo from "./AppLogo";

export default function LoginScreen({
  sharedLandingRecord,
  userNameInput,
  setUserNameInput,
  userPinInput,
  setUserPinInput,
  userPinConfirmInput,
  setUserPinConfirmInput,
  normalizePin,
  submitAuthForm,
  authCheckingName,
  isRecoverPinMode,
  setIsRecoverPinMode,
  isFirstAccessMode,
  loading,
  toast,
}) {
  return (
    <div style={{width:"100%",maxWidth:430,minWidth:0,margin:"0 auto",minHeight:"100dvh",background:"linear-gradient(180deg,#EEF2FF 0%,#FFFFFF 58%,#F8FAFC 100%)",fontFamily:"Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",position:"relative",overflowX:"clip",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:"max(18px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-left)) max(18px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right))",touchAction:"manipulation",WebkitTapHighlightColor:"transparent",isolation:"isolate"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 10%,rgba(139,92,246,0.16),transparent 34%),radial-gradient(circle at 92% 0%,rgba(34,197,94,0.12),transparent 28%)",pointerEvents:"none"}} />
      <div style={{width:"100%",maxWidth:390,background:"#FFFFFF",borderRadius:28,padding:22,boxShadow:"0 24px 70px rgba(17,24,39,0.14)",border:"1px solid rgba(229,231,235,0.95)",position:"relative",zIndex:1,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><AppLogo size={58} radius={18} /></div>
          <div style={{fontWeight:900,fontSize:20,color:"#111827",marginBottom:6}}>{sharedLandingRecord?"Identifique-se para acessar a lista":"Bem-vindo ao Tá na Lista"}</div>
          <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45}}>{sharedLandingRecord?"Informe seu nome e PIN para abrir a lista recebida com segurança.":"Informe seu nome e PIN para acessar suas listas com segurança."}</div>
        </div>
        <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>Como podemos te chamar?</label>
          <input value={userNameInput} onChange={e=>setUserNameInput(e.target.value)} placeholder="Ex: Cadu" autoFocus
            style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"13px 13px",fontSize:16,fontWeight:800,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",touchAction:"manipulation"}}
            onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
          />
        </div>
        <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>{isRecoverPinMode?"Novo PIN":"PIN de acesso"}</label>
          <input value={userPinInput} onChange={e=>setUserPinInput(normalizePin(e.target.value))} placeholder="4 a 6 dígitos" inputMode="numeric" type="password" autoComplete="current-password"
            style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"13px 13px",fontSize:16,fontWeight:900,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",letterSpacing:"2px",touchAction:"manipulation"}}
            onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
          />
          <div style={{fontSize:11,color:"#6B7280",fontWeight:700,marginTop:7,lineHeight:1.35}}>
            {authCheckingName?"Verificando cadastro...":isRecoverPinMode?"Informe e confirme seu novo PIN para recuperar o acesso neste aparelho.":isFirstAccessMode?"Primeiro acesso identificado. Confirme o PIN abaixo para criar seu acesso.":"Acesso rápido: informe seu PIN e toque em Entrar."}
          </div>
        </div>
        {(isFirstAccessMode||isRecoverPinMode)&&(<div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>{isRecoverPinMode?"Confirmar novo PIN":"Confirmar PIN"}</label>
          <input value={userPinConfirmInput} onChange={e=>setUserPinConfirmInput(normalizePin(e.target.value))} placeholder="Repita o PIN" inputMode="numeric" type="password" autoComplete="new-password"
            style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"13px 13px",fontSize:16,fontWeight:900,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",letterSpacing:"2px",touchAction:"manipulation"}}
            onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
          />
        </div>)}
        <button onClick={submitAuthForm} disabled={loading||authCheckingName}
          style={{width:"100%",padding:16,borderRadius:20,background:(loading||authCheckingName)?"#A78BFA":"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontWeight:900,fontSize:15,cursor:(loading||authCheckingName)?"wait":"pointer",fontFamily:"inherit",touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}>
          {loading?(isRecoverPinMode?"Redefinindo...":"Validando..."):authCheckingName?"Verificando...":isRecoverPinMode?"Redefinir PIN":isFirstAccessMode?"Criar acesso":"Entrar"}
        </button>
        {!isFirstAccessMode&&(<button onClick={()=>{setIsRecoverPinMode(v=>!v);setUserPinInput("");setUserPinConfirmInput("");}} disabled={loading||authCheckingName}
          style={{width:"100%",padding:12,borderRadius:16,background:"transparent",border:"none",color:"#6D28D9",fontWeight:900,fontSize:13,cursor:(loading||authCheckingName)?"wait":"pointer",fontFamily:"inherit",marginTop:8,touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}>
          {isRecoverPinMode?"Voltar para entrar com PIN":"Esqueci meu PIN"}
        </button>)}
      </div>
      <div style={{position:"fixed",bottom:100,left:16,right:16,margin:"0 auto",maxWidth:460,transform:`translateY(${toast.show?0:16}px)`,background:"#111827",color:"white",padding:"14px 18px",borderRadius:18,fontSize:14,fontWeight:600,zIndex:600,opacity:toast.show?1:0,transition:"all 0.3s",whiteSpace:"normal",lineHeight:1.35,textAlign:"center",boxShadow:"0 18px 42px rgba(17,24,39,0.18)",pointerEvents:"none"}}>
        {toast.msg}
      </div>
    </div>
  );
}
