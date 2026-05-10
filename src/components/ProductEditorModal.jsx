import ModalSheet from "./ModalSheet";

export default function ProductEditorModal({
  itemDialog,
  setItemDialog,
  setItemDialogMode,
  setEditPendingIdx,
  setCurrentInput,
  itemDialogMode,
  dlgLoading,
  dlgConfig,
  editPendingIdx,
  lbl,
  inp,
  changeManualQty,
  qBtn,
  formatManualQty,
  dlgQty,
  setManualQtyFromText,
  setDlgQty,
  getManualQtyStep,
  getManualDialogUnits,
  handleManualUnitChange,
  chip,
  normalizeUnitValue,
  dlgUnit,
  formatUnitForQuantity,
  buildManualPreview,
  btnGr,
  confirmDialog,
  exPrice,
  setExPrice,
  formatMoneyInput,
  parseBRL,
  getExtraPriceInputLabel,
  getCategoryForExtraItem,
}) {
  if (!itemDialog) return null;

  const isExtra = itemDialogMode === "extra";
  const isPantryReview = itemDialogMode === "pantryReview";
  const eyebrow = isExtra
    ? "Item extra"
    : isPantryReview
    ? "Itens em Casa"
    : editPendingIdx != null
    ? "Editar item"
    : "Novo item";
  const title = isExtra
    ? "Item extra"
    : isPantryReview
    ? "Editar item da Itens em Casa"
    : itemDialog.name;

  return (
    <ModalSheet onClose={() => {
      setItemDialog(null);
      setItemDialogMode("pending");
      setEditPendingIdx(null);
      setCurrentInput("");
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#6D28D9",
            background: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
            border: "1px solid #DDD6FE",
            padding: "4px 10px",
            borderRadius: 999,
            marginBottom: 8,
          }}
        >
          🛒 {eyebrow}
        </div>
        <h2
          style={{
            margin: 0,
            fontWeight: 900,
            fontSize: 22,
            color: "#0F172A",
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
            wordBreak: "break-word",
          }}
        >
          {title}
        </h2>
        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 6, lineHeight: 1.45 }}>
          {dlgLoading
            ? ""
            : isExtra
              ? "Defina quantidade, unidade e, se já estiver comprando, informe o preço."
              : (editPendingIdx != null || isPantryReview)
                ? "Ajuste os detalhes deste item."
                : "Defina quantidade e unidade."}
        </div>
      </div>

      {isExtra && (
        <div
          style={{
            background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
            border: "1px solid #FED7AA",
            color: "#9A3412",
            borderRadius: 16,
            padding: "12px 14px",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 16,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            boxShadow: "0 4px 12px -6px rgba(234,88,12,0.25)",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>➕</span>
          <span style={{ lineHeight: 1.4 }}>
            <strong>{itemDialog.name}</strong> será adicionado durante a compra e classificado automaticamente.
          </span>
        </div>
      )}

      {!dlgLoading && dlgConfig && (editPendingIdx != null || isPantryReview || itemDialogMode === "pantry") && (
        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Nome do item</label>
          <input
            value={itemDialog.name || ""}
            onChange={(e) => setItemDialog((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nome do item"
            style={inp({ height: 52 })}
          />
        </div>
      )}

      {dlgLoading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "36px 0",
            gap: 14,
            background: "linear-gradient(135deg, #FAF5FF, #F5F3FF)",
            border: "1px solid #EDE9FE",
            borderRadius: 20,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "4px solid #EDE9FE",
              borderTopColor: "#6D28D9",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ fontSize: 14, color: "#6D28D9", fontWeight: 800 }}>
            ✨ IA classificando...
          </div>
        </div>
      )}

      {!dlgLoading && dlgConfig && (
        <>
          {/* Quantidade */}
          <div
            style={{
              marginBottom: 16,
              background: "linear-gradient(180deg, #FFFFFF, #FAFAFE)",
              border: "1px solid #EEF2F7",
              borderRadius: 20,
              padding: 14,
              boxShadow: "0 1px 0 rgba(17,24,39,0.02)",
            }}
          >
            <label style={lbl}>Quantidade</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <button onClick={() => changeManualQty(-1)} style={qBtn} aria-label="Diminuir">−</button>
              <input
                value={formatManualQty(dlgQty)}
                inputMode="decimal"
                onChange={(e) => setManualQtyFromText(e.target.value)}
                onBlur={() => {
                  const n = Number(String(dlgQty || "").replace(",", "."));
                  if (!Number.isFinite(n) || n <= 0) {
                    setDlgQty(getManualQtyStep());
                  } else {
                    setDlgQty(Number(n.toFixed(2)));
                  }
                }}
                style={{ ...inp({ textAlign: "center", fontWeight: 900, fontSize: 24, padding: "12px 12px", flex: 1, borderRadius: 16 }) }}
              />
              <button onClick={() => changeManualQty(1)} style={qBtn} aria-label="Aumentar">＋</button>
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 10, lineHeight: 1.4, fontWeight: 600 }}>
              Para kg e litro, os botões avançam de 0,5 em 0,5. Também é possível digitar o valor.
            </div>
          </div>

          {/* Unidade */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Unidade</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
              {getManualDialogUnits().map((u) => (
                <button
                  key={u}
                  onClick={() => handleManualUnitChange(u)}
                  style={chip(normalizeUnitValue(dlgUnit) === normalizeUnitValue(u), "#6B3FA0", "#F3EEF9", "#6B3FA0")}
                >
                  {formatUnitForQuantity(Number(dlgQty || 1), u)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            style={{
              background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
              border: "1px solid #DDD6FE",
              borderRadius: 18,
              padding: "12px 14px",
              marginBottom: 16,
              fontSize: 14,
              color: "#5B21B6",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 12px -8px rgba(109,40,217,0.3)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 999,
                background: "linear-gradient(135deg, #6D28D9, #8B5CF6)",
                color: "#fff",
                fontSize: 13,
                flexShrink: 0,
                boxShadow: "0 4px 10px -2px rgba(109,40,217,0.5)",
              }}
            >
              ✓
            </span>
            <span style={{ lineHeight: 1.35 }}>{buildManualPreview()}</span>
          </div>

          {isExtra && (() => {
            const previewItem = { name: itemDialog?.name || "", qty: dlgQty, unit: dlgUnit };
            const targetCategory = typeof getCategoryForExtraItem === "function" ? getCategoryForExtraItem(previewItem) : "Itens Extras";
            const priceLabel = typeof getExtraPriceInputLabel === "function" ? getExtraPriceInputLabel(previewItem, targetCategory) : "Preço";
            const hasPrice = typeof parseBRL === "function" && parseBRL(exPrice) != null && parseBRL(exPrice) > 0;
            return (
              <div
                style={{
                  marginBottom: 16,
                  background: hasPrice
                    ? "linear-gradient(135deg, #ECFDF5, #D1FAE5)"
                    : "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
                  border: "1px solid " + (hasPrice ? "#A7F3D0" : "#FED7AA"),
                  borderRadius: 18,
                  padding: 14,
                  boxShadow: hasPrice
                    ? "0 4px 14px -8px rgba(5,150,105,0.25)"
                    : "0 4px 14px -8px rgba(234,88,12,0.25)",
                }}
              >
                <label style={lbl}>
                  {priceLabel} <span style={{ color: "#9CA3AF", fontWeight: 700 }}>(opcional)</span>
                </label>
                <input
                  value={exPrice || ""}
                  onChange={(e) => setExPrice(formatMoneyInput ? formatMoneyInput(e.target.value) : e.target.value)}
                  placeholder="R$ 0,00"
                  inputMode="decimal"
                  style={inp({ height: 52, fontWeight: 900, fontSize: 17 })}
                />
                <div style={{ fontSize: 12, color: hasPrice ? "#047857" : "#9A3412", fontWeight: 800, marginTop: 8, lineHeight: 1.4 }}>
                  {hasPrice
                    ? "✓ Com preço informado, o item entrará como comprado/adquirido."
                    : "⏳ Sem preço, o item entra pendente na categoria correta para marcar depois."}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontWeight: 800,
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px dashed " + (hasPrice ? "#A7F3D0" : "#FED7AA"),
                  }}
                >
                  Categoria prevista: <span style={{ color: "#0F172A" }}>{targetCategory}</span>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Footer actions */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 6,
          paddingTop: 14,
          borderTop: "1px solid rgba(167,139,250,0.18)",
        }}
      >
        <button
          onClick={() => { setItemDialog(null); setEditPendingIdx(null); setCurrentInput(""); }}
          style={{ ...btnGr, flex: 1 }}
        >
          Cancelar
        </button>
        {!dlgLoading && (
          <button
            onClick={confirmDialog}
            style={{
              flex: 2,
              padding: "14px 16px",
              borderRadius: 18,
              background: "linear-gradient(135deg,#6D28D9 0%, #7C3AED 50%, #8B5CF6 100%)",
              border: "none",
              color: "white",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.005em",
              boxShadow:
                "0 12px 26px -10px rgba(109,40,217,0.65), 0 4px 10px -4px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
              WebkitTapHighlightColor: "transparent",
              transition: "transform 160ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms ease",
            }}
          >
            {isExtra
              ? ((parseBRL && parseBRL(exPrice) != null && parseBRL(exPrice) > 0) ? "Adicionar como comprado ✓" : "Adicionar à lista ✓")
              : editPendingIdx != null ? "Atualizar ✓" : "Confirmar ✓"}
          </button>
        )}
      </div>
    </ModalSheet>
  );
}
