export default function FloatingActions({ onAddExtraItem, highlightExtraItem = false }) {
  return (
    <button
      onClick={onAddExtraItem}
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
        border: "none",
        color: "white",
        borderRadius: 180,
        padding: "14px 24px",
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
        boxShadow: "0 6px 24px rgba(124,58,237,0.4)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
        zIndex: highlightExtraItem ? 735 : 200,
        fontFamily: "inherit",
        ...(highlightExtraItem
          ? {
              filter: "brightness(1.18) saturate(1.12)",
              outline: "3px solid rgba(255,255,255,0.98)",
              outlineOffset: 3,
              boxShadow:
                "0 0 0 6px rgba(255,255,255,0.98), 0 0 0 14px rgba(124,58,237,0.58), 0 30px 72px rgba(76,29,149,0.52)",
            }
          : {}),
      }}
    >
      ＋ Adicionar item extra
    </button>
  );
}
