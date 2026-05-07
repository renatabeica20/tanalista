export default function PriceStatsEntryCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        borderRadius: 18,
        padding: "14px 16px",
        margin: "18px 0 22px",
        boxShadow: "0 8px 18px rgba(17,24,39,0.05)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        clear: "both",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F5F3FF",
            color: "#5B21B6",
            fontSize: 21,
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
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Estatísticas de preços
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#6B7280",
              marginTop: 3,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Ver análise de variação dos itens comprados
          </div>
        </div>
      </div>

      <div
        style={{
          color: "#7C3AED",
          fontWeight: 900,
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        ›
      </div>
    </button>
  );
}
