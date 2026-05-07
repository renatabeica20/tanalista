export default function PriceStatsPanel({ getPriceStatsSummary }) {
  const stats = getPriceStatsSummary();

  const panelStyle = {
    width: "100%",
    boxSizing: "border-box",
    margin: "14px 0 22px",
    padding: 16,
    borderRadius: 24,
    display: "block",
    clear: "both",
    background: "linear-gradient(135deg,#FFFFFF,#FAF7FF)",
    border: "1px solid #E9D5FF",
    boxShadow: "0 12px 28px rgba(109,40,217,0.08)",
    overflow: "hidden",
  };

  if (!stats.totalRecords) {
    return (
      <div style={panelStyle}>
        <div style={{fontWeight:900,color:"#4C1D95",fontSize:17,marginBottom:4}}>📊 Estatísticas de preços</div>
        <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45}}>
          As estatísticas aparecerão após o registro de preços nos itens comprados.
        </div>
      </div>
    );
  }

  const maxMonthly = Math.max(...stats.monthlyTotals.map(x => Number(x.total || 0)), 1);

  return (
    <div style={panelStyle}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:900,color:"#4C1D95",fontSize:17,lineHeight:1.2}}>📊 Estatísticas de preços</div>
          <div style={{fontSize:12,color:"#6B7280",marginTop:4,lineHeight:1.35}}>
            Histórico local de {stats.totalRecords} preço(s). Médias e percentuais são leituras estatísticas.
          </div>
        </div>
        <div style={{
          flexShrink:0,
          textAlign:"right",
          background:"#F5F3FF",
          border:"1px solid #DDD6FE",
          borderRadius:16,
          padding:"8px 10px",
          minWidth:96
        }}>
          <div style={{fontSize:10,color:"#6B7280",fontWeight:900,textTransform:"uppercase",lineHeight:1.1}}>Média</div>
          <div style={{fontWeight:900,color:"#111827",fontSize:16,lineHeight:1.15}}>
            {stats.averageTicket.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
          </div>
        </div>
      </div>

      {stats.topIncreases.length ? (
        <div style={{marginTop:8}}>
          <div style={{fontSize:12,fontWeight:900,color:"#374151",marginBottom:6}}>Maiores variações</div>
          <div style={{display:"grid",gap:6}}>
            {stats.topIncreases.slice(0,3).map((it, idx) => (
              <div key={idx} style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:10,
                padding:"8px 10px",
                borderRadius:14,
                background:"#FFFFFF",
                border:"1px solid #F3F4F6",
                fontSize:12
              }}>
                <span style={{fontWeight:900,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.itemName}</span>
                <span style={{fontWeight:900,color:it.percent > 0 ? "#B91C1C" : "#166534",flexShrink:0}}>
                  {it.percent > 0 ? "+" : ""}{it.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {stats.monthlyTotals.length ? (
        <div style={{marginTop:12}}>
          <div style={{fontSize:12,fontWeight:900,color:"#374151",marginBottom:6}}>Evolução mensal</div>
          <div style={{display:"grid",gap:7}}>
            {stats.monthlyTotals.slice(-4).map((m) => {
              const width = Math.max(8, Math.round((Number(m.total || 0) / maxMonthly) * 100));
              return (
                <div key={m.month} style={{display:"grid",gridTemplateColumns:"58px 1fr 78px",gap:8,alignItems:"center",fontSize:11}}>
                  <span style={{fontWeight:900,color:"#4B5563"}}>{m.month}</span>
                  <div style={{height:9,background:"#F3F4F6",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${width}%`,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",borderRadius:999}} />
                  </div>
                  <span style={{fontWeight:900,color:"#111827",textAlign:"right"}}>
                    {m.total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
