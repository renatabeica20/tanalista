import { useEffect, useState, useCallback } from "react";

export default function GuidedTourOverlay({
  step,
  index,
  total,
  onNext,
  onPrev,
  onClose,
  onSkip,
  showPrev = true,
  showSkip = true,
  externalRect = null,
}) {
  if (!step) return null;

  const isLast = index >= total - 1;
  const primaryLabel = isLast ? "Fechar" : "Próximo";
  const progress = ((index + 1) / Math.max(total, 1)) * 100;
  const targetId = step?.id || step?.targetId || null;

  const [targetRect, setTargetRect] = useState(null);

  const findEl = useCallback(() => {
    if (typeof document === "undefined" || !targetId) return null;

    let el = document.querySelector(
      `[data-tour-step="${targetId}"]`
    );

    if (el) return el;

    el = Array.from(
      document.querySelectorAll("[data-tour-also]")
    ).find((n) =>
      (n.getAttribute("data-tour-also") || "")
        .split(" ")
        .includes(targetId)
    );

    return el || null;
  }, [targetId]);

  const measureEl = useCallback((el) => {
    if (!el) return null;

    const r = el.getBoundingClientRect();

    if (r.width === 0 && r.height === 0) return null;

    const pad = 12;

    return {
      x: r.left - pad,
      y: r.top - pad,
      w: r.width + pad * 2,
      h: r.height + pad * 2,
      centerY: r.top + r.height / 2,
    };
  }, []);

  useEffect(() => {
    setTargetRect(null);

    if (!targetId) return;

    let cancelled = false;
    let retryCount = 0;
    let raf = null;
    let observer = null;

    const MAX_RETRIES = 40;

    const updateRect = () => {
      if (cancelled) return false;

      const el = findEl();

      if (!el) return false;

      const style = window.getComputedStyle(el);

      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      try {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      } catch (_) {}

      const rect = measureEl(el);

      if (!rect) return false;

      setTargetRect(rect);

      return true;
    };

    const retry = () => {
      if (cancelled) return;

      const found = updateRect();

      if (found) return;

      retryCount += 1;

      if (retryCount >= MAX_RETRIES) return;

      raf = requestAnimationFrame(() => {
        setTimeout(retry, 120);
      });
    };

    retry();

    observer = new MutationObserver(() => {
      updateRect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    const onLayout = () => {
      updateRect();
    };

    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);

    return () => {
      cancelled = true;

      if (raf) cancelAnimationFrame(raf);

      observer?.disconnect();

      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [targetId, findEl, measureEl]);

  const vw =
    typeof window !== "undefined"
      ? window.innerWidth
      : 430;

  const vh =
    typeof window !== "undefined"
      ? window.innerHeight
      : 900;

  const r = externalRect || targetRect;

  const radius = 16;

  const elementInBottomHalf = r
    ? r.centerY > vh / 2
    : false;

  const cardPos = elementInBottomHalf
    ? { top: 88 }
    : { bottom: 88 };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        pointerEvents: "none",
      }}
    >
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tnl-tour-mask">
            <rect
              width={vw}
              height={vh}
              fill="white"
            />

            {r && (
              <rect
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx={radius}
                ry={radius}
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          width={vw}
          height={vh}
          fill="rgba(15,23,42,0.78)"
          mask="url(#tnl-tour-mask)"
        />

        {r && (
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx={radius}
            ry={radius}
            fill="none"
            stroke="rgba(124,58,237,0.95)"
            strokeWidth="4"
          />
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          ...cardPos,
          margin: "0 auto",
          maxWidth: 400,
          background: "#FFFFFF",
          borderRadius: 28,
          padding: 20,
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.35)",
          pointerEvents: "auto",
          zIndex: 1000001,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <strong>
            {step?.icon} {step?.title}
          </strong>

          <span
            style={{
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            {index + 1}/{total}
          </span>
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "#374151",
          }}
        >
          {step?.text}
        </div>

        <div
          style={{
            height: 6,
            borderRadius: 999,
            background: "#E5E7EB",
            marginTop: 18,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background:
                "linear-gradient(90deg,#7C3AED,#A78BFA)",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 18,
          }}
        >
          {showPrev && (
            <button
              onClick={onPrev}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 14,
                border: "1px solid #DDD6FE",
                background: "#FFFFFF",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Voltar
            </button>
          )}

          <button
            onClick={isLast ? onClose : onNext}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              border: "none",
              background:
                "linear-gradient(135deg,#6D28D9,#8B5CF6)",
              color: "#FFFFFF",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {primaryLabel}
          </button>
        </div>

        {showSkip && (
          <button
            onClick={onSkip}
            style={{
              marginTop: 10,
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#6B7280",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Pular tutorial
          </button>
        )}
      </div>
    </div>
  );
}
