import { useState } from "react";

function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function StatsLineChart({
  series = [],
  emptyText = "Sem dados suficientes.",
  valueLabel = "Valor",
}) {
  const [tooltip, setTooltip] = useState(null);
  const [hoverKey, setHoverKey] = useState(null);

  const cleanSeries = (Array.isArray(series) ? series : [])
    .map((s) => ({ ...s, points: (Array.isArray(s.points) ? s.points : []).filter((p) => Number.isFinite(Number(p.value))) }))
    .filter((s) => s.points.length);
  const allValues = cleanSeries.flatMap((s) => s.points.map((p) => Number(p.value || 0)));
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const spread = Math.max(max - min, 1);
  const width = 320;
  const height = 138;
  const pad = 24;
  const colors = ["#6D28D9", "#16A34A", "#DC2626", "#2563EB", "#F97316", "#0F766E"];
  const axisTicks = [min, min + spread / 2, max].map((value) => Number(value || 0));
  const axisPoints = cleanSeries[0]?.points || [];
  const labelStep = 1;

  if (!cleanSeries.length || cleanSeries.every((s) => s.points.length < 2)) {
    return (
      <div
        style={{
          fontSize: 13,
          color: "#6B7280",
          lineHeight: 1.45,
          padding: "16px 14px",
          background: "linear-gradient(180deg,#FBFAFF,#FFFFFF)",
          border: "1px dashed rgba(167,139,250,0.35)",
          borderRadius: 16,
          textAlign: "center",
          fontWeight: 700,
        }}
      >
        📉 {emptyText}
      </div>
    );
  }

  const buildPoints = (points) => points.map((p, idx) => {
    const x = points.length <= 1 ? width / 2 : pad + (idx * (width - pad * 2)) / (points.length - 1);
    const y = height - pad - ((Number(p.value || 0) - min) * (height - pad * 2)) / spread;
    return { ...p, x, y, value: Number(p.value || 0) };
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        overflow: "visible",
        background: "linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)",
        border: "1px solid rgba(167,139,250,0.22)",
        borderRadius: 18,
        padding: "12px 10px 10px",
        boxShadow: "0 10px 24px rgba(17,24,39,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
        boxSizing: "border-box",
      }}
    >
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 10,
            transform: "translateX(-50%)",
            width: "min(272px, calc(100vw - 56px))",
            maxWidth: "calc(100vw - 56px)",
            background: "linear-gradient(135deg, rgba(17,24,39,0.94), rgba(31,41,55,0.92))",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "#FFFFFF",
            borderRadius: 14,
            padding: "11px 13px",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.4,
            zIndex: 20,
            boxShadow: "0 20px 44px rgba(17,24,39,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
            border: "1px solid rgba(167,139,250,0.28)",
            boxSizing: "border-box",
            pointerEvents: "none",
            animation: "tnl-chart-tip .18s ease-out both",
          }}
        >
          <style>{`@keyframes tnl-chart-tip{from{opacity:0;transform:translate(-50%,-4px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
          <div
            style={{
              fontWeight: 950,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontSize: 12.5,
              letterSpacing: -0.1,
            }}
          >
            {tooltip.listName || tooltip.seriesName}
          </div>
          {(tooltip.date || tooltip.label) && (
            <div style={{ opacity: 0.7, marginTop: 2, fontWeight: 700, fontSize: 11 }}>
              {tooltip.date || tooltip.label || ""}
            </div>
          )}
          <div
            style={{
              marginTop: 7,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 900,
              fontSize: 13,
              color: tooltip.valueColor || "#C4B5FD",
            }}
          >
            <span style={{ opacity: 0.75, fontWeight: 700, fontSize: 11 }}>{valueLabel}:</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatBRL(tooltip.value)}</span>
          </div>
          {Array.isArray(tooltip.meta) && tooltip.meta.length ? (
            <div
              style={{
                marginTop: 7,
                paddingTop: 7,
                borderTop: "1px solid rgba(255,255,255,0.14)",
                display: "grid",
                gap: 4,
              }}
            >
              {tooltip.meta.map((row, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ opacity: 0.78, fontWeight: 700 }}>{row.label}</span>
                  <span
                    style={{
                      fontWeight: 950,
                      whiteSpace: "nowrap",
                      color: row.color || "#FFFFFF",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height + 26}`}
        style={{ width: "100%", height: 208, display: "block", overflow: "visible" }}
        onClick={(e) => {
          if (e.target.tagName === "svg") setTooltip(null);
        }}
      >
        <defs>
          {cleanSeries.map((s, si) => {
            const color = s.color || colors[si % colors.length];
            return (
              <linearGradient key={`grad-${si}`} id={`tnl-area-${si}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            );
          })}
          <filter id="tnl-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {axisTicks.map((tick, idx) => {
          const y = height - pad - ((tick - min) * (height - pad * 2)) / spread;
          return (
            <g key={`axis-${idx}`}>
              <line
                x1={pad}
                y1={y}
                x2={width - pad}
                y2={y}
                stroke={idx === 0 ? "#E5E7EB" : "#EDE9FE"}
                strokeWidth="1.2"
                strokeDasharray={idx === 0 ? "0" : "3 5"}
                opacity={idx === 0 ? 1 : 0.85}
              />
              <text
                x={pad - 6}
                y={y + 3.5}
                textAnchor="end"
                fontSize="9"
                fontWeight="800"
                fill="#9CA3AF"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatBRL(tick).replace("R$", "").trim()}
              </text>
            </g>
          );
        })}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#E5E7EB" strokeWidth="1.5" />

        {cleanSeries.map((s, si) => {
          const pts = buildPoints(s.points);
          const color = s.color || colors[si % colors.length];
          const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
          const areaPath =
            pts.length > 1
              ? `${linePath} L${pts[pts.length - 1].x},${height - pad} L${pts[0].x},${height - pad} Z`
              : "";
          return (
            <g key={`${s.itemName || s.name}-${si}`}>
              {areaPath && <path d={areaPath} fill={`url(#tnl-area-${si})`} />}
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
                filter="url(#tnl-glow)"
              />
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p, pi) => {
                const k = `${si}-${pi}`;
                const isHover = hoverKey === k;
                return (
                  <g key={pi}>
                    {isHover && (
                      <circle cx={p.x} cy={p.y} r="11" fill={color} opacity="0.16" />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHover ? 6.5 : 5.2}
                      fill="#FFFFFF"
                      stroke={color}
                      strokeWidth="2.8"
                      style={{ cursor: "pointer", transition: "r .15s ease" }}
                      onMouseEnter={() => setHoverKey(k)}
                      onMouseLeave={() => setHoverKey((prev) => (prev === k ? null : prev))}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoverKey(k);
                        setTooltip({
                          x: p.x,
                          y: p.y,
                          value: p.value,
                          valueColor: p.valueColor,
                          label: p.label,
                          date: p.date,
                          listName: p.listName,
                          meta: p.meta,
                          seriesName: s.itemName || s.name || "Série",
                        });
                      }}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}

        {axisPoints.map((p, idx) => {
          if (idx !== 0 && idx !== axisPoints.length - 1 && idx % labelStep !== 0) return null;
          const x =
            axisPoints.length <= 1
              ? width / 2
              : pad + (idx * (width - pad * 2)) / Math.max(1, axisPoints.length - 1);
          const rawLabel = String(p.label || p.listName || "").replace(/\s+/g, " ").trim();
          const maxChars = axisPoints.length >= 10 ? 4 : axisPoints.length >= 7 ? 6 : axisPoints.length >= 5 ? 8 : 11;
          const label = rawLabel.length > maxChars ? rawLabel.slice(0, maxChars).trim() + "…" : rawLabel;
          const rotate = axisPoints.length >= 5;
          return (
            <text
              key={`xlabel-${idx}`}
              x={x}
              y={height + (rotate ? 18 : 14)}
              textAnchor={rotate ? "end" : "middle"}
              fontSize={axisPoints.length >= 9 ? "7.5" : "9"}
              fontWeight="800"
              fill="#6B7280"
              transform={rotate ? `rotate(-32 ${x} ${height + 18})` : undefined}
            >
              {label}
            </text>
          );
        })}
      </svg>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          fontSize: 11,
          color: "#4B5563",
          fontWeight: 800,
          marginTop: 4,
          paddingTop: 8,
          borderTop: "1px dashed rgba(167,139,250,0.22)",
        }}
      >
        {cleanSeries.map((s, si) => {
          const color = s.color || colors[si % colors.length];
          return (
            <span
              key={si}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 9px",
                borderRadius: 999,
                background: "linear-gradient(135deg,#FFFFFF,#FBFAFF)",
                border: `1px solid ${color}33`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: color,
                  boxShadow: `0 0 0 2px ${color}22`,
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#1F2937" }}>{s.itemName || s.name}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
