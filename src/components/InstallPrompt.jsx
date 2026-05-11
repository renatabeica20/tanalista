export default function InstallPrompt({
  show,
  isStandalone,
  getInstallPlatform,
  installApp,
  installAvailable,
  closeInstallNotice,
  AppLogo,
}) {
  if (!show || isStandalone) return null;

  const platform = getInstallPlatform();
  const isIOS = platform === "ios";
  const isAndroid = platform === "android";

  const steps = isIOS
    ? [
        "Abra este app pelo navegador do iPhone.",
        "Toque nos três pontos (...) do navegador.",
        "Escolha “Adicionar à Tela Inicial”.",
      ]
    : isAndroid
    ? [
        "Abra este app pelo Google Chrome.",
        "Toque nos três pontinhos (⋮) no canto superior.",
        "Escolha “Instalar app” ou “Adicionar à tela inicial”.",
      ]
    : [
        "Abra o menu do navegador.",
        "Escolha “Instalar app” ou “Adicionar à tela inicial”.",
      ];

  const platformLabel = isIOS
    ? "📱 No iPhone"
    : isAndroid
    ? "🤖 No Android"
    : "💻 No navegador";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 610,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background:
          "radial-gradient(120% 80% at 50% 100%, rgba(76,29,149,0.45) 0%, rgba(17,24,39,0.60) 60%, rgba(15,23,42,0.65) 100%)",
        backdropFilter: "blur(10px) saturate(140%)",
        WebkitBackdropFilter: "blur(10px) saturate(140%)",
        animation: "tnl-inst-fade 220ms ease-out",
      }}
    >
      <style>{`
        @keyframes tnl-inst-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tnl-inst-pop {
          from { transform: translateY(16px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 400,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background:
            "linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 60%,#F8F4FF 100%)",
          borderRadius: 28,
          padding: "22px 20px 18px",
          boxShadow:
            "0 30px 80px -12px rgba(76,29,149,0.45), 0 12px 28px -10px rgba(17,24,39,0.28), inset 0 1px 0 rgba(255,255,255,0.95)",
          border: "1px solid rgba(167,139,250,0.32)",
          animation: "tnl-inst-pop 320ms cubic-bezier(0.22,1,0.36,1)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* decorative glows */}
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: -60,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167,139,250,0.28) 0%, rgba(167,139,250,0) 70%)",
            filter: "blur(6px)",
          }}
        />
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            bottom: -70,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.20) 0%, rgba(124,58,237,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: 3,
              borderRadius: 19,
              background:
                "linear-gradient(135deg,#4C1D95 0%,#7C3AED 50%,#9F67FA 100%)",
              boxShadow:
                "0 12px 26px -10px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
              flexShrink: 0,
            }}
          >
            <AppLogo size={52} radius={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: "-0.015em",
                background:
                  "linear-gradient(135deg,#1F2937 0%,#4C1D95 65%,#6D28D9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Adicione à tela inicial
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#6B7280",
                marginTop: 4,
                lineHeight: 1.45,
              }}
            >
              Use o app como aplicativo instalado no celular.
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 55%,#F3E8FF 100%)",
            border: "1px solid rgba(167,139,250,0.40)",
            borderRadius: 20,
            padding: 16,
            boxShadow:
              "0 8px 22px -10px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.85)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 900,
              color: "#4C1D95",
              padding: "5px 11px",
              borderRadius: 999,
              background:
                "linear-gradient(180deg,#FFFFFF 0%,#F8F4FF 100%)",
              border: "1px solid rgba(167,139,250,0.45)",
              letterSpacing: "0.02em",
              marginBottom: 10,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            {platformLabel}
          </div>
          {isIOS && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#6D28D9",
                marginBottom: 10,
                lineHeight: 1.45,
              }}
            >
              Funciona melhor pelo Safari.
            </div>
          )}
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {steps.map((step, idx) => (
              <li
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#374151",
                  lineHeight: 1.45,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    background:
                      "linear-gradient(135deg,#6D28D9 0%,#8B5CF6 100%)",
                    boxShadow:
                      "0 4px 10px -2px rgba(124,58,237,0.50), inset 0 1px 0 rgba(255,255,255,0.35)",
                    marginTop: 1,
                  }}
                >
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div
          style={{
            fontSize: 12.5,
            color: "#6B7280",
            fontWeight: 700,
            lineHeight: 1.45,
            marginTop: 14,
            marginBottom: 14,
            textAlign: "center",
          }}
        >
          ⚡ Leva menos de 10 segundos.
        </div>

        <button
          onClick={installApp}
          style={{
            position: "relative",
            width: "100%",
            minHeight: 54,
            border: "none",
            borderRadius: 18,
            padding: "14px 18px",
            fontWeight: 900,
            fontSize: 15,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "-0.005em",
            background:
              "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
            color: "#FFFFFF",
            boxShadow:
              "0 16px 32px -8px rgba(76,29,149,0.55), 0 6px 14px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.35)",
            transition: "transform .15s ease, box-shadow .2s ease",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {installAvailable
            ? "📲 Instalar agora"
            : "📲 Adicionar à tela inicial"}
        </button>

        <button
          onClick={() => closeInstallNotice(false)}
          style={{
            width: "100%",
            marginTop: 10,
            minHeight: 46,
            border: "1.5px solid rgba(167,139,250,0.40)",
            background:
              "linear-gradient(180deg,#FFFFFF 0%,#F8F7FF 100%)",
            padding: "12px 16px",
            borderRadius: 16,
            fontWeight: 800,
            fontSize: 14,
            color: "#4C1D95",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "-0.005em",
            boxShadow:
              "0 2px 6px rgba(76,29,149,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            transition: "transform .15s ease",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Adicionar depois
        </button>

        <button
          onClick={() => closeInstallNotice(true)}
          style={{
            width: "100%",
            marginTop: 6,
            border: "none",
            background: "transparent",
            padding: "10px 12px",
            borderRadius: 12,
            color: "#9CA3AF",
            fontWeight: 700,
            fontSize: 12.5,
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "-0.005em",
            transition: "color .2s ease, background .2s ease",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#6B7280";
            e.currentTarget.style.background = "rgba(167,139,250,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#9CA3AF";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Não mostrar novamente
        </button>
      </div>
    </div>
  );
}
