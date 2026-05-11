import ModalSheet from "./ModalSheet";

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle" }}
    >
      <circle cx="16" cy="16" r="15.5" fill="#25D366" />
      <path
        fill="#FFFFFF"
        d="M16.02 6.4c-5.32 0-9.64 4.31-9.64 9.62 0 1.7.45 3.36 1.3 4.82L6.3 25.9l5.17-1.35a9.6 9.6 0 0 0 4.55 1.16h.01c5.31 0 9.63-4.31 9.63-9.62S21.34 6.4 16.02 6.4Zm0 17.68h-.01a7.99 7.99 0 0 1-4.06-1.11l-.29-.17-3.07.8.82-2.99-.19-.31a7.96 7.96 0 0 1-1.22-4.27c0-4.42 3.6-8.01 8.03-8.01a7.98 7.98 0 0 1 5.68 2.35 7.97 7.97 0 0 1 2.35 5.67c0 4.43-3.6 8.04-8.04 8.04Z"
      />
      <path
        fill="#FFFFFF"
        d="M20.42 17.93c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.18-.71-.64-1.19-1.42-1.33-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}

export default function SharedListModal({
  open,
  senderName,
  onClose,
  onSenderNameChange,
  onShareWhatsApp,
}) {
  if (!open) return null;

  return (
    <ModalSheet onClose={onClose}>
      <div style={{ position: "relative" }}>
        {/* decorative glow */}
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: -40,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167,139,250,0.22) 0%, rgba(167,139,250,0) 70%)",
            filter: "blur(6px)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 60%,#DDD6FE 100%)",
              border: "1px solid rgba(167,139,250,0.40)",
              boxShadow:
                "0 12px 26px -10px rgba(124,58,237,0.40), inset 0 1px 0 rgba(255,255,255,0.95)",
              marginBottom: 10,
              fontSize: 28,
            }}
          >
            📤
          </div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: "-0.015em",
              textAlign: "center",
              background:
                "linear-gradient(135deg,#1F2937 0%,#4C1D95 65%,#6D28D9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Compartilhar lista
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#6B7280",
              fontWeight: 600,
              marginTop: 4,
              textAlign: "center",
              lineHeight: 1.45,
            }}
          >
            Envio disponível pelo WhatsApp
          </div>
        </div>

        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 60%,#F8F4FF 100%)",
            border: "1px solid rgba(167,139,250,0.32)",
            borderRadius: 20,
            padding: 14,
            marginBottom: 14,
            boxShadow:
              "0 8px 22px -10px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 900,
              color: "#4C1D95",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            <span>👤</span> Seu nome
          </label>
          <input
            value={senderName}
            onChange={(e) => onSenderNameChange?.(e.target.value)}
            placeholder="Ex: Cadu"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1.5px solid rgba(167,139,250,0.45)",
              borderRadius: 14,
              padding: "13px 14px",
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              outline: "none",
              fontFamily: "inherit",
              background:
                "linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)",
              boxShadow:
                "inset 0 1px 2px rgba(76,29,149,0.06), 0 1px 0 rgba(255,255,255,0.9)",
              transition: "border-color .2s ease, box-shadow .2s ease",
              WebkitTapHighlightColor: "transparent",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(124,58,237,0.65)";
              e.currentTarget.style.boxShadow =
                "0 0 0 4px rgba(124,58,237,0.14), inset 0 1px 2px rgba(76,29,149,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.45)";
              e.currentTarget.style.boxShadow =
                "inset 0 1px 2px rgba(76,29,149,0.06), 0 1px 0 rgba(255,255,255,0.9)";
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: "#6B7280",
              fontWeight: 600,
              marginTop: 8,
              lineHeight: 1.45,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 13 }}>💡</span>
            Quem receberá a lista verá seu nome
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onShareWhatsApp}
            style={{
              width: "100%",
              minHeight: 56,
              padding: "14px 16px",
              borderRadius: 18,
              background:
                "linear-gradient(135deg,#128C7E 0%,#1FAD61 50%,#25D366 100%)",
              border: "none",
              color: "white",
              fontWeight: 900,
              fontSize: 15.5,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              letterSpacing: "-0.005em",
              boxShadow:
                "0 16px 32px -8px rgba(37,211,102,0.50), 0 6px 14px rgba(37,211,102,0.28), inset 0 1px 0 rgba(255,255,255,0.30)",
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
            <WhatsAppIcon size={22} /> Enviar pelo WhatsApp
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}
