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

const OCR_CTX = {
  farmacia:   { title: "📋 Importar receita ou lista de farmácia",    hint: "Selecione uma foto, imagem ou PDF da receita médica ou lista impressa. A IA extrai os medicamentos e quantidades automaticamente." },
  escolar:    { title: "📄 Importar lista de material escolar",        hint: "Selecione uma foto, imagem ou PDF com a lista de materiais. A IA extrai os itens preservando especificações." },
  construcao: { title: "📐 Importar lista de materiais",              hint: "Selecione uma foto, imagem ou PDF da lista. A IA extrai os itens com suas especificações técnicas." },
  eletrico:   { title: "⚡ Importar lista de materiais elétricos",    hint: "Selecione uma foto, imagem ou PDF da lista. A IA extrai os itens preservando bitola e especificações." },
};

export default function PhotoModal({
  open,
  listType,
  ocrLoading,
  ocrProgress,
  ocrFileName,
  ocrText,
  setOcrText,
  onClose,
  onFileChange,
  onImport,
}) {
  if (!open) return null;

  const ctx = OCR_CTX[listType] || {
    title: "📷 Importar lista",
    hint: "Tire uma foto, selecione uma imagem ou importe um PDF. A IA vai interpretar e montar os itens automaticamente.",
  };

  return (
    <ModalSheet onClose={() => !ocrLoading && onClose()}>
      <style>{`
        @keyframes tnlPhotoShine {
          0% { transform: translateX(-120%); }
          60% { transform: translateX(140%); }
          100% { transform: translateX(140%); }
        }
        @keyframes tnlPhotoProgress {
          0% { background-position: 0 0; }
          100% { background-position: 32px 0; }
        }
        @keyframes tnlPhotoPulse {
          0%, 100% { box-shadow: 0 14px 34px -10px rgba(22,163,74,0.55), inset 0 1px 0 rgba(255,255,255,0.30); }
          50% { box-shadow: 0 18px 40px -8px rgba(22,163,74,0.70), inset 0 1px 0 rgba(255,255,255,0.30); }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <div
          style={{
            fontWeight: 900,
            fontSize: 18,
            color: "#111827",
            marginBottom: 6,
            letterSpacing: "-0.025em",
            lineHeight: 1.25,
            background: "linear-gradient(135deg, #0F172A 0%, #4C1D95 55%, #7C3AED 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {ctx.title}
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16, lineHeight: 1.5 }}>
          {ctx.hint}
        </div>

        <label
          style={{
            ...btnG,
            background: "linear-gradient(135deg, #15803D 0%, #16A34A 45%, #22C55E 100%)",
            border: "1px solid rgba(255,255,255,0.20)",
            boxShadow:
              "0 14px 34px -10px rgba(22,163,74,0.55), 0 6px 14px -6px rgba(34,197,94,0.40), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.10)",
            cursor: ocrLoading ? "not-allowed" : "pointer",
            opacity: ocrLoading ? 0.7 : 1,
            marginBottom: 12,
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
                "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)",
              transform: "translateX(-120%)",
              animation: ocrLoading ? "none" : "tnlPhotoShine 3s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8 }}>
            📎 Foto, imagem ou PDF
          </span>
          <input
            type="file"
            accept="image/*,application/pdf,.pdf"
            onChange={onFileChange}
            disabled={ocrLoading}
            style={{ display: "none" }}
          />
        </label>

        {ocrFileName && (
          <div
            style={{
              fontSize: 12,
              color: "#5B21B6",
              marginBottom: 10,
              padding: "8px 12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
              border: "1px solid rgba(167,139,250,0.30)",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden>📄</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ocrFileName}</span>
          </div>
        )}

        {ocrLoading && (
          <div
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)",
              border: "1px solid rgba(167,139,250,0.25)",
              borderRadius: 18,
              padding: 16,
              marginBottom: 12,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px -4px rgba(100,80,200,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 10,
                letterSpacing: "-0.01em",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(22,163,74,0.25)",
                    borderTopColor: "#16A34A",
                    animation: "tnl-spin 0.8s linear infinite",
                  }}
                />
                Lendo documento...
              </span>
              <span
                style={{
                  background: "linear-gradient(135deg, #16A34A, #22C55E)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                {ocrProgress}%
              </span>
            </div>
            <div
              style={{
                height: 10,
                background: "#EEF2F7",
                borderRadius: 999,
                overflow: "hidden",
                boxShadow: "inset 0 1px 2px rgba(15,23,42,0.10)",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${ocrProgress}%`,
                  background:
                    "linear-gradient(90deg, #15803D 0%, #16A34A 50%, #22C55E 100%), repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.18) 8px 16px)",
                  backgroundBlendMode: "overlay",
                  backgroundSize: "100% 100%, 32px 32px",
                  borderRadius: 999,
                  transition: "width 280ms cubic-bezier(0.22,1,0.36,1)",
                  boxShadow: "0 0 12px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.4)",
                  animation: "tnlPhotoProgress 1.2s linear infinite",
                  position: "relative",
                }}
              />
            </div>
            <style>{`@keyframes tnl-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <textarea
          value={ocrText}
          onChange={(e) => setOcrText(e.target.value)}
          placeholder={
            ocrLoading
              ? "Aguarde a leitura do documento..."
              : "Os itens reconhecidos aparecerão aqui para revisão antes de importar."
          }
          style={{
            width: "100%",
            padding: "14px 18px",
            border: "2px solid #E0D9FF",
            borderRadius: 20,
            fontSize: 15,
            color: "#111827",
            outline: "none",
            fontFamily: "inherit",
            background: "linear-gradient(180deg, #FFFFFF 0%, #FDFBFF 60%, #F8F4FF 100%)",
            boxSizing: "border-box",
            height: 190,
            resize: "none",
            marginBottom: 14,
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
          onClick={onImport}
          disabled={!ocrText.trim() || ocrLoading}
          style={{
            ...btnG,
            opacity: ocrText.trim() && !ocrLoading ? 1 : 0.5,
            cursor: ocrText.trim() && !ocrLoading ? "pointer" : "not-allowed",
            background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 40%, #8B5CF6 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow:
              ocrText.trim() && !ocrLoading
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
              transform: "translateX(-120%)",
              animation:
                ocrText.trim() && !ocrLoading
                  ? "tnlPhotoShine 2.8s ease-in-out infinite"
                  : "none",
              pointerEvents: "none",
            }}
          />
          <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 8 }}>
            ✅ Transformar em itens da lista
          </span>
        </button>
      </div>
    </ModalSheet>
  );
}
