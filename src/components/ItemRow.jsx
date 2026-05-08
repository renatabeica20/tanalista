# ItemRow.jsx — ETAPA 2

Substitua integralmente o arquivo:

`src/components/ItemRow.jsx`

```jsx
export default function ItemRow({
  item,
  ci,
  ii,
  realII,
  theme,
  isExtra = false,
  isHighlighted = false,
  isLast = false,
  currentList,
  onOpenItem,
  onToggleCheck,
  onToggleNotFound,
  showToast,
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
  if (!item) return null;

  const descLine = [item.name, item.detail].filter(Boolean).join(" ");
  const qtyLabel = formatQtyUnit(item.qty || 1, item.unit || "unidade");
  const titleLine = `${qtyLabel} – ${descLine}`;
  const hasPrice = item.price != null;
  const totalItemPrice = hasPrice ? fmtR(getItemLineTotal(item)) : "";
  const unitPriceLabel = hasPrice ? getCompactUnitPriceLabel(item) : "";

  // ─────────────────────────────────────────────────────
  // AGORA O ITEM PODE SER EDITADO MESMO APÓS AQUISIÇÃO
  // ─────────────────────────────────────────────────────

  const handleOpen = () => {
    if (item.notFound) return;

    // mantém abertura para edição mesmo adquirido
    onOpenItem?.(ci, realII);
  };

  // ─────────────────────────────────────────────────────
  // MARCAR COMO ADQUIRIDO SEM JOGAR A TELA PARA O TOPO
  // ─────────────────────────────────────────────────────

  const handleToggleCheck = (event) => {
    event.stopPropagation();

    if (item.notFound) {
      showToast?.("⚠️ Item em falta. Volte para pendente antes de marcar como adquirido.");
      return;
    }

    // mantém posição visual do item
    const rowElement = event.currentTarget.closest("[data-item-row]");
    const scrollY = window.scrollY;

    onToggleCheck?.(ci, realII);

    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollY,
        behavior: "auto",
      });

      rowElement?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    });
  };

  const handleToggleNotFound = (event) => {
    event.stopPropagation();
    onToggleNotFound?.(ci, realII);
  };

  return (
    <div
      data-item-row
      onClick={handleOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "15px 16px",
        borderBottom: isLast ? "none" : `1px solid ${hexToRgba(theme.border, 0.10)}`,
        background: isHighlighted
          ? "#FFFDE7"
          : item.notFound
            ? "#FFFBEB"
            : item.checked
              ? hexToRgba(theme.border, 0.055)
              : "rgba(255,255,255,0.98)",
        opacity: item.notFound ? 0.46 : item.checked ? 0.62 : 1,
        filter: item.notFound ? "grayscale(0.15)" : "none",
        cursor: item.notFound ? "not-allowed" : "pointer",
        transition: "background 0.15s",
        ...priceHighlightStyle,
      }}
    >
      <div
        onClick={handleToggleCheck}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `2.5px solid ${item.checked ? theme.border : item.notFound ? "#F59E0B" : "#E5E7EB"}`,
          background: item.checked ? theme.border : item.notFound ? "#FEF3C7" : "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 15,
          color: "white",
          cursor: item.notFound ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          boxShadow: item.checked
            ? `0 8px 18px ${hexToRgba(theme.border, 0.22)}`
            : "0 3px 10px rgba(15,23,42,0.04)",
          ...checkHighlightStyle,
        }}
      >
        {item.checked ? "✓" : ""}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: item.checked
              ? "#9E9E9E"
              : item.notFound
                ? "#92400E"
                : "#0F172A",
            textDecoration: item.checked ? "line-through" : "none",
            textDecorationColor: item.checked ? "#EF4444" : "inherit",
            textDecorationThickness: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
            letterSpacing: "-0.25px",
          }}
        >
          {titleLine}

          {isExtra && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "#FF7043",
                color: "white",
                padding: "2px 6px",
                borderRadius: 180,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              extra
            </span>
          )}

          {item.qtyAdjusted && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: "#EEF2FF",
                color: "#4C1D95",
                padding: "2px 6px",
                borderRadius: 180,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              qtd. ajustada
            </span>
          )}

          {item.notFound && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                background: "#DC2626",
                color: "white",
                padding: "2px 7px",
                borderRadius: 180,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              em falta
            </span>
          )}

          {item.checked && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: "#DCFCE7",
                color: "#166534",
                padding: "2px 7px",
                borderRadius: 180,
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              adquirido
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 12,
            marginTop: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          {hasPrice ? (
            <span
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: item.checked ? "#9E9E9E" : "#374151",
              }}
            >
              {unitPriceLabel}
            </span>
          ) : (
            <span style={{ color: "#6B7280" }}>
              Toque para editar item
            </span>
          )}

          {hasPrice ? (
            <span
              style={{
                fontWeight: 900,
                fontSize: 14,
                color: item.checked ? "#9E9E9E" : theme.header,
                flexShrink: 0,
              }}
            >
              {totalItemPrice}
            </span>
          ) : (
            <span
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                flexShrink: 0,
              }}
            >
              editar
            </span>
          )}
        </div>

        {hasPrice && PriceMonthBadge && (
          <PriceMonthBadge
            itemName={item.name}
            price={item.price}
            recordedAt={item.priceRecordedAt || item.checkedAt || null}
            listId={currentList?.id}
            itemId={item.id || item.name}
            compact
          />
        )}

        {!hasPrice && PriceMemoryLine && (
          <PriceMemoryLine itemName={item.name} />
        )}
      </div>

      <button
        onClick={handleToggleNotFound}
        title={item.notFound ? "Voltar para pendente" : "Marcar item em falta"}
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: "2px solid " + (item.notFound ? "#DC2626" : "#E5E7EB"),
          background: item.notFound ? "#FEE2E2" : "#FFFFFF",
          color: item.notFound ? "#991B1B" : "#9CA3AF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 17,
          fontWeight: 900,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
          ...missingHighlightStyle,
        }}
      >
        {item.notFound ? "!" : "∅"}
      </button>
    </div>
  );
}
```

## O que esta etapa corrige

✅ Permite editar item mesmo após marcar como adquirido

✅ Evita rolagem automática para o topo da tela

✅ Mantém foco visual no item marcado

✅ Melhora experiência mobile/iPhone

✅ Mantém compatibilidade com estrutura atual do app

## Agora faça

1. Substitua o arquivo:

`src/components/ItemRow.jsx`

2. Commit:

`Melhoria na edição de itens adquiridos`

3. Aguarde o deploy verde da Vercel
