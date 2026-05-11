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
  isFirstItem = false,
}) {
  const checked = Boolean(item?.checked);
  const notFound = Boolean(item?.notFound);
  const extra = Boolean(item?.extra || item?.addedDuringPurchase || isExtra);
  const total = getItemLineTotal ? getItemLineTotal(item) : 0;
  const unitPrice = getCompactUnitPriceLabel ? getCompactUnitPriceLabel(item) : "";
  const qtyLabel = formatQtyUnit
    ? formatQtyUnit(item?.qty || 1, item?.unit || "unidade")
    : `${item?.qty || 1} ${item?.unit || "unidade"}`;

  const accent = theme?.border || "#7C3AED";
  const accentHeader = theme?.header || "#047857";

  // Background: surface limpa, leve tom lilás
  const rowBg = notFound
    ? "#FAFAFC"
    : checked
      ? "linear-gradient(180deg, #F2FBF6 0%, #FFFFFF 75%)"
      : extra
        ? "linear-gradient(180deg, #FFFAF2 0%, #FFFFFF 75%)"
        : "#FFFFFF";

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "44px minmax(0,1fr) 40px",
        gap: 14,
        alignItems: "center",
        padding: "16px 16px",
        background: rowBg,
        borderBottom: isLast ? "none" : "1px solid rgba(100, 80, 200, 0.07)",
        transition:
          "background 240ms ease, box-shadow 240ms ease, opacity 240ms ease",
        boxShadow: isHighlighted
          ? `inset 3px 0 0 ${accent}, 0 0 0 1px rgba(124,58,237,0.05)`
          : "inset 0 0 0 0 transparent",
        opacity: notFound ? 0.74 : 1,
      }}
    >
      {/* Checkbox premium */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck?.(ci, realII);
        }}
        aria-label={checked ? "Desmarcar item" : "Marcar item comprado"}
        data-tour-step={isFirstItem ? "list_item_check" : undefined}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: checked
            ? "2px solid #16A34A"
            : `2px solid ${notFound ? "#E5E7EB" : "#D6CCFA"}`,
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
            ? "0 6px 14px -4px rgba(22, 163, 74, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)"
            : "0 1px 2px rgba(100, 80, 200, 0.08), inset 0 0 0 2px #FFFFFF",
          transform: "scale(1)",
          transition:
            "background 220ms ease, border-color 220ms ease, box-shadow 240ms ease, transform 160ms ease",
          ...checkHighlightStyle,
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span
          style={{
            display: "inline-block",
            transform: checked ? "scale(1)" : "scale(0)",
            transition: "transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            lineHeight: 1,
          }}
        >
          ✓
        </span>
      </button>

      {/* Body */}
      <button
        onClick={() => onOpenItem?.(ci, realII)}
        data-tour-step={isFirstItem ? "list_item_price" : undefined}
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
              letterSpacing: -0.15,
              color: notFound ? "#9CA3AF" : "#0F172A",
              textDecoration: notFound ? "line-through" : "none",
              textDecorationColor: notFound ? "#CBD5E1" : undefined,
              textDecorationThickness: notFound ? "1.5px" : undefined,
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
                background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
                border: "1px solid #FED7AA",
                borderRadius: 999,
                padding: "2px 8px",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                boxShadow: "0 1px 2px rgba(154, 52, 18, 0.08)",
              }}
            >
              Extra
            </span>
          )}
        </div>

        {/* Meta line: qty • unit price */}
        <div
          style={{
            marginTop: 5,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            fontSize: 12,
            fontWeight: 600,
            color: notFound ? "#9CA3AF" : "#6B7280",
            lineHeight: 1.35,
          }}
        >
          <span>{qtyLabel}</span>
          <span style={{ color: "#D6CCFA" }}>•</span>
          <span>{unitPrice || "Sem preço"}</span>
        </div>

        {/* Total — destacado */}
        <div style={{ marginTop: 7 }}>
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
                    ? hexToRgba(accentHeader, 0.09)
                    : "rgba(4, 120, 87, 0.09)",
                border: `1px solid ${
                  notFound
                    ? "#E5E7EB"
                    : hexToRgba
                      ? hexToRgba(accentHeader, 0.2)
                      : "rgba(4, 120, 87, 0.2)"
                }`,
                padding: "3px 10px",
                borderRadius: 10,
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
                display: "inline-block",
                fontSize: 10.5,
                fontWeight: 700,
                color: "#7C3AED",
                background: "#F3EFFF",
                border: "1px solid rgba(124, 58, 237, 0.14)",
                padding: "3px 9px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Total pendente
            </span>
          )}
        </div>

        {item?.price != null && PriceMonthBadge && (
          <div style={{ marginTop: 7 }}>
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
        data-tour-step={isFirstItem ? "list_item_missing" : undefined}
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          border: "1px solid " + (notFound ? "#FCA5A5" : "rgba(100, 80, 200, 0.14)"),
          background: notFound
            ? "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
            : "#FFFFFF",
          color: notFound ? "#B91C1C" : "#94A3B8",
          fontWeight: 800,
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: notFound
            ? "0 4px 10px -3px rgba(185, 28, 28, 0.25), inset 0 1px 0 rgba(255,255,255,0.4)"
            : "0 1px 2px rgba(100, 80, 200, 0.06)",
          transition:
            "background 220ms ease, color 220ms ease, border-color 220ms ease, transform 160ms ease, box-shadow 220ms ease",
          ...missingHighlightStyle,
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        ∅
      </button>
    </div>
  );
}
