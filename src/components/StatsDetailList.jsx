export default function StatsDetailList({
  rows = [],
  labelKey = "label",
  valueKey = "value",
  formatBRL,
}) {
  if (!rows.length) return null;

  return (
    <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
      {rows.slice(-8).map((row, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            background: "#fff",
            borderRadius: 12,
            padding: "10px 12px",
          }}
        >
          <span
            style={{
              fontWeight: 900,
              color: "#374151",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row[labelKey]}
          </span>

          <span
            style={{
              fontWeight: 900,
              color: "#111827",
              whiteSpace: "nowrap",
            }}
          >
            {formatBRL(row[valueKey] || 0)}
          </span>
        </div>
      ))}
    </div>
  );
}
