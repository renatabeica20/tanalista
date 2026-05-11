export default function ToastMessage({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "max(100px, calc(env(safe-area-inset-bottom) + 96px))",
        left: 16,
        right: 16,
        margin: "0 auto",
        maxWidth: 460,
        zIndex: 700,
        pointerEvents: "none",
        animation: "tnl-toast-in 320ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <style>{`
        @keyframes tnl-toast-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tnl-toast-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        style={{
          position: "relative",
          background:
            "linear-gradient(135deg,#2D1B69 0%,#4C1D95 40%,#6D28D9 100%)",
          color: "#FFFFFF",
          borderRadius: 20,
          padding: "14px 18px 14px 16px",
          fontSize: 14.5,
          fontWeight: 800,
          letterSpacing: "-0.005em",
          lineHeight: 1.45,
          boxShadow:
            "0 24px 48px -16px rgba(76,29,149,0.55), 0 10px 22px -10px rgba(17,24,39,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
          border: "1px solid rgba(167,139,250,0.30)",
          backdropFilter: "blur(8px) saturate(140%)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          pointerEvents: "auto",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        {/* decorative glow */}
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: -40,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(167,139,250,0.32) 0%, rgba(167,139,250,0) 70%)",
            filter: "blur(6px)",
          }}
        />
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            left: 0,
            width: "40%",
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
            animation: "tnl-toast-shine 2.4s ease-in-out infinite",
          }}
        />

        <span
          aria-hidden
          style={{
            position: "relative",
            width: 32,
            height: 32,
            minWidth: 32,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)",
            border: "1px solid rgba(255,255,255,0.25)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 10px -4px rgba(0,0,0,0.25)",
            color: "#FFFFFF",
          }}
        >
          ✨
        </span>
        <span style={{ position: "relative", flex: 1, minWidth: 0 }}>
          {message}
        </span>
      </div>
    </div>
  );
}
