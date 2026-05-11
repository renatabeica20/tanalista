import { useState } from "react";

export default function PriceStatsEntryCard({ onClick }) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid rgba(167,139,250,0.35)",
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FAF7FF 55%, #F3E8FF 100%)",
        borderRadius: 20,
        padding: "14px 16px",
        margin: "18px 0 22px",
        boxShadow: pressed
          ? "0 4px 10px -4px rgba(76,29,149,0.25), inset 0 1px 0 rgba(255,255,255,0.9)"
          : hover
          ? "0 18px 36px -14px rgba(76,29,149,0.38), 0 6px 14px -8px rgba(124,58,237,0.22), inset 0 1px 0 rgba(255,255,255,0.95)"
          : "0 12px 26px -14px rgba(76,29,149,0.28), 0 4px 10px -6px rgba(124,58,237,0.16), inset 0 1px 0 rgba(255,255,255,0.95)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        clear: "both",
        overflow: "hidden",
        transform: pressed ? "scale(0.985)" : hover ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* sheen decorativo */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(110% 60% at 100% 0%, rgba(167,139,250,0.20), transparent 55%), radial-gradient(80% 50% at 0% 100%, rgba(196,181,253,0.18), transparent 60%)",
        }}
      />
      {/* faixa lateral */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: "linear-gradient(180deg,#6D28D9,#A855F7)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg,#6D28D9,#8B5CF6 60%,#A855F7)",
            color: "#FFFFFF",
            fontSize: 20,
            flexShrink: 0,
            boxShadow:
              "0 10px 22px -8px rgba(109,40,217,0.6), inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          📊
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "linear-gradient(135deg,#34D399,#10B981)",
              border: "2px solid #FFFFFF",
              boxShadow: "0 2px 6px rgba(16,185,129,0.5)",
            }}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: "#4C1D95",
                fontSize: 16,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              Estatísticas de preços
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: 9.5,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6D28D9",
                background: "#EDE9FE",
                border: "1px solid #DDD6FE",
                borderRadius: 999,
                padding: "2px 7px",
                lineHeight: 1.4,
              }}
            >
              Novo
            </span>
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "#6B7280",
              marginTop: 4,
              lineHeight: 1.35,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Ver análise de variação dos itens comprados
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: 32,
          height: 32,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          background: hover
            ? "linear-gradient(135deg,#6D28D9,#8B5CF6)"
            : "#F5F3FF",
          color: hover ? "#FFFFFF" : "#6D28D9",
          fontWeight: 900,
          fontSize: 18,
          flexShrink: 0,
          border: "1px solid #DDD6FE",
          boxShadow: hover
            ? "0 8px 18px -6px rgba(109,40,217,0.55)"
            : "inset 0 1px 0 #fff",
          transform: hover ? "translateX(2px)" : "translateX(0)",
          transition: "all 200ms ease",
        }}
      >
        ›
      </div>
    </button>
  );
}
