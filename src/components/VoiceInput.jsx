export default function VoiceInput({
  target = "list",
  voiceTargetRef,
  setVoiceTarget,
  startVoiceInput,
  voiceProcessing = false,
  voiceListening = false,
  baseStyle = {},
  extraStyle = {},
  listeningLabel = "Parar fala",
  processingLabel = "Organizando...",
  idleLabel = "Falar lista",
}) {
  const handleClick = () => {
    if (voiceTargetRef) voiceTargetRef.current = target;
    if (setVoiceTarget) setVoiceTarget(target);
    if (startVoiceInput) startVoiceInput();
  };

  const isListening = !!voiceListening;
  const isProcessing = !!voiceProcessing;
  const isIdle = !isListening && !isProcessing;

  const bg = isListening
    ? "linear-gradient(135deg,#FEE2E2 0%,#FECACA 60%,#FCA5A5 100%)"
    : isProcessing
    ? "linear-gradient(135deg,#EDE9FE 0%,#DDD6FE 60%,#C4B5FD 100%)"
    : "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 55%,#DDD6FE 100%)";

  const borderColor = isListening
    ? "rgba(239,68,68,0.55)"
    : isProcessing
    ? "rgba(139,92,246,0.55)"
    : "rgba(167,139,250,0.45)";

  const color = isListening ? "#991B1B" : isProcessing ? "#5B21B6" : "#4C1D95";

  const shadow = isListening
    ? "0 12px 28px -10px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.7)"
    : "0 12px 28px -10px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.85)";

  const label = isListening ? listeningLabel : isProcessing ? processingLabel : idleLabel;

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontWeight: 800,
        letterSpacing: "-0.005em",
        borderRadius: 16,
        border: `1.5px solid ${borderColor}`,
        boxShadow: shadow,
        transition: "transform .15s ease, box-shadow .2s ease, background .2s ease",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        fontFamily: "inherit",
        overflow: "hidden",
        ...baseStyle,
        background: bg,
        borderColor,
        color,
        cursor: isProcessing ? "wait" : "pointer",
        opacity: isProcessing ? 0.92 : 1,
        animation: isListening ? "tnl-voice-pulse 1.6s ease-in-out infinite" : undefined,
        ...extraStyle,
      }}
      onMouseDown={(e) => !isProcessing && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onTouchStart={(e) => !isProcessing && (e.currentTarget.style.transform = "scale(0.97)")}
      onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <style>{`
        @keyframes tnl-voice-pulse {
          0%,100% { box-shadow: 0 12px 28px -10px rgba(220,38,38,0.45), 0 0 0 0 rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.7); }
          50% { box-shadow: 0 12px 28px -10px rgba(220,38,38,0.55), 0 0 0 10px rgba(239,68,68,0), inset 0 1px 0 rgba(255,255,255,0.7); }
        }
        @keyframes tnl-voice-spin { to { transform: rotate(360deg); } }
        @keyframes tnl-voice-wave {
          0%,100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      {isListening && (
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            height: 14,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: 3,
                height: 14,
                borderRadius: 2,
                background: "linear-gradient(180deg,#EF4444,#B91C1C)",
                transformOrigin: "center",
                animation: `tnl-voice-wave 0.9s ease-in-out ${i * 0.12}s infinite`,
              }}
            />
          ))}
        </span>
      )}

      {isProcessing && (
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid rgba(124,58,237,0.25)",
            borderTopColor: "#7C3AED",
            animation: "tnl-voice-spin 0.7s linear infinite",
          }}
        />
      )}

      {isIdle && (
        <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>
          🎤
        </span>
      )}

      <span style={{ fontVariantNumeric: "tabular-nums" }}>{label}</span>
    </button>
  );
}
