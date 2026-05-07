import { useEffect, useState } from "react";
import ExpandableSection from "./ExpandableSection";
import StatsLineChart from "./StatsLineChart";
export default function PriceStatsScreen({
  onBack,
  lists = [],
  getPriceStatsSummary,
  normalizeCacheKey,
  formatBRL,
}) {
  const [openSection, setOpenSection] = useState("budget");
  const [productQuery, setProductQuery] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const stats = getPriceStatsSummary(lists);

  const shortListLabel = (value, fallback = "Lista", total = 1) => {
    const raw = String(value || fallback).trim() || fallback;
    const clean = raw.replace(/\s+/g, " ").trim();
    const max = total >= 10 ? 4 : total >= 7 ? 6 : total >= 5 ? 8 : 12;
    return clean.length > max ? clean.slice(0, max).trim() + "…" : clean;
  };

  const budgetRows = stats.budgetSeries || [];
  const budgetSpentSeries = {
    name:"Gasto real",
    color:"#6D28D9",
    points:budgetRows.map((p) => {
      const spent = Number(p.spent || 0);
      const budget = Number(p.budget || 0);
      const balance = Number((budget - spent).toFixed(2));
      return {
        label:shortListLabel(p.label || p.listName, "Lista", budgetRows.length),
        date:p.date,
        listName:p.listName || p.label,
        value:spent,
        meta:[
          { label:"Orçamento", value:budget > 0 ? formatBRL(budget) : "não definido" },
          { label:balance >= 0 ? "Economia" : "Estouro", value:formatBRL(Math.abs(balance)), color:balance >= 0 ? "#BBF7D0" : "#FECACA" }
        ]
      };
    })
  };
  const budgetLimitSeries = {
    name:"Orçamento",
    color:"#16A34A",
    points:budgetRows.filter((p)=>Number(p.budget || 0)>0).map((p) => ({
      label:shortListLabel(p.label || p.listName, "Lista", budgetRows.length),
      date:p.date,
      listName:p.listName || p.label,
      value:Number(p.budget || 0),
      meta:[
        { label:"Gasto real", value:formatBRL(p.spent || 0) },
        { label:"Saldo", value:formatBRL(Math.abs(Number(p.budget || 0) - Number(p.spent || 0))), color:Number(p.budget || 0) >= Number(p.spent || 0) ? "#BBF7D0" : "#FECACA" }
      ]
    }))
  };

  const normalizeStatsSearch = (value) => normalizeCacheKey(value || "");
  const filteredProductSeries = (stats.priceSeries || []).filter((item) => {
    const q = normalizeStatsSearch(productQuery);
    if (!q) return true;
    return normalizeStatsSearch(item.itemName || item.name).includes(q);
  });

  const calcMovement = (series) => {
    const points = Array.isArray(series?.points) ? series.points.filter((p) => Number(p?.value || 0) > 0) : [];
    if (points.length < 2) return null;
    const first = Number(points[0]?.value || 0);
    const last = Number(points[points.length - 1]?.value || 0);
    if (!first || !Number.isFinite(first) || !Number.isFinite(last)) return null;
    const diff = Number((last - first).toFixed(2));
    const percent = Number(((diff / first) * 100).toFixed(1));
    return {
      name: series?.itemName || series?.name || "Item",
      first,
      last,
      diff,
      percent,
    };
  };

  const productMovements = (stats.priceSeries || []).map(calcMovement).filter(Boolean);
  const topProductIncreases = productMovements.filter((m) => m.diff > 0).sort((a, b) => b.percent - a.percent).slice(0, 5);
  const topProductDrops = productMovements.filter((m) => m.diff < 0).sort((a, b) => a.percent - b.percent).slice(0, 5);

  const getSeriesMovement = (series) => {
    const points = Array.isArray(series?.points) ? series.points.filter((p) => Number(p?.value || 0) > 0) : [];
    if (points.length < 2) return { diff:0, percent:0 };
    const first = Number(points[0]?.value || 0);
    const last = Number(points[points.length - 1]?.value || 0);
    const diff = Number((last - first).toFixed(2));
    const percent = first ? Number(((diff / first) * 100).toFixed(1)) : 0;
    return { diff, percent };
  };

  const withBackwardVariation = (series, label = "Variação") => {
    if (!series) return null;
    const points = Array.isArray(series.points) ? series.points : [];
    return {
      ...series,
      points: points.map((p, idx) => {
        const prev = idx > 0 ? points[idx - 1] : null;
        const current = Number(p?.value || 0);
        const previous = Number(prev?.value || 0);
        const diff = prev ? Number((current - previous).toFixed(2)) : 0;
        const percent = prev && previous ? Number(((diff / previous) * 100).toFixed(1)) : 0;
        const meta = [...(Array.isArray(p?.meta) ? p.meta : [])];
        if (prev) {
          meta.push({
            label,
            value: `${diff >= 0 ? "+" : ""}${formatBRL(diff)}${previous ? ` (${diff >= 0 ? "+" : ""}${percent}%)` : ""}`,
            color: diff > 0 ? "#FCA5A5" : diff < 0 ? "#BBF7D0" : "#FFFFFF"
          });
        } else {
          meta.push({ label, value:"Primeiro registro", color:"#FFFFFF" });
        }
        return { ...p, meta };
      })
    };
  };

  const categorySeriesAll = stats.categorySeries || [];
  const selectedCategoryRaw = categorySeriesAll.find((s) => (s.itemName || s.name) === selectedCategoryName) || categorySeriesAll[0] || null;
  const selectedCategory = withBackwardVariation(selectedCategoryRaw, "Variação anterior");

  useEffect(() => {
    if (!selectedCategoryName && categorySeriesAll.length) {
      setSelectedCategoryName(categorySeriesAll[0].itemName || categorySeriesAll[0].name || "");
    }
  }, [selectedCategoryName, categorySeriesAll]);

  const productOptions = filteredProductSeries;
  const selectedProduct = productOptions.find((s) => (s.itemName || s.name) === selectedProductName) || productOptions[0] || null;

  const consolidatedByListSeries = withBackwardVariation({
    name:"Gasto executado",
    color:"#DC2626",
    points:budgetRows.map((p) => ({
      label:shortListLabel(p.label || p.listName, "Lista", budgetRows.length),
      date:p.date,
      listName:p.listName || p.label,
      value:Number(p.spent || 0),
      valueColor:"#FCA5A5",
      meta:[]
    }))
  }, "Variação anterior");

  const RankingMiniList = ({ title, rows = [], positive = true, emptyText = "Sem variação suficiente" }) => (
    <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12,boxShadow:"0 8px 20px rgba(17,24,39,0.04)"}}>
      <div style={{fontSize:12,fontWeight:950,color:positive ? "#991B1B" : "#166534",marginBottom:8}}>{title}</div>
      {!rows.length ? <div style={{fontSize:12,fontWeight:700,color:"#6B7280"}}>{emptyText}</div> : rows.map((row, idx) => (
        <div key={`${title}-${row.name}-${idx}`} style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",padding:idx ? "7px 0 0" : "0",borderTop:idx ? "1px solid #F3F4F6" : "none",fontSize:12}}>
          <span style={{fontWeight:900,color:"#111827",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.name}</span>
          <span style={{fontWeight:950,color:row.diff >= 0 ? "#991B1B" : "#166534",whiteSpace:"nowrap"}}>{row.diff >= 0 ? "+" : ""}{row.percent}%</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight:"100dvh",
      width:"100%",
      maxWidth:"100vw",
      overflowX:"hidden",
      background:"linear-gradient(180deg,#FAF7FF 0%,#FFFFFF 48%,#F9FAFB 100%)",
      paddingTop:"calc(env(safe-area-inset-top, 0px) + 10px)",
      paddingRight:"max(14px, env(safe-area-inset-right, 0px))",
      paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 28px)",
      paddingLeft:"max(14px, env(safe-area-inset-left, 0px))",
      boxSizing:"border-box",
      fontFamily:"inherit"
    }}>
      <div style={{maxWidth:760,width:"100%",margin:"0 auto",boxSizing:"border-box",overflow:"visible"}}>
        <div style={{
          background:"linear-gradient(135deg,#5B21B6,#8B5CF6)",
          borderRadius:24,
          padding:"16px 14px",
          color:"#FFFFFF",
          boxShadow:"0 18px 44px rgba(109,40,217,0.22)",
          marginBottom:16,
          boxSizing:"border-box",
          maxWidth:"100%"
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,minWidth:0}}>
            <button onClick={onBack} style={{
              width:42,height:42,borderRadius:"50%",
              border:"1px solid rgba(255,255,255,0.28)",
              background:"rgba(255,255,255,0.16)",
              color:"#FFFFFF",
              fontSize:23,
              cursor:"pointer",
              fontFamily:"inherit",
              flexShrink:0
            }}>←</button>
            <div style={{textAlign:"center",flex:1,minWidth:0}}>
              <div style={{fontSize:"clamp(20px, 6vw, 24px)",fontWeight:900,lineHeight:1.1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Estatísticas de preços</div>
              <div style={{fontSize:12,fontWeight:700,opacity:.86,marginTop:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Análise limpa por lista, seção e produto</div>
            </div>
            <div style={{width:42,flexShrink:0}} />
          </div>
        </div>

        {!stats.totalRecords ? (
          <div style={{
            background:"#FFFFFF",
            border:"1px solid #E5E7EB",
            borderRadius:24,
            padding:24,
            textAlign:"center",
            boxShadow:"0 12px 28px rgba(17,24,39,0.06)"
          }}>
            <div style={{fontSize:42,marginBottom:8}}>📊</div>
            <div style={{fontSize:19,fontWeight:900,color:"#111827",marginBottom:6}}>Ainda não há estatísticas</div>
            <div style={{fontSize:14,color:"#6B7280",lineHeight:1.45}}>Finalize listas com preços para acompanhar a evolução dos gastos.</div>
          </div>
        ) : (
          <>
           <ExpandableSection id="budget" title="Orçamento x Gasto" subtitle="Toque nos pontos do gráfico para ver lista, orçamento, gasto e economia/estouro." openSection={openSection} setOpenSection={setOpenSection}>
              <StatsLineChart series={[budgetSpentSeries, budgetLimitSeries].filter(s => s.points.length)} valueLabel="Valor" emptyText="Ainda não há listas com gasto e orçamento suficientes." />
            </ExpandableSection>
            <ExpandableSection id="category" title="Gasto por Seção" subtitle="Selecione uma seção para acompanhar sua evolução ao longo das listas." openSection={openSection} setOpenSection={setOpenSection}>
              {categorySeriesAll.length ? (
                <>
                  <select
                    value={selectedCategory ? (selectedCategory.itemName || selectedCategory.name) : ""}
                    onChange={(e)=>setSelectedCategoryName(e.target.value)}
                    style={{width:"100%",border:"1px solid #DDD6FE",borderRadius:16,padding:"12px 13px",fontSize:16,fontWeight:800,outline:"none",marginBottom:10,boxSizing:"border-box",fontFamily:"inherit",background:"#FFFFFF",color:"#111827"}}
                  >
                    {categorySeriesAll.map((sec) => {
                      const name = sec.itemName || sec.name;
                      return <option key={name} value={name}>{name}</option>;
                    })}
                  </select>
                  <StatsLineChart series={selectedCategory ? [selectedCategory] : []} valueLabel="Gasto" emptyText="Ainda não há dados suficientes por seção." />
                </>
              ) : (
                <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45,padding:"8px 2px"}}>Ainda não há dados suficientes por seção.</div>
              )}
            </ExpandableSection>

           <ExpandableSection id="product" title="Evolução do Preço por Produto" subtitle="Pesquise um produto e visualize um gráfico por vez, com opção para listar todos." openSection={openSection} setOpenSection={setOpenSection}>
              <input
                value={productQuery}
                onChange={(e)=>{ setProductQuery(e.target.value); setSelectedProductName(""); setShowAllProducts(false); }}
                placeholder="Buscar produto..."
                style={{width:"100%",border:"1px solid #DDD6FE",borderRadius:16,padding:"12px 13px",fontSize:16,fontWeight:700,outline:"none",marginBottom:10,boxSizing:"border-box",fontFamily:"inherit"}}
              />
              {!productOptions.length ? (
                <div style={{fontSize:13,color:"#6B7280",fontWeight:700,padding:"8px 2px"}}>Nenhum produto encontrado para este filtro.</div>
              ) : (
                <>
                  {(showAllProducts ? productOptions : (selectedProduct ? [selectedProduct] : [])).map((productSeries) => {
                    const movement = getSeriesMovement(productSeries);
                    const variationColor = movement.diff > 0 ? "#991B1B" : movement.diff < 0 ? "#166534" : "#6D28D9";
                    const variationBg = movement.diff > 0 ? "#FEE2E2" : movement.diff < 0 ? "#DCFCE7" : "#F5F3FF";
                    const variationBorder = movement.diff > 0 ? "#FCA5A5" : movement.diff < 0 ? "#86EFAC" : "#DDD6FE";
                    return (
                      <div key={productSeries?.itemName || productSeries?.name} style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:6}}>
                          <div style={{fontWeight:900,fontSize:14,color:"#111827",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{productSeries?.itemName || productSeries?.name || "Produto"}</div>
                          <div style={{fontSize:11,fontWeight:900,color:variationColor,background:variationBg,border:`1px solid ${variationBorder}`,borderRadius:999,padding:"4px 8px",whiteSpace:"nowrap"}}>
                            {movement.diff > 0 ? "↑" : movement.diff < 0 ? "↓" : "→"} var. {movement.diff >= 0 ? "+" : ""}{formatBRL(movement.diff)}
                          </div>
                        </div>
                        <StatsLineChart series={productSeries ? [productSeries] : []} valueLabel="Preço" emptyText="Dados insuficientes." />
                      </div>
                    );
                  })}

                  {productOptions.length > 1 ? (
                    <button onClick={()=>setShowAllProducts(v=>!v)} style={{width:"100%",border:"1px solid #DDD6FE",background:"#F5F3FF",color:"#5B21B6",borderRadius:16,padding:"12px 14px",fontSize:14,fontWeight:950,fontFamily:"inherit",cursor:"pointer",marginBottom:12}}>
                      {showAllProducts ? "Mostrar apenas um produto" : `Ver todos os produtos (${productOptions.length})`}
                    </button>
                  ) : null}

                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                    <RankingMiniList title="🔺 Produtos que mais subiram" rows={topProductIncreases} positive={true} />
                    <RankingMiniList title="🔻 Produtos que mais caíram" rows={topProductDrops} positive={false} />
                  </div>
                </>
              )}
            </ExpandableSection>
            <ExpandableSection id="year" title="Evolução Mensal Consolidada" subtitle="Linha consolidada dos gastos executados por lista dentro do período analisado." openSection={openSection} setOpenSection={setOpenSection}>
              <StatsLineChart series={[consolidatedByListSeries]} valueLabel="Valor gasto" emptyText="Ainda não há evolução consolidada registrada." />
            </ExpandableSection>
          </>
        )}
      </div>
    </div>
  );
}
