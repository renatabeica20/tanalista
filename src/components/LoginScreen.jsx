import { useMemo } from "react";
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
  const showConfirmPin = useMemo(() => {
    return Boolean(isFirstAccessMode || isRecoverPinMode);
  }, [isFirstAccessMode, isRecoverPinMode]);

  const helperText = useMemo(() => {
    if (authCheckingName) {
      return "Verificando cadastro...";
    }

    if (isRecoverPinMode) {
      return "Informe e confirme seu novo PIN para recuperar o acesso neste aparelho.";
    }

    if (isFirstAccessMode) {
      return "Nome não encontrado. Crie um PIN e confirme abaixo para finalizar seu cadastro.";
    }

    return "Cadastro encontrado. Informe seu PIN para entrar.";
  }, [authCheckingName, isRecoverPinMode, isFirstAccessMode]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        minWidth: 0,
        margin: "0 auto",
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg,#EEF2FF 0%,#FFFFFF 58%,#F8FAFC 100%)",
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 10%,rgba(139,92,246,0.16),transparent 34%),radial-gradient(circle at 92% 0%,rgba(34,197,94,0.12),transparent 28%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 390,
          background: "#FFFFFF",
          borderRadius: 28,
          padding: 22,
          boxShadow: "0 24px 70px rgba(17,24,39,0.14)",
          border: "1px solid rgba(229,231,235,0.95)",
          position: "relative",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
}
