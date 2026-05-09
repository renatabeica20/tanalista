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
        🛒 {itemDialogMode === "pantryReview" ? "Editar item da Itens em Casa" : itemDialog.name}
      </div>

      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
        {dlgLoading
          ? ""
          : itemDialogMode === "extra"
            ? "Defina quantidade e unidade do item extra"
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
            {itemDialogMode === "extra" ? "Adicionar à seção Extras ✓" : editPendingIdx != null ? "Atualizar ✓" : "Confirmar ✓"}
          </button>
        )}
      </div>
    </ModalSheet>
  );
}
