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

  return (
    <ModalSheet onClose={() => {
      setItemDialog(null);
      setItemDialogMode("pending");
      setEditPendingIdx(null);
      setCurrentInput("");
    }}>
      <div style={{ fontWeight: 900, fontSize: 20, color: "#111827", marginBottom: 4 }}>
        🛒 {itemDialogMode === "extra" ? "Item extra" : itemDialogMode === "pantryReview" ? "Editar item da Itens em Casa" : itemDialog.name}
      </div>

      {itemDialogMode === "extra" && (
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#C2410C", borderRadius: 16, padding: "10px 12px", fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
          ➕ {itemDialog.name} será adicionado durante a compra e classificado automaticamente.
        </div>
      )}

      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
        {dlgLoading
          ? ""
          : itemDialogMode === "extra"
            ? "Defina quantidade, unidade e, se já estiver comprando, informe o preço."
            : (editPendingIdx != null || itemDialogMode === "pantryReview")
              ? "Editar item"
              : "Defina quantidade e unidade"}
      </div>

      {!dlgLoading && dlgConfig && (editPendingIdx != null || itemDialogMode === "pantryReview" || itemDialogMode === "pantry") && (
        <div style={{ marginBottom: 16 }}>
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #E6FAF2", borderTopColor: "#6D28D9", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 14, color: "#6B7280", fontWeight: 600 }}>✨ IA classificando...</div>
        </div>
      )}

      {!dlgLoading && dlgConfig && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Quantidade</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => changeManualQty(-1)} style={qBtn}>−</button>
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
                style={{ ...inp({ textAlign: "center", fontWeight: 900, fontSize: 22, padding: "10px 12px", maxWidth: 120, borderRadius: 18 }) }}
              />
              <button onClick={() => changeManualQty(1)} style={qBtn}>＋</button>
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
              Para kg e litro, os botões avançam de 0,5 em 0,5. Também é possível digitar o valor.
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Unidade</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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

          <div style={{ background: "#F5F3FF", borderRadius: 18, padding: "12px 14px", marginBottom: 16, fontSize: 14, color: "#6D28D9", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <span>✅</span><span>{buildManualPreview()}</span>
          </div>

          {itemDialogMode === "extra" && (() => {
            const previewItem = { name: itemDialog?.name || "", qty: dlgQty, unit: dlgUnit };
            const targetCategory = typeof getCategoryForExtraItem === "function" ? getCategoryForExtraItem(previewItem) : "Itens Extras";
            const priceLabel = typeof getExtraPriceInputLabel === "function" ? getExtraPriceInputLabel(previewItem, targetCategory) : "Preço";
            const hasPrice = typeof parseBRL === "function" && parseBRL(exPrice) != null && parseBRL(exPrice) > 0;

            return (
              <div style={{ marginBottom: 16, background: hasPrice ? "#ECFDF5" : "#FFF7ED", border: "1px solid " + (hasPrice ? "#A7F3D0" : "#FED7AA"), borderRadius: 18, padding: 12 }}>
                <label style={lbl}>{priceLabel} <span style={{ color: "#9CA3AF", fontWeight: 700 }}>(opcional)</span></label>
                <input
                  value={exPrice || ""}
                  onChange={(e) => setExPrice(formatMoneyInput ? formatMoneyInput(e.target.value) : e.target.value)}
                  placeholder="R$ 0,00"
                  inputMode="decimal"
                  style={inp({ height: 52, fontWeight: 900 })}
                />
                <div style={{ fontSize: 12, color: hasPrice ? "#047857" : "#9A3412", fontWeight: 800, marginTop: 8, lineHeight: 1.35 }}>
                  {hasPrice
                    ? "Com preço informado, o item entrará como comprado/adquirido."
                    : "Sem preço, o item entra pendente na categoria correta para marcar depois."}
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, marginTop: 6 }}>
                  Categoria prevista: {targetCategory}
                </div>
              </div>
            );
          })()}
        </>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => { setItemDialog(null); setEditPendingIdx(null); setCurrentInput(""); }}
          style={{ ...btnGr, flex: 1 }}
        >
          Cancelar
        </button>
        {!dlgLoading && (
          <button
            onClick={confirmDialog}
            style={{ flex: 2, padding: 14, borderRadius: 18, background: "linear-gradient(135deg,#6D28D9,#8B5CF6)", border: "none", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
          >
            {itemDialogMode === "extra" ? ((parseBRL && parseBRL(exPrice) != null && parseBRL(exPrice) > 0) ? "Adicionar como comprado ✓" : "Adicionar à lista ✓") : editPendingIdx != null ? "Atualizar ✓" : "Confirmar ✓"}
          </button>
        )}
      </div>
    </ModalSheet>
  );
}
