import ModalSheet from "./ModalSheet";
import { getListTypeConfig } from "../config/listTypeConfigs";

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
  listType = "mercado",
}) {
  if (!itemDialog) return null;

  const typeConfig = getListTypeConfig(listType);

  const dynamicUnits =
    typeConfig?.units?.length
      ? typeConfig.units
      : getManualDialogUnits();

  const isExtra = itemDialogMode === "extra";
  const isPantryReview = itemDialogMode === "pantryReview";

  return (
    <ModalSheet
      onClose={() => {
        setItemDialog(null);
        setItemDialogMode("pending");
        setEditPendingIdx(null);
        setCurrentInput("");
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: "#6D28D9",
            marginBottom: 6,
          }}
        >
          {typeConfig.icon} {typeConfig.label}
        </div>

        <input
          value={itemDialog.name || ""}
          onChange={(e) =>
            setItemDialog((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          placeholder={typeConfig.placeholder}
          style={inp({ height: 52 })}
        />
      </div>

      {!dlgLoading && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Quantidade</label>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 6,
              }}
            >
              <button onClick={() => changeManualQty(-1)} style={qBtn}>
                −
              </button>

              <input
                value={formatManualQty(dlgQty)}
                inputMode="decimal"
                onChange={(e) =>
                  setManualQtyFromText(e.target.value)
                }
                style={{
                  ...inp({
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 22,
                    flex: 1,
                  }),
                }}
              />

              <button onClick={() => changeManualQty(1)} style={qBtn}>
                +
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Unidade</label>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {dynamicUnits.map((u) => (
                <button
                  key={u}
                  onClick={() => handleManualUnitChange(u)}
                  style={chip(
                    normalizeUnitValue(dlgUnit) ===
                      normalizeUnitValue(u),
                    "#6B3FA0",
                    "#F3EEF9",
                    "#6B3FA0"
                  )}
                >
                  {formatUnitForQuantity(
                    Number(dlgQty || 1),
                    u
                  )}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background:
                "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
              border: "1px solid #DDD6FE",
              borderRadius: 18,
              padding: "12px 14px",
              marginBottom: 18,
              fontSize: 14,
              color: "#5B21B6",
              fontWeight: 800,
            }}
          >
            {buildManualPreview()}
          </div>

          {isExtra && (
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Preço</label>

              <input
                value={exPrice || ""}
                onChange={(e) =>
                  setExPrice(
                    formatMoneyInput
                      ? formatMoneyInput(e.target.value)
                      : e.target.value
                  )
                }
                placeholder="R$ 0,00"
                inputMode="decimal"
                style={inp({ height: 52 })}
              />
            </div>
          )}
        </>
      )}

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 12,
        }}
      >
        <button
          onClick={() => {
            setItemDialog(null);
            setEditPendingIdx(null);
            setCurrentInput("");
          }}
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
              background:
                "linear-gradient(135deg,#6D28D9 0%, #8B5CF6 100%)",
              border: "none",
              color: "white",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Confirmar ✓
          </button>
        )}
      </div>
    </ModalSheet>
  );
}
