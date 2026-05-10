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
    <div style={{
      width: "100%",
      maxWidth: 430,
      minWidth: 0,
      margin: "0 auto",
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #ede9fe 0%, #f5f0ff 40%, #eef2ff 100%)",
      fontFamily: "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
      position: "relative",
      overflowX: "clip",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "max(18px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-left)) max(18px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right))",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      isolation: "isolate",
    }}>

      {/* Orbes decorativos */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,left:-60,width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.18),transparent 70%)"}} />
        <div style={{position:"absolute",top:40,right:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.14),transparent 70%)"}} />
        <div style={{position:"absolute",bottom:80,left:20,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(34,197,94,0.10),transparent 70%)"}} />
      </div>

      {/* Card principal */}
      <div style={{
        width: "100%",
        maxWidth: 390,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 32,
        padding: 28,
        boxShadow: "0 32px 80px rgba(109,40,217,0.18), 0 2px 12px rgba(109,40,217,0.08)",
        border: "1px solid rgba(167,139,250,0.25)",
        position: "relative",
        zIndex: 1,
        boxSizing: "border-box",
      }}>

        {/* Header */}
        <div style={{textAlign:"center", marginBottom:24}}>
          <div style={{
            display:"inline-flex",
            alignItems:"center",
            justifyContent:"center",
            marginBottom:16,
            padding:4,
            borderRadius:22,
            background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(167,139,250,0.08))",
            boxShadow:"0 0 0 1px rgba(124,58,237,0.12)",
          }}>
            <AppLogo size={58} radius={18} />
          </div>
          <div style={{fontWeight:800, fontSize:22, color:"#1a1a2e", marginBottom:8, letterSpacing:"-0.3px"}}>
            {sharedLandingRecord ? "Identifique-se para acessar a lista" : "Bem-vindo ao Tá na Lista"}
          </div>
          <div style={{fontSize:13.5, color:"#6b7280", lineHeight:1.55, fontWeight:400}}>
            {sharedLandingRecord
              ? "Informe seu nome e PIN para abrir a lista recebida com segurança."
              : "Informe seu nome e PIN para acessar suas listas com segurança."}
          </div>
        </div>

        {/* Campo: nome */}
        <div style={{marginBottom:12}}>
          <label style={{display:"block", fontSize:11.5, fontWeight:700, color:"#7c3aed", marginBottom:6, letterSpacing:"0.4px", textTransform:"uppercase"}}>
            Como podemos te chamar?
          </label>
          <input
            value={userNameInput}
            onChange={e => setUserNameInput(e.target.value)}
            placeholder="Ex: Cadu"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") submitAuthForm(); }}
            style={{
              width:"100%", boxSizing:"border-box",
              border:"1.5px solid #e0d9ff",
              borderRadius:16, padding:"14px 16px",
              fontSize:16, fontWeight:600, color:"#1a1a2e",
              outline:"none", fontFamily:"inherit",
              background:"#fdfcff",
              touchAction:"manipulation",
              transition:"border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor="#7c3aed"; e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.12)"; }}
            onBlur={e => { e.target.style.borderColor="#e0d9ff"; e.target.style.boxShadow="none"; }}
          />
        </div>

        {/* Campo: PIN */}
        <div style={{marginBottom:12}}>
          <label style={{display:"block", fontSize:11.5, fontWeight:700, color:"#7c3aed", marginBottom:6, letterSpacing:"0.4px", textTransform:"uppercase"}}>
            {isRecoverPinMode ? "Novo PIN" : "PIN de acesso"}
          </label>
          <input
            value={userPinInput}
            onChange={e => setUserPinInput(normalizePin(e.target.value))}
            placeholder="4 a 6 dígitos"
            inputMode="numeric"
            type="password"
            autoComplete="current-password"
            onKeyDown={e => { if (e.key === "Enter") submitAuthForm(); }}
            style={{
              width:"100%", boxSizing:"border-box",
              border:"1.5px solid #e0d9ff",
              borderRadius:16, padding:"14px 16px",
              fontSize:16, fontWeight:800, color:"#1a1a2e",
              outline:"none", fontFamily:"inherit",
              background:"#fdfcff",
              letterSpacing:"4px",
              touchAction:"manipulation",
              transition:"border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor="#7c3aed"; e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.12)"; }}
            onBlur={e => { e.target.style.borderColor="#e0d9ff"; e.target.style.boxShadow="none"; }}
          />
          <div style={{fontSize:11.5, color:"#9ca3af", fontWeight:500, marginTop:6, lineHeight:1.4}}>
            {authCheckingName
              ? "Verificando cadastro..."
              : isRecoverPinMode
              ? "Informe e confirme seu novo PIN para recuperar o acesso neste aparelho."
              : isFirstAccessMode
              ? "Primeiro acesso identificado. Confirme o PIN abaixo para criar seu acesso."
              : "Acesso rápido: informe seu PIN e toque em Entrar."}
          </div>
        </div>

        {/* Campo: confirmar PIN */}
        {(isFirstAccessMode || isRecoverPinMode) && (
          <div style={{marginBottom:12}}>
            <label style={{display:"block", fontSize:11.5, fontWeight:700, color:"#7c3aed", marginBottom:6, letterSpacing:"0.4px", textTransform:"uppercase"}}>
              {isRecoverPinMode ? "Confirmar novo PIN" : "Confirmar PIN"}
            </label>
            <input
              value={userPinConfirmInput}
              onChange={e => setUserPinConfirmInput(normalizePin(e.target.value))}
              placeholder="Repita o PIN"
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              onKeyDown={e => { if (e.key === "Enter") submitAuthForm(); }}
              style={{
                width:"100%", boxSizing:"border-box",
                border:"1.5px solid #e0d9ff",
                borderRadius:16, padding:"14px 16px",
                fontSize:16, fontWeight:800, color:"#1a1a2e",
                outline:"none", fontFamily:"inherit",
                background:"#fdfcff",
                letterSpacing:"4px",
                touchAction:"manipulation",
                transition:"border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={e => { e.target.style.borderColor="#7c3aed"; e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.12)"; }}
              onBlur={e => { e.target.style.borderColor="#e0d9ff"; e.target.style.boxShadow="none"; }}
            />
          </div>
        )}

        {/* Botão primário */}
        <button
          onClick={submitAuthForm}
          disabled={loading || authCheckingName}
          style={{
            width:"100%", padding:"16px 24px",
            borderRadius:20,
            background: (loading || authCheckingName)
              ? "linear-gradient(135deg,#a78bfa,#c4b5fd)"
              : "linear-gradient(135deg,#6d28d9,#7c3aed,#9f67fa)",
            border:"none", color:"white",
            fontWeight:800, fontSize:16,
            cursor:(loading || authCheckingName) ? "wait" : "pointer",
            fontFamily:"inherit",
            touchAction:"manipulation",
            WebkitTapHighlightColor:"transparent",
            boxShadow: (loading || authCheckingName) ? "none" : "0 6px 20px rgba(109,40,217,0.40)",
            transition:"all 0.2s",
            letterSpacing:"-0.2px",
            marginTop:8,
          }}
        >
          {loading
            ? (isRecoverPinMode ? "Redefinindo..." : "Validando...")
            : authCheckingName
            ? "Verificando..."
            : isRecoverPinMode
            ? "Redefinir PIN"
            : isFirstAccessMode
            ? "Criar acesso"
            : "Entrar →"}
        </button>

        {/* Link: esqueci PIN */}
        {!isFirstAccessMode && (
          <button
            onClick={() => { setIsRecoverPinMode(v => !v); setUserPinInput(""); setUserPinConfirmInput(""); }}
            disabled={loading || authCheckingName}
            style={{
              width:"100%", padding:"12px 16px",
              borderRadius:16, background:"transparent", border:"none",
              color:"#7c3aed", fontWeight:600, fontSize:13.5,
              cursor:(loading || authCheckingName) ? "wait" : "pointer",
              fontFamily:"inherit", marginTop:8,
              touchAction:"manipulation",
              WebkitTapHighlightColor:"transparent",
              opacity: (loading || authCheckingName) ? 0.5 : 1,
            }}
          >
            {isRecoverPinMode ? "← Voltar para entrar com PIN" : "Esqueci meu PIN"}
          </button>
        )}
      </div>

      {/* Toast */}
      <div style={{
        position:"fixed", bottom:100, left:16, right:16,
        margin:"0 auto", maxWidth:460,
        transform:`translateY(${toast.show ? 0 : 16}px)`,
        background:"#1a1a2e", color:"white",
        padding:"14px 18px", borderRadius:18,
        fontSize:14, fontWeight:600, zIndex:600,
        opacity: toast.show ? 1 : 0,
        transition:"all 0.3s",
        whiteSpace:"normal", lineHeight:1.35,
        textAlign:"center",
        boxShadow:"0 18px 42px rgba(17,24,39,0.22)",
        pointerEvents:"none",
      }}>
        {toast.msg}
      </div>
    </div>
  );
}
