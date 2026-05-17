import { useState } from "react";

/**
 * FloatingActions — visual premium, sem alterações de lógica/props/callbacks.
 *
 * Mantém:
 *  - props: onAddExtraItem, highlightExtraItem, themeGradient
 *  - comportamento de clique (onAddExtraItem)
 *  - z-index dinâmico para tour/onboarding (highlightExtraItem)
 *
 * Melhorias visuais:
 *  - Gradiente premium multi-stop com leve brilho interno
 *  - Sombra em camadas (ambiente + cor da marca) para profundidade
 *  - Micro-interação de press (scale + sombra reduzida)
 *  - Animação sutil de pulso quando destacado
 *  - Ícone SVG nítido (substitui o "＋")
 *  - Safe-area iOS via env(safe-area-inset-bottom)
 *  - Responsivo: largura/padding adaptam em telas estreitas
 *  - themeGradient: acompanha o tema visual do tipo de lista
 */
export default function FloatingActions({ onAddExtraItem, highlightExtraItem = false, themeGradient }) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);

  const activeGradient = themeGradient || "linear-gradient(135deg, #4C1D95 0%, #6D28D9 45%, #8B5CF6 100%)";

  const baseShadow = pressed
    ? "0 4px 14px rgba(76,29,149,0.32), 0 2px 6px rgba(15,23,42,0.18)"
    : hover
    ? "0 22px 50px -12px rgba(124,58,237,0.55), 0 10px 24px -6px rgba(76,29,149,0.40), inset 0 1px 0 rgba(255,255,255,0.25)"
    : "0 18px 40px -14px rgba(124,58,237,0.50), 0 8px 20px -6px rgba(76,29,149,0.36), inset 0 1px 0 rgba(255,255,255,0.22)";

  const highlightShadow =
    "0 0 0 6px rgba(255,255,255,0.98), 0 0 0 14px rgba(124,58,237,0.55), 0 30px 72px rgba(76,29,149,0.52), inset 0 1px 0 rgba(255,255,255,0.28)";

  return (
    <>
      <style>{`
        @keyframes fabPulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50%      { transform: translateX(-50%) scale(1.035); }
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: 110,
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(255,255,255,0.85), rgba(255,255,255,0))",
          zIndex: highlightExtraItem ? 734 : 199,
        }}
      />

      <button
        onClick={onAddExtraItem}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{
          position: "fixed",
          bottom: `calc(24px + env(safe-area-inset-bottom, 0px))`,
          left: "50%",
          transform: `translateX(-50%) scale(${pressed ? 0.96 : hover ? 1.02 : 1})`,
          background: activeGradient,
          border: "1px solid rgba(255,255,255,0.18)",
          color: "white",
          borderRadius: 999,
          padding: "14px 26px",
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: "-0.005em",
          cursor: "pointer",
          boxShadow: highlightExtraItem ? highlightShadow : baseShadow,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          whiteSpace: "nowrap",
          zIndex: highlightExtraItem ? 735 : 200,
          fontFamily: "inherit",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          outline: "none",
          transition:
            "transform 180ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease, filter 220ms ease, background 400ms ease",
          ...(highlightExtraItem
            ? {
                filter: "brightness(1.16) saturate(1.12)",
                animation: "fabPulse 1.8s ease-in-out infinite",
              }
            : {}),
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        {/* brilho interno sutil no topo */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 1,
            left: 12,
            right: 12,
            height: 14,
            borderRadius: 999,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0))",
            pointerEvents: "none",
          }}
        />

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.28)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </span>
        <span style={{ position: "relative" }}>Adicionar item extra</span>
      </button>
    </>
  );
}
