import { useEffect, useRef, useState } from "react";

export default function ExpandableSection({
  id,
  title,
  subtitle,
  openSection,
  setOpenSection,
  children,
}) {
  const isOpen = openSection === id;
  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      setMaxH(contentRef.current.scrollHeight);
      const t = setTimeout(() => setMaxH(2000), 320);
      return () => clearTimeout(t);
    } else {
      if (contentRef.current.scrollHeight) {
        setMaxH(contentRef.current.scrollHeight);
        requestAnimationFrame(() => setMaxH(0));
      } else {
        setMaxH(0);
      }
    }
  }, [isOpen, children]);

  return (
    <div
      style={{
        background: "linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)",
        border: `1px solid ${isOpen ? "rgba(167,139,250,0.45)" : "rgba(229,231,235,0.9)"}`,
        borderRadius: 22,
        marginBottom: 14,
        boxShadow: isOpen
          ? "0 18px 38px rgba(109,40,217,0.16), inset 0 1px 0 rgba(255,255,255,0.9)"
          : "0 10px 24px rgba(17,24,39,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        overflow: "hidden",
        transition: "box-shadow .28s ease, border-color .28s ease, transform .28s ease",
        transform: hover && !isOpen ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <button
        onClick={() => setOpenSection(isOpen ? null : id)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          border: "none",
          background: isOpen
            ? "linear-gradient(135deg,#F5F3FF 0%,#FAF7FF 55%,#FFFFFF 100%)"
            : "transparent",
          padding: "14px 14px 14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          WebkitTapHighlightColor: "transparent",
          transition: "background .28s ease",
          position: "relative",
        }}
      >
        {isOpen && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 12,
              bottom: 12,
              width: 3,
              borderRadius: 3,
              background: "linear-gradient(180deg,#8B5CF6,#6D28D9)",
            }}
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: -0.2,
              background: "linear-gradient(135deg,#1F2937 0%,#4C1D95 70%,#6D28D9 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: 600,
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            background: isOpen
              ? "linear-gradient(135deg,#6D28D9,#8B5CF6)"
              : "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
            border: isOpen ? "1px solid rgba(109,40,217,0.5)" : "1px solid #DDD6FE",
            boxShadow: isOpen
              ? "0 6px 14px rgba(109,40,217,0.35), inset 0 1px 0 rgba(255,255,255,0.35)"
              : "inset 0 1px 0 rgba(255,255,255,0.9)",
            fontWeight: 900,
            fontSize: 18,
            lineHeight: 1,
            transform: isOpen ? "rotate(90deg) scale(1.04)" : "rotate(0deg) scale(1)",
            transition: "transform .28s cubic-bezier(.2,.8,.2,1), background .28s, box-shadow .28s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: "inline-block",
              color: isOpen ? "#FFFFFF" : "#6D28D9",
              transform: "translateY(-1px)",
            }}
          >
            ›
          </span>
        </div>
      </button>

      <div
        style={{
          maxHeight: isOpen ? maxH : 0,
          opacity: isOpen ? 1 : 0,
          transition: "max-height .32s cubic-bezier(.2,.8,.2,1), opacity .28s ease",
          overflow: "hidden",
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: "4px 16px 18px",
            borderTop: "1px solid rgba(237,233,254,0.7)",
            marginTop: 2,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
