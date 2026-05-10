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
  const qtyLabel = formatQtyUnit
    ? formatQtyUnit(item?.qty || 1, item?.unit || "unidade")
    : `${item?.qty || 1} ${item?.unit || "unidade"}`;

  const accent = theme?.border || "#8B5CF6";
  const accentHeader = theme?.header || "#047857";

  // Background: subtle surface, not loud
  const rowBg = notFound
    ? "#FAFAFA"
    : checked
      ? "linear-gradient(180deg, #F6FDF9 0%, #FFFFFF 100%)"
      : extra
        ? "linear-gradient(180deg, #FFFBF4 0%, #FFFFFF 100%)"
        : "#FFFFFF";

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "40px minmax(0,1fr) 38px",
        gap: 12,
        alignItems: "center",
        padding: "14px 14px",
        background: rowBg,
        borderBottom: isLast ? "none" : "1px solid rgba(15, 23, 42, 0.06)",
        transition:
          "background 220ms ease, box-shadow 220ms ease, opacity 220ms ease",
        boxShadow: isHighlighted
          ? `inset 3px 0 0 ${accent}`
          : "inset 0 0 0 0 transparent",
        opacity: notFound ? 0.78 : 1,
      }}
    >
      {/* Checkbox premium */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck?.(ci, realII);
        }}
        aria-label={checked ? "Desmarcar item" : "Marcar item comprado"}
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: checked
            ? "2px solid #16A34A"
            : `2px solid ${notFound ? "#E5E7EB" : "#D1D5DB"}`,
          background: checked
            ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
            : "#FFFFFF",
          color: "#FFFFFF",
          fontWeight: 900,
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: checked
            ? "0 4px 10px -2px rgba(22, 163, 74, 0.45), inset 0 1px 0 rgba(255,255,255,0.25)"
            : "0 1px 2px rgba(15, 23, 42, 0.06)",
          transform: checked ? "scale(1)" : "scale(1)",
          transition:
            "background 200ms ease, border-color 200ms ease, box-shadow 220ms ease, transform 160ms ease",
          ...checkHighlightStyle,
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span
          style={{
            display: "inline-block",
            transform: checked ? "scale(1)" : "scale(0)",
            transition: "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            lineHeight: 1,
          }}
        >
          ✓
        </span>
      </button>

      {/* Body */}
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
          ...priceHighlightStyle,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 15.5,
              fontWeight: 700,
              letterSpacing: -0.1,
              color: notFound ? "#6B7280" : "#0F172A",
              textDecoration: notFound ? "line-through" : "none",
              textDecorationColor: notFound ? "#9CA3AF" : undefined,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: extra ? "calc(100% - 76px)" : "100%",
              transition: "color 200ms ease",
            }}
          >
            {item?.name || "Item sem nome"}
          </span>

          {extra && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 9.5,
                fontWeight: 800,
                color: "#9A3412",
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                borderRadius: 999,
                padding: "2px 8px",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Extra
            </span>
          )}
        </div>

        {/* Meta line: qty • unit price */}
        <div
          style={{
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            fontSize: 12,
            fontWeight: 600,
            color: notFound ? "#9CA3AF" : "#64748B",
            lineHeight: 1.35,
          }}
        >
          <span>{qtyLabel}</span>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <span>{unitPrice || "Sem preço"}</span>
        </div>

        {/* Total — destacado */}
        <div style={{ marginTop: 6 }}>
          {total > 0 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 4,
                fontVariantNumeric: "tabular-nums",
                color: notFound ? "#9CA3AF" : accentHeader,
                background: notFound
                  ? "#F3F4F6"
                  : hexToRgba
                    ? hexToRgba(accentHeader, 0.08)
                    : "rgba(4, 120, 87, 0.08)",
                border: `1px solid ${
                  notFound
                    ? "#E5E7EB"
                    : hexToRgba
                      ? hexToRgba(accentHeader, 0.18)
                      : "rgba(4, 120, 87, 0.18)"
                }`,
                padding: "3px 9px",
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 13.5,
                letterSpacing: -0.1,
              }}
            >
              {fmtR ? fmtR(total) : total}
            </span>
          ) : (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Total pendente
            </span>
          )}
        </div>

        {item?.price != null && PriceMonthBadge && (
          <div style={{ marginTop: 6 }}>
            <PriceMonthBadge
              itemName={item.name}
              price={item.price}
              recordedAt={item.priceRecordedAt || null}
            />
          </div>
        )}

        {PriceMemoryLine && (
          <div style={{ marginTop: 4 }}>
            <PriceMemoryLine item={item} />
          </div>
        )}
      </button>

      {/* Not-found toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleNotFound?.(ci, realII);
        }}
        aria-label={notFound ? "Retirar item de falta" : "Marcar item em falta"}
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          border: "1px solid " + (notFound ? "#FCA5A5" : "#E5E7EB"),
          background: notFound ? "#FEE2E2" : "#FFFFFF",
          color: notFound ? "#B91C1C" : "#94A3B8",
          fontWeight: 800,
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: notFound
            ? "inset 0 0 0 1px rgba(185, 28, 28, 0.06)"
            : "0 1px 2px rgba(15, 23, 42, 0.04)",
          transition:
            "background 200ms ease, color 200ms ease, border-color 200ms ease, transform 160ms ease",
          ...missingHighlightStyle,
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        ∅
      </button>
    </div>
  );
}
