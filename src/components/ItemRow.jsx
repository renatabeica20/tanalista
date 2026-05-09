export default function ItemRow({
  item,
  ci,
  realII,
  theme,
  isExtra,
  isHighlighted,
  isLast,
  onOpenItem,
  onToggleCheck,
  onToggleNotFound,
  formatQtyUnit,
  getItemLineTotal,
  getCompactUnitPriceLabel,
  fmtR,
  hexToRgba,
  PriceMonthBadge,
  PriceMemoryLine,
  priceHighlightStyle = {},
  checkHighlightStyle = {},
  missingHighlightStyle = {},
}) {
  const checked = Boolean(item?.checked);
  const notFound = Boolean(item?.notFound);
  const extra = Boolean(item?.extra || item?.addedDuringPurchase || isExtra);
  const total = getItemLineTotal ? getItemLineTotal(item) : 0;
  const unitPrice = getCompactUnitPriceLabel ? getCompactUnitPriceLabel(item) : "";
  const qtyLabel = formatQtyUnit ? formatQtyUnit(item?.qty || 1, item?.unit || "unidade") : `${item?.qty || 1} ${item?.unit || "unidade"}`;
  const faded = checked || notFound;
  const borderColor = isHighlighted ? theme?.border || "#8B5CF6" : "#EEF2F7";

  const rowBg = notFound
    ? "#F9FAFB"
    : checked
      ? "#F0FDF4"
      : extra
        ? "#FFF7ED"
        : "#FFFFFF";

  const line2 = [
    qtyLabel,
    unitPrice || "Sem preço",
    total > 0 ? `Total ${fmtR(total)}` : "Total pendente",
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "38px minmax(0,1fr) 38px",
        gap: 10,
        alignItems: "center",
        padding: "12px 12px",
        background: rowBg,
        borderBottom: isLast ? "none" : "1px solid #F1F5F9",
        boxShadow: isHighlighted ? `inset 4px 0 0 ${theme?.border || "#8B5CF6"}` : "none",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck?.(ci, realII);
        }}
        aria-label={checked ? "Desmarcar item" : "Marcar item comprado"}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "2px solid " + (checked ? "#16A34A" : theme?.border || "#CBD5E1"),
          background: checked ? "#16A34A" : "#FFFFFF",
          color: "#FFFFFF",
          fontWeight: 900,
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...checkHighlightStyle,
        }}
      >
        {checked ? "✓" : ""}
      </button>

      <button
        onClick={() => onOpenItem?.(ci, realII)}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          textAlign: "left",
          minWidth: 0,
          cursor: "pointer",
          fontFamily: "inherit",
          opacity: notFound ? 0.62 : 1,
          ...priceHighlightStyle,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 950,
              color: notFound ? "#6B7280" : "#111827",
              textDecoration: notFound ? "line-through" : "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: extra ? "calc(100% - 76px)" : "100%",
            }}
          >
            {item?.name || "Item sem nome"}
          </span>

          {extra && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 950,
                color: "#C2410C",
                background: "#FFEDD5",
                border: "1px solid #FDBA74",
                borderRadius: 999,
                padding: "3px 7px",
                letterSpacing: 0.2,
              }}
            >
              EXTRA
            </span>
          )}
        </div>

        <div
          style={{
            marginTop: 5,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            fontSize: 12,
            fontWeight: 800,
            color: notFound ? "#9CA3AF" : "#6B7280",
            lineHeight: 1.35,
          }}
        >
          <span>{line2[0]}</span>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <span>{line2[1]}</span>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <span style={{ color: total > 0 ? theme?.header || "#047857" : "#9CA3AF" }}>{line2[2]}</span>
        </div>

        {item?.price != null && PriceMonthBadge && (
          <div style={{ marginTop: 5 }}>
            <PriceMonthBadge itemName={item.name} price={item.price} recordedAt={item.priceRecordedAt || null} />
          </div>
        )}

        {PriceMemoryLine && (
          <div style={{ marginTop: 4 }}>
            <PriceMemoryLine item={item} />
          </div>
        )}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleNotFound?.(ci, realII);
        }}
        aria-label={notFound ? "Retirar item de falta" : "Marcar item em falta"}
        style={{
          width: 34,
          height: 34,
          borderRadius: 13,
          border: "1px solid " + (notFound ? "#FCA5A5" : "#E5E7EB"),
          background: notFound ? "#FEE2E2" : "#F9FAFB",
          color: notFound ? "#B91C1C" : "#6B7280",
          fontWeight: 950,
          fontSize: 16,
          cursor: "pointer",
          ...missingHighlightStyle,
        }}
      >
        ∅
      </button>
    </div>
  );
}
