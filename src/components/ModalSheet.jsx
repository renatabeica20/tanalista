import { useEffect, useRef } from "react";

export default function ModalSheet({ onClose, children }) {
  const sheetRef = useRef(null);

  // Impede que a página por trás role enquanto o modal está aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Quando o teclado virtual abre no iPhone, o visualViewport encolhe.
  // Reposicionamos o sheet para ficar logo acima do teclado.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const reposition = () => {
      if (!sheetRef.current) return;
      const offsetY = window.innerHeight - vv.height - vv.offsetTop;
      sheetRef.current.style.transform = `translateY(-${Math.max(0, offsetY)}px)`;
    };

    vv.addEventListener("resize", reposition);
    vv.addEventListener("scroll", reposition);
    return () => {
      vv.removeEventListener("resize", reposition);
      vv.removeEventListener("scroll", reposition);
    };
  }, []);

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(120% 80% at 50% 100%, rgba(76,29,149,0.42) 0%, rgba(17,24,39,0.55) 60%, rgba(15,23,42,0.6) 100%)",
        backdropFilter: "blur(10px) saturate(140%)",
        WebkitBackdropFilter: "blur(10px) saturate(140%)",
        zIndex: 400,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px 12px 0",
        animation: "tnl-modal-fade 200ms ease-out",
      }}
    >
      <style>{`
        @keyframes tnl-modal-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tnl-modal-slide {
          from { transform: translateY(28px) scale(0.985); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @media (min-width: 640px) {
          .tnl-modal-sheet {
            margin-bottom: 24px;
            border-bottom-left-radius: 28px !important;
            border-bottom-right-radius: 28px !important;
          }
        }
      `}</style>
      <div
        ref={sheetRef}
        className="tnl-modal-sheet"
        style={{
          position: "relative",
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #FDFBFF 60%, #F8F4FF 100%)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: "26px 20px 24px",
          width: "100%",
          maxWidth: 460,
          border: "1px solid rgba(167,139,250,0.28)",
          borderBottom: "none",
          boxShadow:
            "0 -24px 60px -12px rgba(76,29,149,0.32), 0 -8px 24px -8px rgba(17,24,39,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
          animation: "tnl-modal-slide 280ms cubic-bezier(0.22,1,0.36,1)",
          maxHeight: "92vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          transition: "transform 120ms ease-out",
          willChange: "transform",
        }}
      >
        {/* drag handle */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 44,
            height: 5,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(167,139,250,0.55), rgba(124,58,237,0.55))",
            boxShadow: "0 1px 2px rgba(76,29,149,0.18)",
          }}
        />
        {/* decorative glow */}
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167,139,250,0.28) 0%, rgba(167,139,250,0) 70%)",
            filter: "blur(8px)",
          }}
        />
        <div style={{ position: "relative", paddingTop: 6 }}>{children}</div>
      </div>
    </div>
  );
}
