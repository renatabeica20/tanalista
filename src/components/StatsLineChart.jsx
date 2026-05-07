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
  const cleanSeries = (Array.isArray(series) ? series : [])
    .map((s) => ({ ...s, points: (Array.isArray(s.points) ? s.points : []).filter((p) => Number.isFinite(Number(p.value))) }))
    .filter((s) => s.points.length);

  const allValues = cleanSeries.flatMap((s) => s.points.map((p) => Number(p.value || 0)));
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const spread = Math.max(max - min, 1);
  const width = 320;
  const height = 138;
  const pad = 22;
  const colors = ["#6D28D9", "#16A34A", "#DC2626", "#2563EB", "#F97316", "#0F766E"];
  const axisTicks = [min, min + spread / 2, max].map((value) => Number(value || 0));
  const axisPoints = cleanSeries[0]?.points || [];
  const labelStep = 1;

  if (!cleanSeries.length || cleanSeries.every((s) => s.points.length < 2)) {
    return <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45,padding:"8px 2px"}}>{emptyText}</div>;
  }

  const buildPoints = (points) => points.map((p, idx) => {
    const x = points.length <= 1 ? width / 2 : pad + (idx * (width - pad * 2)) / (points.length - 1);
    const y = height - pad - ((Number(p.value || 0) - min) * (height - pad * 2)) / spread;
    return { ...p, x, y, value:Number(p.value || 0) };
  });

  return (
    <div style={{position:"relative", width:"100%", maxWidth:"100%", overflow:"visible"}}>
      {tooltip && (
        <div style={{
          position:"absolute",
          left:"50%",
          top:6,
          transform:"translateX(-50%)",
          width:"min(268px, calc(100vw - 44px))",
          maxWidth:"calc(100vw - 44px)",
          background:"rgba(17,24,39,0.88)",
          backdropFilter:"blur(8px)",
          color:"#FFFFFF",
          borderRadius:16,
          padding:"10px 12px",
          fontSize:12,
          fontWeight:800,
          lineHeight:1.38,
          zIndex:20,
          boxShadow:"0 18px 38px rgba(17,24,39,0.30)",
          boxSizing:"border-box",
          pointerEvents:"none"
        }}>
          <div style={{fontWeight:950,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{tooltip.listName || tooltip.seriesName}</div>
          <div style={{opacity:.84,marginTop:2}}>{tooltip.date || tooltip.label || ""}</div>
          <div style={{marginTop:5,color:tooltip.valueColor || "#C4B5FD"}}>{valueLabel}: {formatBRL(tooltip.value)}</div>
          {Array.isArray(tooltip.meta) && tooltip.meta.length ? (
            <div style={{marginTop:6,paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.16)",display:"grid",gap:3}}>
              {tooltip.meta.map((row, idx) => (
                <div key={idx} style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <span style={{opacity:.82}}>{row.label}</span>
                  <span style={{fontWeight:950,whiteSpace:"nowrap",color:row.color || "#FFFFFF"}}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height + 24}`} style={{width:"100%",height:198,display:"block",overflow:"visible"}} onClick={(e)=>{ if(e.target.tagName === "svg") setTooltip(null); }}>
        {axisTicks.map((tick, idx) => {
          const y = height - pad - ((tick - min) * (height - pad * 2)) / spread;
          return (
            <g key={`axis-${idx}`}>
              <line x1={pad} y1={y} x2={width-pad} y2={y} stroke={idx === 0 ? "#E5E7EB" : "#F3F4F6"} strokeWidth="1.5" strokeDasharray={idx === 0 ? "0" : "4 5"} />
              <text x={pad - 5} y={y + 4} textAnchor="end" fontSize="9" fontWeight="800" fill="#9CA3AF">{formatBRL(tick).replace("R$", "")}</text>
            </g>
          );
        })}
        <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="#E5E7EB" strokeWidth="2" />
        <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="#F3F4F6" strokeWidth="2" />
        {cleanSeries.map((s, si) => {
          const pts = buildPoints(s.points);
          const linePath = pts.map((p) => `${p.x},${p.y}`).join(" ");
          const color = s.color || colors[si % colors.length];
          return (
            <g key={`${s.itemName || s.name}-${si}`}>
              <polyline points={linePath} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, pi) => (
                <circle
                  key={pi}
                  cx={p.x}
                  cy={p.y}
                  r="7"
                  fill="#FFFFFF"
                  stroke={color}
                  strokeWidth="4"
                  style={{cursor:"pointer"}}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTooltip({
                      x:p.x,
                      y:p.y,
                      value:p.value,
                      valueColor:p.valueColor,
                      label:p.label,
                      date:p.date,
                      listName:p.listName,
                      meta:p.meta,
                      seriesName:s.itemName || s.name || "Série"
                    });
                  }}
                />
              ))}
            </g>
          );
        })}
        {axisPoints.map((p, idx) => {
          if (idx !== 0 && idx !== axisPoints.length - 1 && idx % labelStep !== 0) return null;
          const x = axisPoints.length <= 1 ? width / 2 : pad + (idx * (width - pad * 2)) / Math.max(1, axisPoints.length - 1);
          const rawLabel = String(p.label || p.listName || "").replace(/\s+/g, " ").trim();
          const maxChars = axisPoints.length >= 10 ? 4 : axisPoints.length >= 7 ? 6 : axisPoints.length >= 5 ? 8 : 11;
          const label = rawLabel.length > maxChars ? rawLabel.slice(0, maxChars).trim() + "…" : rawLabel;
          const rotate = axisPoints.length >= 5;
          return (
            <text
              key={`xlabel-${idx}`}
              x={x}
              y={height + (rotate ? 17 : 13)}
              textAnchor={rotate ? "end" : "middle"}
              fontSize={axisPoints.length >= 9 ? "7" : "9"}
              fontWeight="900"
              fill="#6B7280"
              transform={rotate ? `rotate(-32 ${x} ${height + 17})` : undefined}
            >
              {label}
            </text>
          );
        })}
      </svg>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:11,color:"#6B7280",fontWeight:800,marginTop:-4}}>
        {cleanSeries.map((s, si) => (
          <span key={si} style={{display:"inline-flex",alignItems:"center",gap:5}}>
            <span style={{width:9,height:9,borderRadius:999,background:s.color || colors[si % colors.length],display:"inline-block"}} />
            {s.itemName || s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
