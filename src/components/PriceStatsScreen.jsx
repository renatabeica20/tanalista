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

  const stats =
    typeof getPriceStatsSummary === "function"
      ? getPriceStatsSummary(Array.isArray(lists) ? lists : [])
      : { totalRecords: 0 };

  const normalizeStatsKey =
    typeof normalizeCacheKey === "function"
      ? normalizeCacheKey
      : (value) => String(value || "").toLowerCase().trim();

  const shortListLabel = (value, fallback = "Lista", total = 1) => {
    const raw = String(value || fallback).trim() || fallback;
    const clean = raw.replace(/\s+/g, " ").trim();
    const max = total >= 10 ? 4 : total >= 7 ? 6 : total >= 5 ? 8 : 12;
    return clean.length > max ? clean.slice(0, max).trim() + "…" : clean;
  };

  const budgetRows = stats.budgetSeries || [];

  const budgetSpentSeries = {
    name: "Gasto real",
    color: "#6D28D9",
    points: budgetRows.map((p) => {
      const spent = Number(p.spent || 0);
      const budget = Number(p.budget || 0);
      const balance = Number((budget - spent).toFixed(2));
      return {
        label: shortListLabel(p.label || p.listName, "Lista", budgetRows.length),
        date: p.date,
        listName: p.listName || p.label,
        value: spent,
        meta: [
          { label: "Orçamento", value: budget > 0 ? formatBRL(budget) : "não definido" },
          { label: balance >= 0 ? "Economia" : "Estouro", value: formatBRL(Math.abs(balance)), color: balance >= 0 ? "#BBF7D0" : "#FECACA" }
        ]
      };
    })
  };

  const budgetLimitSeries = {
    name: "Orçamento",
    color: "#16A34A",
    points: budgetRows.filter((p) => Number(p.budget || 0) > 0).map((p) => ({
      label: shortListLabel(p.label || p.listName, "Lista", budgetRows.length),
      date: p.date,
      listName: p.listName || p.label,
      value: Number(p.budget || 0),
      meta: [
        { label: "Gasto real", value: formatBRL(p.spent || 0) },
        { label: "Saldo", value: formatBRL(Math.abs(Number(p.budget || 0) - Number(p.spent || 0))), color: Number(p.budget || 0) >= Number(p.spent || 0) ? "#BBF7D0" : "#FECACA" }
      ]
    }))
  };

  const normalizeStatsSearch = (value) => normalizeStatsKey(value || "");

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
    if (points.length < 2) return { diff: 0, percent: 0 };
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
          meta.push({ label, value: "Primeiro registro", color: "#FFFFFF" });
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
    name: "Gasto executado",
    color: "#DC2626",
    points: budgetRows.map((p) => ({
      label: shortListLabel(p.label || p.listName, "Lista", budgetRows.length),
      date: p.date,
      listName: p.listName || p.label,
      value: Number(p.spent || 0),
      valueColor: "#FCA5A5",
      meta: []
    }))
  }, "Variação anterior");

  // ---------- Visual helpers ----------
  const keyframes = `
    @keyframes tnl-stats-in { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }
    .tnl-stats-card { animation: tnl-stats-in 320ms cubic-bezier(0.22,1,0.36,1) both; }
    .tnl-stats-back { transition: transform 180ms cubic-bezier(0.22,1,0.36,1), background 180ms ease; -webkit-tap-highlight-color: transparent; }
    .tnl-stats-back:active { transform: scale(0.92); background: rgba(255,255,255,0.28) !important; }
    .tnl-stats-input { transition: border-color 160ms ease, box-shadow 160ms ease; }
    .tnl-stats-input:focus { border-color:#8B5CF6 !important; box-shadow: 0 0 0 4px rgba(139,92,246,0.18); }
    .tnl-stats-toggle { transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease; -webkit-tap-highlight-color: transparent; }
    .tnl-stats-toggle:active { transform: scale(0.98); }
  `;

  const RankingMiniList = ({ title, rows = [], positive = true, emptyText = "Sem variação suficiente" }) => {
    const accent = positive
      ? { text: "#991B1B", bg: "linear-gradient(135deg,#FFFFFF 0%,#FEF2F2 100%)", border: "#FECACA" }
      : { text: "#166534", bg: "linear-gradient(135deg,#FFFFFF 0%,#F0FDF4 100%)", border: "#BBF7D0" };
    return (
      <div
        style={{
          background: accent.bg,
          border: `1px solid ${accent.border}`,
          borderRadius: 18,
          padding: 12,
          boxShadow: "0 8px 22px -10px rgba(17,24,39,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 950,
            color: accent.text,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        {!rows.length ? (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}>{emptyText}</div>
        ) : (
          rows.map((row, idx) => (
            <div
              key={`${title}-${row.name}-${idx}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                padding: idx ? "8px 0 0" : "0",
                borderTop: idx ? "1px solid rgba(124,58,237,0.08)" : "none",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: "#111827",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.name}
              </span>
              <span
                style={{
                  fontWeight: 950,
                  color: row.diff >= 0 ? "#991B1B" : "#166534",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                  background: row.diff >= 0 ? "#FEE2E2" : "#DCFCE7",
                  border: `1px solid ${row.diff >= 0 ? "#FCA5A5" : "#86EFAC"}`,
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 11,
                }}
              >
                {row.diff >= 0 ? "+" : ""}{row.percent}%
              </span>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        background:
          "radial-gradient(120% 70% at 0% 0%, rgba(167,139,250,0.18), transparent 55%), radial-gradient(100% 60% at 100% 0%, rgba(196,181,253,0.15), transparent 60%), linear-gradient(180deg,#FAF7FF 0%,#FFFFFF 48%,#F9FAFB 100%)",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
        paddingRight: "max(14px, env(safe-area-inset-right, 0px))",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
        paddingLeft: "max(14px, env(safe-area-inset-left, 0px))",
        boxSizing: "border-box",
        fontFamily: "inherit",
      }}
    >
      <style>{keyframes}</style>

      <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", boxSizing: "border-box", overflow: "visible" }}>
        {/* Header premium */}
        <div
          className="tnl-stats-card"
          style={{
            position: "relative",
            background:
              "linear-gradient(135deg,#4C1D95 0%,#6D28D9 45%,#8B5CF6 100%)",
            borderRadius: 26,
            padding: "18px 16px",
            color: "#FFFFFF",
            boxShadow:
              "0 22px 50px -18px rgba(76,29,149,0.55), 0 8px 18px -10px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            marginBottom: 18,
            boxSizing: "border-box",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(60% 80% at 100% 0%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(50% 70% at 0% 100%, rgba(255,255,255,0.10), transparent 60%)",
            }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
            <button
              onClick={onBack}
              className="tnl-stats-back"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.32)",
                background: "rgba(255,255,255,0.18)",
                color: "#FFFFFF",
                fontSize: 22,
                fontWeight: 900,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
              aria-label="Voltar"
            >
              ←
            </button>
            <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "clamp(19px, 5.6vw, 24px)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "-0.01em",
                }}
              >
                Estatísticas de preços
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  opacity: 0.9,
                  marginTop: 5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "0.02em",
                }}
              >
                Análise limpa por lista, seção e produto
              </div>
            </div>
            <div style={{ width: 42, flexShrink: 0 }} />
          </div>

          {stats.totalRecords ? (
            <div
              style={{
                position: "relative",
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 11px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.28)",
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "0.02em",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <span aria-hidden>📈</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {stats.totalRecords} registro{stats.totalRecords === 1 ? "" : "s"} de preço
              </span>
            </div>
          ) : null}
        </div>

        {!stats.totalRecords ? (
          <div
            className="tnl-stats-card"
            style={{
              background: "linear-gradient(135deg,#FFFFFF 0%,#FBFAFF 100%)",
              border: "1px dashed #DDD6FE",
              borderRadius: 24,
              padding: 28,
              textAlign: "center",
              boxShadow: "0 16px 32px -16px rgba(76,29,149,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                margin: "0 auto 12px",
                display: "grid",
                placeItems: "center",
                fontSize: 30,
                background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
                border: "1px solid #DDD6FE",
                boxShadow: "inset 0 1px 0 #fff, 0 8px 18px -8px rgba(109,40,217,0.3)",
              }}
            >
              📊
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#4C1D95", marginBottom: 6, letterSpacing: "-0.01em" }}>
              Ainda não há estatísticas
            </div>
            <div style={{ fontSize: 13.5, color: "#6B7280", lineHeight: 1.5, maxWidth: 320, margin: "0 auto" }}>
              Finalize listas com preços para acompanhar a evolução dos gastos.
            </div>
          </div>
        ) : (
          <>
            <ExpandableSection
              id="budget"
              title="Orçamento x Gasto"
              subtitle="Toque nos pontos do gráfico para ver lista, orçamento, gasto e economia/estouro."
              openSection={openSection}
              setOpenSection={setOpenSection}
            >
              <StatsLineChart
                series={[budgetSpentSeries, budgetLimitSeries].filter((s) => s.points.length)}
                valueLabel="Valor"
                emptyText="Ainda não há listas com gasto e orçamento suficientes."
              />
            </ExpandableSection>

            <ExpandableSection
              id="category"
              title="Gasto por Seção"
              subtitle="Selecione uma seção para acompanhar sua evolução ao longo das listas."
              openSection={openSection}
              setOpenSection={setOpenSection}
            >
              {categorySeriesAll.length ? (
                <>
                  <select
                    value={selectedCategory ? (selectedCategory.itemName || selectedCategory.name) : ""}
                    onChange={(e) => setSelectedCategoryName(e.target.value)}
                    className="tnl-stats-input"
                    style={{
                      width: "100%",
                      border: "1px solid #DDD6FE",
                      borderRadius: 16,
                      padding: "12px 13px",
                      fontSize: 15,
                      fontWeight: 800,
                      outline: "none",
                      marginBottom: 12,
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      background: "linear-gradient(135deg,#FFFFFF,#FBFAFF)",
                      color: "#1F2937",
                      boxShadow: "inset 0 1px 0 #fff, 0 2px 6px -3px rgba(76,29,149,0.18)",
                      appearance: "none",
                    }}
                  >
                    {categorySeriesAll.map((sec) => {
                      const name = sec.itemName || sec.name;
                      return (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  <StatsLineChart
                    series={selectedCategory ? [selectedCategory] : []}
                    valueLabel="Gasto"
                    emptyText="Ainda não há dados suficientes por seção."
                  />
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.45, padding: "8px 2px" }}>
                  Ainda não há dados suficientes por seção.
                </div>
              )}
            </ExpandableSection>

            <ExpandableSection
              id="product"
              title="Evolução do Preço por Produto"
              subtitle="Pesquise um produto e visualize um gráfico por vez, com opção para listar todos."
              openSection={openSection}
              setOpenSection={setOpenSection}
            >
              <div style={{ position: "relative", marginBottom: 12 }}>
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 15,
                    color: "#8B5CF6",
                    pointerEvents: "none",
                  }}
                >
                  🔎
                </span>
                <input
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    setSelectedProductName("");
                    setShowAllProducts(false);
                  }}
                  placeholder="Buscar produto..."
                  className="tnl-stats-input"
                  style={{
                    width: "100%",
                    border: "1px solid #DDD6FE",
                    borderRadius: 16,
                    padding: "12px 13px 12px 38px",
                    fontSize: 15,
                    fontWeight: 700,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    background: "linear-gradient(135deg,#FFFFFF,#FBFAFF)",
                    color: "#1F2937",
                    boxShadow: "inset 0 1px 0 #fff, 0 2px 6px -3px rgba(76,29,149,0.18)",
                  }}
                />
              </div>
              {!productOptions.length ? (
                <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 700, padding: "8px 2px" }}>
                  Nenhum produto encontrado para este filtro.
                </div>
              ) : (
                <>
                  {(showAllProducts ? productOptions : (selectedProduct ? [selectedProduct] : [])).map((productSeries) => {
                    const movement = getSeriesMovement(productSeries);
                    const isUp = movement.diff > 0;
                    const isDown = movement.diff < 0;
                    const variationColor = isUp ? "#991B1B" : isDown ? "#166534" : "#6D28D9";
                    const variationBg = isUp
                      ? "linear-gradient(135deg,#FEE2E2,#FECACA)"
                      : isDown
                      ? "linear-gradient(135deg,#DCFCE7,#BBF7D0)"
                      : "linear-gradient(135deg,#F5F3FF,#EDE9FE)";
                    const variationBorder = isUp ? "#FCA5A5" : isDown ? "#86EFAC" : "#DDD6FE";
                    return (
                      <div
                        key={productSeries?.itemName || productSeries?.name}
                        style={{
                          background: "linear-gradient(135deg,#FFFFFF,#FBFAFF)",
                          border: "1px solid rgba(167,139,250,0.25)",
                          borderRadius: 20,
                          padding: 14,
                          marginBottom: 12,
                          boxShadow:
                            "0 10px 24px -14px rgba(76,29,149,0.22), inset 0 1px 0 rgba(255,255,255,0.9)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: 14,
                              color: "#1F2937",
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {productSeries?.itemName || productSeries?.name || "Produto"}
                          </div>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 900,
                              color: variationColor,
                              background: variationBg,
                              border: `1px solid ${variationBorder}`,
                              borderRadius: 999,
                              padding: "4px 9px",
                              whiteSpace: "nowrap",
                              fontVariantNumeric: "tabular-nums",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                            }}
                          >
                            <span aria-hidden style={{ fontSize: 10 }}>
                              {isUp ? "▲" : isDown ? "▼" : "→"}
                            </span>
                            var. {movement.diff >= 0 ? "+" : ""}
                            {formatBRL(movement.diff)}
                          </div>
                        </div>
                        <StatsLineChart
                          series={productSeries ? [productSeries] : []}
                          valueLabel="Preço"
                          emptyText="Dados insuficientes."
                        />
                      </div>
                    );
                  })}
                  {productOptions.length > 1 ? (
                    <button
                      onClick={() => setShowAllProducts((v) => !v)}
                      className="tnl-stats-toggle"
                      style={{
                        width: "100%",
                        border: "1px solid #DDD6FE",
                        background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
                        color: "#5B21B6",
                        borderRadius: 16,
                        padding: "12px 14px",
                        fontSize: 13.5,
                        fontWeight: 900,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        marginBottom: 14,
                        letterSpacing: "0.01em",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.9), 0 6px 14px -8px rgba(109,40,217,0.3)",
                      }}
                    >
                      {showAllProducts ? "Mostrar apenas um produto" : `Ver todos os produtos (${productOptions.length})`}
                    </button>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
                    <RankingMiniList title="🔺 Mais subiram" rows={topProductIncreases} positive={true} />
                    <RankingMiniList title="🔻 Mais caíram" rows={topProductDrops} positive={false} />
                  </div>
                </>
              )}
            </ExpandableSection>

            <ExpandableSection
              id="year"
              title="Evolução Mensal Consolidada"
              subtitle="Linha consolidada dos gastos executados por lista dentro do período analisado."
              openSection={openSection}
              setOpenSection={setOpenSection}
            >
              <StatsLineChart
                series={[consolidatedByListSeries]}
                valueLabel="Valor gasto"
                emptyText="Ainda não há evolução consolidada registrada."
              />
            </ExpandableSection>
          </>
        )}
      </div>
    </div>
  );
}
