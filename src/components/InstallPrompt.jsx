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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.58)",
        zIndex: 610,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          background: "#FFFFFF",
          borderRadius: 28,
          padding: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <AppLogo size={52} radius={16} />

          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 950,
                color: "#111827",
                lineHeight: 1.1,
              }}
            >
              Adicione à tela inicial
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              Use o app como aplicativo instalado no celular.
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg,#F5F3FF,#ECFDF5)",
            border: "1px solid #DDE6FE",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: "#4C1D95",
              marginBottom: 6,
            }}
          >
            {isIOS
              ? "📱 No iPhone"
              : isAndroid
              ? "🤖 No Android"
              : "💻 No navegador"}
          </div>

          {isIOS && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#7C3AED",
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
              paddingLeft: 20,
              color: "#374151",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {steps.map((step, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: idx === steps.length - 1 ? 0 : 8,
                }}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#6B7280",
            fontWeight: 700,
            lineHeight: 1.45,
            marginTop: 14,
            marginBottom: 14,
          }}
        >
          ⚡ Leva menos de 10 segundos.
        </div>

        <button
          onClick={installApp}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 18,
            padding: "14px 18px",
            fontWeight: 900,
            cursor: "pointer",
            background:
              "linear-gradient(135deg,#7C3AED 0%,#2563EB 100%)",
            color: "#FFFFFF",
          }}
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
            border: "none",
            background: "transparent",
            padding: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Adicionar depois
        </button>

        <button
          onClick={() => closeInstallNotice(true)}
          style={{
            width: "100%",
            marginTop: 8,
            border: "none",
            background: "transparent",
            padding: 10,
            color: "#6B7280",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Não mostrar novamente
        </button>
      </div>
    </div>
  );
}
