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

  return (
    <button
      onClick={handleClick}
      disabled={voiceProcessing}
      style={{
        ...baseStyle,
        background: voiceListening ? "#FEF2F2" : "#F0FDF4",
        borderColor: voiceListening ? "#FCA5A5" : "#BBF7D0",
        color: voiceListening ? "#B91C1C" : "#166534",
        cursor: voiceProcessing ? "not-allowed" : "pointer",
        opacity: voiceProcessing ? 0.65 : 1,
        ...extraStyle,
      }}
    >
      {voiceListening ? listeningLabel : voiceProcessing ? processingLabel : idleLabel}
    </button>
  );
}
