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

  const topPosition = step.position === "top";

  const primaryLabel = isLast ? "Fechar" : "Próximo";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 620,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(17,24,39,0.68)",
          backdropFilter: "blur(4px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          [topPosition ? "top" : "bottom"]: topPosition ? 92 : 96,
          margin: "0 auto",
          maxWidth: 390,
          background: "#FFFFFF",
          borderRadius: 26,
          padding: 20,
          boxShadow: "0 28px 80px rgba(17,24,39,0.30)",
          border: "1px solid #DDE6FE",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              background: "#EEF4FF",
            }}
          >
            {step.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 950,
                color: "#6D28D9",
                textTransform: "uppercase",
              }}
            >
              Passo {index + 1} de {total}
            </div>

            <div
              style={{
                fontSize: 19,
                fontWeight: 950,
                color: "#111827",
                lineHeight: 1.12,
                marginTop: 2,
              }}
            >
              {step.title}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#6B7280",
                fontWeight: 700,
                lineHeight: 1.45,
                marginTop: 6,
              }}
            >
              {step.text}
            </div>
          </div>
        </div>

        <div
          style={{
            height: 7,
            background: "#F3F4F6",
            borderRadius: 999,
            overflow: "hidden",
            margin: "10px 0 18px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((index + 1) / Math.max(total, 1)) * 100}%`,
              background: "linear-gradient(90deg,#7C3AED,#2563EB)",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              showPrev && index > 0 ? "1fr 1.4fr" : "1fr",
            gap: 10,
          }}
        >
          {showPrev && index > 0 && (
            <button
              onClick={onPrev}
              style={{
                border: "2px solid #E5E7EB",
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "14px 18px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Voltar
            </button>
          )}

          <button
            onClick={isLast ? onClose : onNext}
            style={{
              border: "none",
              background:
                "linear-gradient(135deg,#7C3AED 0%,#2563EB 100%)",
              color: "#FFFFFF",
              borderRadius: 16,
              padding: "14px 18px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 16px 40px rgba(37,99,235,0.30)",
            }}
          >
            {primaryLabel}
          </button>
        </div>

        {showSkip && !isLast && (
          <button
            onClick={onSkip || onClose}
            style={{
              marginTop: 10,
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#6B7280",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Pular tutorial
          </button>
        )}
      </div>
    </div>
  );
}
