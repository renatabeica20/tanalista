import ModalSheet from "./ModalSheet";

const btnG = {
  width: "100%",
  padding: 16,
  borderRadius: 18,
  background: "linear-gradient(135deg, #6D28D9, #8B5CF6)",
  border: "none",
  color: "white",
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export default function PasteModal({
  open,
  onClose,
  pasteText,
  setPasteText,
  parsePastedText,
  placeholder,
}) {
  if (!open) return null;

  return (
    <ModalSheet onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #7C3AED, #9F67FA)",
              boxShadow: "0 6px 16px -6px rgba(124,58,237,0.45)",
              fontSize: 16,
            }}
          >
            📋
          </span>
          <div
            style={{
              fontWeight: 900,
              fontSize: 18,
              color: "#111827",
              letterSpacing: "-0.025em",
              lineHeight: 1.25,
              background: "linear-gradient(135deg, #0F172A 0%, #4C1D95 55%, #7C3AED 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Colar lista de texto
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 1.5,
            paddingLeft: 38,
          }}
        >
          Cole sua lista — uma linha por item:
        </div>

        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "14px 18px",
            border: "2px solid #E0D9FF",
            borderRadius: 20,
            fontSize: 15,
            color: "#111827",
            outline: "none",
            fontFamily: "inherit",
            background:
              "linear-gradient(180deg, #FFFFFF 0%, #FDFBFF 60%, #F8F4FF 100%)",
            boxSizing: "border-box",
            height: 200,
            resize: "none",
            marginBottom: 16,
            boxShadow:
              "inset 0 1px 2px rgba(100,80,200,0.06), 0 2px 8px rgba(100,80,200,0.05)",
            transition: "border-color 220ms ease, box-shadow 220ms ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#A78BFA";
            e.target.style.boxShadow =
              "inset 0 1px 2px rgba(100,80,200,0.06), 0 0 0 4px rgba(167,139,250,0.18)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E0D9FF";
            e.target.style.boxShadow =
              "inset 0 1px 2px rgba(100,80,200,0.06), 0 2px 8px rgba(100,80,200,0.05)";
          }}
        />

        <button
          onClick={parsePastedText}
          disabled={!pasteText.trim()}
          style={{
            ...btnG,
            opacity: pasteText.trim() ? 1 : 0.5,
            cursor: pasteText.trim() ? "pointer" : "not-allowed",
            background:
              "linear-gradient(135deg, #4C1D95 0%, #6D28D9 40%, #8B5CF6 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: pasteText.trim()
              ? "0 18px 36px -10px rgba(76,29,149,0.55), 0 8px 18px -6px rgba(124,58,237,0.40), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.10)"
              : "none",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
              transform: "translateX(-100%)",
              animation: "pasteBtnShine 2.6s ease-in-out infinite",
            }}
          />
          <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8 }}>
            ✅ Importar itens
          </span>
        </button>
      </div>

      <style>{`
        @keyframes pasteBtnShine {
          0% { transform: translateX(-100%); }
          60% { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </ModalSheet>
  );
}
