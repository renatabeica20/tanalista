export default function PriceStatsPanel({ getPriceStatsSummary }) {
  const stats = getPriceStatsSummary();

  const panelStyle = {
    position: "relative",
    width: "100%",
    boxSizing: "border-box",
    margin: "14px 0 22px",
    padding: 18,
    borderRadius: 24,
    display: "block",
    clear: "both",
    background:
      "linear-gradient(140deg, #FFFFFF 0%, #FAF7FF 55%, #F3E8FF 100%)",
    border: "1px solid rgba(167,139,250,0.35)",
    boxShadow:
      "0 18px 40px -18px rgba(76,29,149,0.35), 0 6px 14px -8px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
    overflow: "hidden",
  };

  const decoration = (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(110% 60% at 100% 0%, rgba(167,139,250,0.18), transparent 55%), radial-gradient(80% 50% at 0% 100%, rgba(196,181,253,0.18), transparent 60%)",
      }}
    />
  );

  if (!stats.totalRecords) {
    return (
      <div style={panelStyle}>
        {decoration}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
              color: "#fff",
              fontSize: 18,
              boxShadow: "0 8px 18px -6px rgba(109,40,217,0.55)",
              flexShrink: 0,
            }}
          >
            📊
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 900,
                color: "#4C1D95",
                fontSize: 16,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              Estatísticas de preços
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.45, marginTop: 4 }}>
              As estatísticas aparecerão após o registro de preços nos itens comprados.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxMonthly = Math.max(...stats.monthlyTotals.map((x) => Number(x.total || 0)), 1);

  return (
    <div style={panelStyle}>
      {decoration}

      {/* Header */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 180px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
              color: "#fff",
              fontSize: 18,
              boxShadow: "0 10px 22px -8px rgba(109,40,217,0.6)",
              flexShrink: 0,
            }}
          >
            📊
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 900,
                color: "#4C1D95",
                fontSize: 16,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              Estatísticas de preços
            </div>
            <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 3, lineHeight: 1.4 }}>
              Histórico local de{" "}
              <span style={{ fontWeight: 800, color: "#4C1D95" }}>{stats.totalRecords}</span> preço(s)
            </div>
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            textAlign: "right",
            background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
            border: "1px solid #DDD6FE",
            borderRadius: 16,
            padding: "9px 12px",
            minWidth: 108,
            boxShadow: "inset 0 1px 0 #fff, 0 4px 10px -6px rgba(109,40,217,0.25)",
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              color: "#6D28D9",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              lineHeight: 1.1,
            }}
          >
            Ticket médio
          </div>
          <div
            style={{
              fontWeight: 900,
              color: "#111827",
              fontSize: 17,
              lineHeight: 1.15,
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
            }}
          >
            {stats.averageTicket.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
      </div>

      {/* Top variações */}
      {stats.topIncreases.length ? (
        <div style={{ position: "relative", marginTop: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "#4C1D95",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Maiores variações
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {stats.topIncreases.slice(0, 3).map((it, idx) => {
              const up = it.percent > 0;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: "#FFFFFF",
                    border: "1px solid #EEE7FB",
                    fontSize: 12.5,
                    boxShadow: "0 2px 6px -4px rgba(76,29,149,0.18)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      color: "#111827",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {it.itemName}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 9px",
                      borderRadius: 999,
                      fontWeight: 900,
                      fontSize: 12,
                      flexShrink: 0,
                      fontVariantNumeric: "tabular-nums",
                      color: up ? "#B91C1C" : "#166534",
                      background: up ? "#FEF2F2" : "#ECFDF5",
                      border: `1px solid ${up ? "#FECACA" : "#BBF7D0"}`,
                    }}
                  >
                    <span aria-hidden style={{ fontSize: 10 }}>{up ? "▲" : "▼"}</span>
                    {up ? "+" : ""}
                    {it.percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Evolução mensal */}
      {stats.monthlyTotals.length ? (
        <div style={{ position: "relative", marginTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "#4C1D95",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Evolução mensal
          </div>
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: 12,
              borderRadius: 16,
              background: "rgba(255,255,255,0.7)",
              border: "1px solid #EEE7FB",
              backdropFilter: "blur(6px)",
            }}
          >
            {stats.monthlyTotals.slice(-4).map((m) => {
              const width = Math.max(8, Math.round((Number(m.total || 0) / maxMonthly) * 100));
              const isMax = Number(m.total || 0) >= maxMonthly;
              return (
                <div
                  key={m.month}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr 88px",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 11.5,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      color: "#4B5563",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      fontSize: 10.5,
                    }}
                  >
                    {m.month}
                  </span>
                  <div
                    style={{
                      position: "relative",
                      height: 10,
                      background: "#F3EEFB",
                      borderRadius: 999,
                      overflow: "hidden",
                      boxShadow: "inset 0 1px 2px rgba(76,29,149,0.08)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${width}%`,
                        background: isMax
                          ? "linear-gradient(90deg,#6D28D9,#A855F7,#C084FC)"
                          : "linear-gradient(90deg,#7C3AED,#A78BFA)",
                        borderRadius: 999,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 0 8px rgba(124,58,237,0.25)",
                        transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontWeight: 900,
                      color: "#111827",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {m.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
