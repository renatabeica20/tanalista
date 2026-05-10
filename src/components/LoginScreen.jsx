import AppLogo from "./AppLogo";
import { useState } from "react";

/**
 * LoginScreen — visual premium (glassmorphism + gradiente lilás).
 * Mantém TODAS as props, lógica e comportamentos originais.
 */
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
  const [focusField, setFocusField] = useState(null);

  const fieldWrap = {
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(167,139,250,0.35)",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    transition: "border-color 200ms ease, box-shadow 200ms ease, background 200ms ease",
  };
  const label = {
    display: "block",
    fontSize: 11,
    fontWeight: 800,
    color: "#6D28D9",
    marginBottom: 8,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };
  const inputBase = (focused) => ({
    width: "100%",
    boxSizing: "border-box",
    border: `1.5px solid ${focused ? "#7C3AED" : "#DDD6FE"}`,
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 16,
    fontWeight: 700,
    color: "#0F172A",
    outline: "none",
    fontFamily: "inherit",
    background: "#FFFFFF",
    touchAction: "manipulation",
    boxShadow: focused
      ? "0 0 0 4px rgba(124,58,237,0.18), 0 6px 18px -8px rgba(124,58,237,0.35)"
      : "0 1px 2px rgba(17,24,39,0.04)",
    transition: "border-color 180ms ease, box-shadow 220ms ease",
  });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        minWidth: 0,
        margin: "0 auto",
        minHeight: "100dvh",
        background:
          "linear-gradient(160deg,#1E1B4B 0%,#4C1D95 32%,#6D28D9 62%,#8B5CF6 100%)",
        fontFamily:
          "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
        position: "relative",
        overflowX: "clip",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:
          "max(18px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-left)) max(18px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right))",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        isolation: "isolate",
      }}
    >
      {/* Esferas decorativas */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-12%",
          left: "-18%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.55), rgba(167,139,250,0) 65%)",
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "10%",
          right: "-20%",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.35), rgba(236,72,153,0) 70%)",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "20%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.30), rgba(59,130,246,0) 70%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      {/* Card glass */}
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          borderRadius: 28,
          padding: 24,
          boxShadow:
            "0 30px 80px -20px rgba(76,29,149,0.55), 0 8px 30px -10px rgba(17,24,39,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.55)",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div
              style={{
                padding: 6,
                borderRadius: 22,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(237,233,254,0.85))",
                boxShadow:
                  "0 12px 30px -10px rgba(109,40,217,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <AppLogo size={58} radius={18} />
            </div>
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 22,
              color: "#1E1B4B",
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            {sharedLandingRecord
              ? "Identifique-se para acessar a lista"
              : "Bem-vindo ao Tá na Lista"}
          </div>
          <div style={{ fontSize: 13, color: "#5B21B6", lineHeight: 1.5, fontWeight: 500 }}>
            {sharedLandingRecord
              ? "Informe seu nome e PIN para abrir a lista recebida com segurança."
              : "Informe seu nome e PIN para acessar suas listas com segurança."}
          </div>
        </div>

        <div
          style={{
            ...fieldWrap,
            borderColor:
              focusField === "name" ? "rgba(124,58,237,0.55)" : "rgba(167,139,250,0.35)",
            boxShadow:
              focusField === "name" ? "0 0 0 4px rgba(124,58,237,0.10)" : "none",
          }}
        >
          <label style={label}>Como podemos te chamar?</label>
          <input
            value={userNameInput}
            onChange={(e) => setUserNameInput(e.target.value)}
            placeholder="Ex: Cadu"
            autoFocus
            onFocus={() => setFocusField("name")}
            onBlur={() => setFocusField(null)}
            style={inputBase(focusField === "name")}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAuthForm();
            }}
          />
        </div>

        <div
          style={{
            ...fieldWrap,
            borderColor:
              focusField === "pin" ? "rgba(124,58,237,0.55)" : "rgba(167,139,250,0.35)",
            boxShadow:
              focusField === "pin" ? "0 0 0 4px rgba(124,58,237,0.10)" : "none",
          }}
        >
          <label style={label}>{isRecoverPinMode ? "Novo PIN" : "PIN de acesso"}</label>
          <input
            value={userPinInput}
            onChange={(e) => setUserPinInput(normalizePin(e.target.value))}
            placeholder="4 a 6 dígitos"
            inputMode="numeric"
            type="password"
            autoComplete="current-password"
            onFocus={() => setFocusField("pin")}
            onBlur={() => setFocusField(null)}
            style={{ ...inputBase(focusField === "pin"), fontWeight: 900, letterSpacing: "3px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAuthForm();
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: "#6D28D9",
              fontWeight: 600,
              marginTop: 8,
              lineHeight: 1.4,
            }}
          >
            {authCheckingName
              ? "Verificando cadastro..."
              : isRecoverPinMode
                ? "Informe e confirme seu novo PIN para recuperar o acesso neste aparelho."
                : isFirstAccessMode
                  ? "Primeiro acesso identificado. Confirme o PIN abaixo para criar seu acesso."
                  : "Acesso rápido: informe seu PIN e toque em Entrar."}
          </div>
        </div>

        {(isFirstAccessMode || isRecoverPinMode) && (
          <div
            style={{
              ...fieldWrap,
              borderColor:
                focusField === "pin2" ? "rgba(124,58,237,0.55)" : "rgba(167,139,250,0.35)",
              boxShadow:
                focusField === "pin2" ? "0 0 0 4px rgba(124,58,237,0.10)" : "none",
            }}
          >
            <label style={label}>
              {isRecoverPinMode ? "Confirmar novo PIN" : "Confirmar PIN"}
            </label>
            <input
              value={userPinConfirmInput}
              onChange={(e) => setUserPinConfirmInput(normalizePin(e.target.value))}
              placeholder="Repita o PIN"
              inputMode="numeric"
              type="password"
              autoComplete="new-password"
              onFocus={() => setFocusField("pin2")}
              onBlur={() => setFocusField(null)}
              style={{ ...inputBase(focusField === "pin2"), fontWeight: 900, letterSpacing: "3px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAuthForm();
              }}
            />
          </div>
        )}

        <button
          onClick={submitAuthForm}
          disabled={loading || authCheckingName}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 18,
            background:
              loading || authCheckingName
                ? "linear-gradient(135deg,#A78BFA,#C4B5FD)"
                : "linear-gradient(135deg,#4C1D95 0%,#6D28D9 45%,#8B5CF6 100%)",
            border: "none",
            color: "white",
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: "0.01em",
            cursor: loading || authCheckingName ? "wait" : "pointer",
            fontFamily: "inherit",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            boxShadow:
              "0 18px 40px -12px rgba(109,40,217,0.65), 0 4px 12px -4px rgba(76,29,149,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
            transition: "transform 140ms ease, box-shadow 220ms ease, opacity 200ms ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {loading
            ? isRecoverPinMode
              ? "Redefinindo..."
              : "Validando..."
            : authCheckingName
              ? "Verificando..."
              : isRecoverPinMode
                ? "Redefinir PIN"
                : isFirstAccessMode
                  ? "Criar acesso"
                  : "Entrar"}
        </button>

        {!isFirstAccessMode && (
          <button
            onClick={() => {
              setIsRecoverPinMode((v) => !v);
              setUserPinInput("");
              setUserPinConfirmInput("");
            }}
            disabled={loading || authCheckingName}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 14,
              background: "transparent",
              border: "none",
              color: "#6D28D9",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: loading || authCheckingName ? "wait" : "pointer",
              fontFamily: "inherit",
              marginTop: 10,
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              opacity: 0.85,
              textDecoration: "underline",
              textDecorationColor: "rgba(109,40,217,0.35)",
              textUnderlineOffset: 3,
            }}
          >
            {isRecoverPinMode ? "Voltar para entrar com PIN" : "Esqueci meu PIN"}
          </button>
        )}
      </div>
    </div>
  );
}
