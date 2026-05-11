import VoiceInput from "./VoiceInput";

function HelpIcon({ text = "" }) {
  return (
    <span
      title={text}
      onClick={(e) => { e.stopPropagation(); if (text) alert(text); }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#EDE9FE,#DDD6FE)",
        color: "#5B21B6",
        fontSize: 12,
        fontWeight: 900,
        cursor: "pointer",
        border: "1px solid rgba(167,139,250,0.45)",
        flexShrink: 0,
        boxShadow: "0 4px 10px -4px rgba(76,29,149,0.35), inset 0 1px 0 rgba(255,255,255,0.9)",
        fontStyle: "italic",
        fontFamily: "Georgia, serif",
      }}
    >
      i
    </span>
  );
}

const screenWrap = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#FBFAFF 0%, #F5F3FF 35%, #FFFFFF 100%)",
};

const stickyHeader = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
  WebkitBackdropFilter: "blur(14px) saturate(140%)",
  backdropFilter: "blur(14px) saturate(140%)",
  padding: "16px 18px 14px",
  display: "flex",
  alignItems: "center",
  gap: 12,
  borderBottom: "1px solid rgba(167,139,250,0.22)",
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow: "0 10px 30px -16px rgba(76,29,149,0.28)",
};

const backBtn = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "linear-gradient(135deg,#FFFFFF,#F5F3FF)",
  border: "1px solid rgba(167,139,250,0.4)",
  cursor: "pointer",
  fontSize: 20,
  color: "#4C1D95",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow:
    "0 10px 22px -10px rgba(76,29,149,0.45), inset 0 1px 0 rgba(255,255,255,0.9)",
  fontWeight: 900,
  WebkitTapHighlightColor: "transparent",
};

const titleGradient = {
  fontWeight: 900,
  fontSize: 18,
  letterSpacing: "-0.01em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "linear-gradient(135deg,#1F2937 0%, #4C1D95 70%, #6D28D9 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const subtitleStyle = {
  fontSize: 12,
  color: "#6B7280",
  fontWeight: 700,
  marginTop: 2,
  letterSpacing: "0.01em",
};

const contentWrap = {
  padding: "18px 16px 44px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const insertBtn = (enabled = true) => ({
  padding: "0 18px",
  height: 56,
  borderRadius: 18,
  background: enabled
    ? "linear-gradient(135deg,#6D28D9 0%, #7C3AED 50%, #8B5CF6 100%)"
    : "#F0F2F5",
  border: "none",
  color: enabled ? "white" : "#9CA3AF",
  fontSize: 15,
  fontWeight: 900,
  cursor: enabled ? "pointer" : "not-allowed",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  boxShadow: enabled
    ? "0 14px 28px -10px rgba(109,40,217,0.55), inset 0 1px 0 rgba(255,255,255,0.3)"
    : "none",
  letterSpacing: "-0.005em",
  WebkitTapHighlightColor: "transparent",
  transition: "transform 160ms ease, box-shadow 200ms ease",
});

export default function PantrySection({
  screen,
  setScreen,
  pantryPendingItems,
  setPantryPendingItems,
  resetPantryFlow,
  pantryInput,
  setPantryInput,
  handleAddPantryItem,
  inp,
  lbl,
  createCard,
  createSecondaryBtn,
  createPrimaryBtn,
  setPasteTarget,
  setShowPasteModal,
  voiceTargetRef,
  setVoiceTarget,
  startVoiceInput,
  voiceProcessing,
  voiceListening,
  tourHighlightStyle,
  isTourStep,
  formatQtyUnit,
  editPantryPendingItem,
  organizePantry,
  loading,
  leavePantryReview,
  pantryReviewReadOnly,
  pantryReviewCategories,
  getCatTheme,
  editPantryReviewItem,
  handleAddPantryReviewItem,
  removePantryReviewItem,
  savePantryFromReview,
  pantryEditingId,
  pantryComparison,
  pendingItems,
  showPantryComparisonDetails,
  setShowPantryComparisonDetails,
  proceedAfterPantryComparison,
}) {
  const secondaryPurple = {
    ...createSecondaryBtn,
    borderColor: "#DDD6FE",
    color: "#5B21B6",
    background: "linear-gradient(135deg,#FFFFFF 0%, #FAF7FF 100%)",
    boxShadow:
      "0 8px 18px -10px rgba(76,29,149,0.3), inset 0 1px 0 rgba(255,255,255,0.9)",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <>
      <style>{`
        @keyframes tnl-pantry-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tnl-pantry-item-row { transition: background 180ms ease; }
        .tnl-pantry-item-row:hover { background: #FAF9FF; }
      `}</style>

      {/* ════════════════════════════════════
          DESPENSA: CRIAR / EDITAR
      ════════════════════════════════════ */}
      {screen === "pantry_create" && (
        <div style={screenWrap}>
          <div style={stickyHeader}>
            {pantryPendingItems.length === 0 ? (
              <button onClick={() => { resetPantryFlow(); setScreen("create"); }} style={backBtn}>←</button>
            ) : <div style={{ width: 42 }} />}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={titleGradient}>
                Itens em Casa
                <HelpIcon text="Adicione aqui os itens que você já tem em casa. Depois organize e salve para usar na comparação com sua lista de compras." />
              </div>
              <div style={subtitleStyle}>Itens que você já tem em casa</div>
            </div>
            <div style={{ width: 42 }} />
          </div>

          <div style={contentWrap}>
            <div style={{ ...createCard, animation: "tnl-pantry-in 320ms cubic-bezier(0.22,1,0.36,1)" }}>
              <label style={lbl}>Adicionar itens em casa</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={pantryInput}
                  onChange={e => setPantryInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddPantryItem()}
                  placeholder="Digite um item que você já tem em casa"
                  style={inp({ height: 56 })}
                />
                <button
                  onClick={handleAddPantryItem}
                  style={{ ...insertBtn(true), ...tourHighlightStyle(isTourStep("create_item_insert")) }}
                >
                  Inserir
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5, fontWeight: 600 }}>
                Digite, cole ou fale os itens existentes em casa. Você poderá editar antes de salvar.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <button
                  onClick={() => { setPasteTarget("pantry"); setShowPasteModal(true); }}
                  style={secondaryPurple}
                >
                  Colar lista
                </button>
                <VoiceInput
                  target="pantry"
                  voiceTargetRef={voiceTargetRef}
                  setVoiceTarget={setVoiceTarget}
                  startVoiceInput={startVoiceInput}
                  voiceProcessing={voiceProcessing}
                  voiceListening={voiceListening}
                  baseStyle={secondaryPurple}
                />
              </div>
            </div>

            {pantryPendingItems.length > 0 && (
              <div
                style={{
                  background: "linear-gradient(180deg,#FFFFFF 0%, #FDFBFF 100%)",
                  borderRadius: 22,
                  overflow: "hidden",
                  border: "1px solid rgba(167,139,250,0.22)",
                  boxShadow:
                    "0 18px 36px -18px rgba(76,29,149,0.28), 0 4px 10px -4px rgba(17,24,39,0.05)",
                  animation: "tnl-pantry-in 360ms cubic-bezier(0.22,1,0.36,1)",
                  ...tourHighlightStyle(isTourStep("create_items_preview")),
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    background: "linear-gradient(135deg,#FAF9FF 0%, #F5F3FF 100%)",
                    borderBottom: "1px solid rgba(167,139,250,0.22)",
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#5B21B6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>
                    {pantryPendingItems.length} {pantryPendingItems.length === 1 ? "item inserido" : "itens inseridos"}
                  </span>
                  <button
                    onClick={() => setPantryPendingItems([])}
                    style={{
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      borderRadius: 999,
                      padding: "4px 10px",
                      color: "#DC2626",
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Limpar tudo
                  </button>
                </div>
                {pantryPendingItems.map((item, i) => (
                  <div
                    key={i}
                    className="tnl-pantry-item-row"
                    style={{
                      padding: "13px 16px",
                      borderBottom: i < pantryPendingItems.length - 1 ? "1px solid #F3F0FA" : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                      }}
                    >
                      🧺
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {formatQtyUnit(item.qty, item.unit)} – {item.name}
                      </div>
                      {item.detail && <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 700 }}>{item.detail}</div>}
                    </div>
                    <button
                      onClick={() => editPantryPendingItem(i)}
                      style={{
                        background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
                        border: "1px solid rgba(167,139,250,0.35)",
                        borderRadius: 10,
                        padding: "6px 10px",
                        color: "#6D28D9",
                        cursor: "pointer",
                        fontSize: 14,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setPantryPendingItems(prev => prev.filter((_, j) => j !== i))}
                      style={{
                        background: "linear-gradient(135deg,#FEF2F2,#FFE4E4)",
                        border: "1px solid #FECACA",
                        borderRadius: 10,
                        padding: "6px 10px",
                        color: "#DC2626",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 900,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={organizePantry}
              disabled={loading || pantryPendingItems.length === 0}
              style={{
                ...createPrimaryBtn,
                opacity: (loading || pantryPendingItems.length === 0) ? 0.5 : 1,
                cursor: (loading || pantryPendingItems.length === 0) ? "not-allowed" : "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Organizar Lista {pantryPendingItems.length > 0 && `(${pantryPendingItems.length})`}
            </button>
          </div>
        </div>
      )}

      {/* DESPENSA: CONFERÊNCIA */}
      {screen === "pantry_review" && (
        <div style={screenWrap}>
          <div style={stickyHeader}>
            <button onClick={leavePantryReview} style={backBtn}>←</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={titleGradient}>
                Itens em Casa
                <HelpIcon text={pantryReviewReadOnly ? "Visualização dos seus itens em casa. Esta tela não altera a lista." : "Edite, acrescente novos itens e salve antes de voltar."} />
              </div>
              <div style={subtitleStyle}>Lista organizada por seções, sem preços</div>
            </div>
            <div style={{ width: 42 }} />
          </div>

          <div style={contentWrap}>
            {!pantryReviewReadOnly && (
              <div style={{ ...createCard, animation: "tnl-pantry-in 320ms cubic-bezier(0.22,1,0.36,1)" }}>
                <label style={lbl}>Acrescentar novos itens</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    value={pantryInput}
                    onChange={e => setPantryInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddPantryReviewItem()}
                    placeholder="Digite um novo item para os Itens em Casa"
                    style={inp({ height: 56 })}
                  />
                  <button
                    onClick={handleAddPantryReviewItem}
                    disabled={!pantryInput.trim()}
                    style={insertBtn(!!pantryInput.trim())}
                  >
                    Inserir
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5, fontWeight: 600 }}>
                  Use este campo para acrescentar itens que foram esquecidos. Também é possível colar ou falar vários itens de uma vez.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <button
                    onClick={() => { setPasteTarget("pantryReview"); setShowPasteModal(true); }}
                    style={secondaryPurple}
                  >
                    Colar lista
                  </button>
                  <VoiceInput
                    target="pantryReview"
                    voiceTargetRef={voiceTargetRef}
                    setVoiceTarget={setVoiceTarget}
                    startVoiceInput={startVoiceInput}
                    voiceProcessing={voiceProcessing}
                    voiceListening={voiceListening}
                    baseStyle={secondaryPurple}
                  />
                </div>
              </div>
            )}

            {(pantryReviewCategories || []).map((cat, ci) => {
              const th = getCatTheme(cat.name);
              return (
                <div
                  key={cat.name + ci}
                  style={{
                    border: `1.5px solid ${th.border}`,
                    borderRadius: 22,
                    overflow: "hidden",
                    background: "linear-gradient(180deg,#FFFFFF 0%, #FDFBFF 100%)",
                    boxShadow:
                      "0 18px 36px -18px rgba(17,24,39,0.18), 0 4px 10px -4px rgba(17,24,39,0.04)",
                    animation: "tnl-pantry-in 360ms cubic-bezier(0.22,1,0.36,1) both",
                    animationDelay: `${Math.min(ci * 40, 200)}ms`,
                  }}
                >
                  <div
                    style={{
                      background: th.bg,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      borderBottom: `1px solid ${th.border}55`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 10px -4px rgba(17,24,39,0.18)",
                      }}
                    >
                      {th.icon}
                    </span>
                    <div style={{ flex: 1, fontWeight: 900, color: th.header, fontSize: 16, letterSpacing: "-0.005em" }}>
                      {cat.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: th.header,
                        background: "rgba(255,255,255,0.7)",
                        padding: "4px 10px",
                        borderRadius: 999,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {cat.items?.length || 0} itens
                    </div>
                  </div>
                  {(cat.items || []).map((item, i) => (
                    <div
                      key={i}
                      className="tnl-pantry-item-row"
                      style={{
                        padding: "13px 16px",
                        borderBottom: i < (cat.items || []).length - 1 ? "1px solid #F3F0FA" : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.name}
                        </div>
                        {item.detail && (
                          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.detail}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color: "#5B21B6",
                          whiteSpace: "nowrap",
                          background: "#F5F3FF",
                          padding: "4px 9px",
                          borderRadius: 999,
                          border: "1px solid #EDE9FE",
                        }}
                      >
                        {formatQtyUnit(item.qty, item.unit)}
                      </div>
                      {!pantryReviewReadOnly && (
                        <button
                          onClick={() => editPantryReviewItem(ci, i)}
                          style={{
                            background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
                            border: "1px solid rgba(167,139,250,0.35)",
                            borderRadius: 10,
                            padding: "5px 9px",
                            color: "#6D28D9",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 900,
                            WebkitTapHighlightColor: "transparent",
                          }}
                        >
                          ✏️
                        </button>
                      )}
                      {!pantryReviewReadOnly && (
                        <button
                          onClick={() => removePantryReviewItem(ci, i)}
                          style={{
                            background: "linear-gradient(135deg,#FEF2F2,#FFE4E4)",
                            border: "1px solid #FECACA",
                            borderRadius: 10,
                            padding: "5px 9px",
                            color: "#DC2626",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 900,
                            WebkitTapHighlightColor: "transparent",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <div
              style={{
                background: "linear-gradient(135deg,#F8FAFC 0%, #F5F3FF 100%)",
                border: "1px solid rgba(167,139,250,0.25)",
                borderRadius: 18,
                padding: 14,
                fontSize: 12,
                color: "#4B5563",
                fontWeight: 700,
                lineHeight: 1.5,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              💡 Os Itens em Casa servem como base de comparação para evitar compras desnecessárias. A lista fica ativa até ser excluída ou substituída.
            </div>

            {!pantryReviewReadOnly && (
              <button
                onClick={savePantryFromReview}
                style={{ ...createPrimaryBtn, WebkitTapHighlightColor: "transparent" }}
              >
                {pantryEditingId ? "Salvar Lista" : "Salvar Itens"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ITENS EM CASA: RESULTADO DA COMPARAÇÃO */}
      {screen === "pantry_compare_result" && (
        <div style={screenWrap}>
          <div style={stickyHeader}>
            <button onClick={() => setScreen("create")} style={backBtn}>←</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={titleGradient}>Comparação concluída</div>
              <div style={subtitleStyle}>Sua pré-lista foi ajustada</div>
            </div>
            <div style={{ width: 42 }} />
          </div>

          <div style={contentWrap}>
            <div
              style={{
                ...createCard,
                textAlign: "center",
                borderColor: "#BBF7D0",
                background:
                  "linear-gradient(180deg,#F0FDF4 0%, #ECFDF5 50%, #DCFCE7 100%)",
                animation: "tnl-pantry-in 360ms cubic-bezier(0.22,1,0.36,1)",
                boxShadow:
                  "0 18px 36px -18px rgba(34,197,94,0.35), 0 4px 10px -4px rgba(17,24,39,0.06)",
              }}
            >
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,#22C55E 0%, #16A34A 60%, #15803D 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  fontWeight: 900,
                  margin: "0 auto 14px",
                  boxShadow:
                    "0 18px 36px -10px rgba(22,163,74,0.55), inset 0 2px 0 rgba(255,255,255,0.35)",
                }}
              >
                ✓
              </div>
              <div style={{ fontWeight: 900, fontSize: 19, color: "#166534", marginBottom: 6, letterSpacing: "-0.01em" }}>
                Itens em Casa comparados
              </div>
              <div style={{ fontSize: 13, color: "#166534", fontWeight: 700, lineHeight: 1.5 }}>
                Mantivemos na pré-lista somente o que ainda precisa ser comprado ou complementado.
              </div>
            </div>

            <div style={createCard}>
              <label style={lbl}>Resumo da comparação</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                <div
                  style={{
                    background: "linear-gradient(180deg,#FEF2F2,#FEE2E2)",
                    border: "1px solid #FECACA",
                    borderRadius: 16,
                    padding: "12px 8px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                  }}
                >
                  <div style={{ fontWeight: 900, color: "#B91C1C", fontSize: 22, letterSpacing: "-0.02em" }}>
                    {pantryComparison?.removed?.length || 0}
                  </div>
                  <div style={{ fontSize: 11, color: "#7F1D1D", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
                    removidos
                  </div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(180deg,#FFFBEB,#FEF3C7)",
                    border: "1px solid #FDE68A",
                    borderRadius: 16,
                    padding: "12px 8px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                  }}
                >
                  <div style={{ fontWeight: 900, color: "#B45309", fontSize: 22, letterSpacing: "-0.02em" }}>
                    {pantryComparison?.adjusted?.length || 0}
                  </div>
                  <div style={{ fontSize: 11, color: "#92400E", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
                    ajustados
                  </div>
                </div>
                <div
                  style={{
                    background: "linear-gradient(180deg,#EEF2FF,#E0E7FF)",
                    border: "1px solid #C7D2FE",
                    borderRadius: 16,
                    padding: "12px 8px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                  }}
                >
                  <div style={{ fontWeight: 900, color: "#4338CA", fontSize: 22, letterSpacing: "-0.02em" }}>
                    {pantryComparison?.items?.length ?? pendingItems.length}
                  </div>
                  <div style={{ fontSize: 11, color: "#3730A3", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 2 }}>
                    na nova pré-lista
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPantryComparisonDetails(v => !v)}
              style={secondaryPurple}
            >
              {showPantryComparisonDetails ? "Ocultar detalhes" : "Ver o que foi feito"}
            </button>

            {showPantryComparisonDetails && pantryComparison && (
              <div style={{ ...createCard, animation: "tnl-pantry-in 280ms cubic-bezier(0.22,1,0.36,1)" }}>
                <label style={lbl}>Detalhes da comparação</label>
                {(pantryComparison.removed || []).length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 900, color: "#B91C1C", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Itens removidos porque já estavam na Itens em Casa
                    </div>
                    {pantryComparison.removed.map((r, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#374151", fontWeight: 700, padding: "8px 0", borderBottom: "1px solid #F3F4F6", lineHeight: 1.4 }}>
                        • {r.item?.name || r.name} — {r.reason || r.removedReason}
                      </div>
                    ))}
                  </div>
                )}
                {(pantryComparison.adjusted || []).length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 900, color: "#B45309", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Itens ajustados ou sinalizados
                    </div>
                    {pantryComparison.adjusted.map((r, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#374151", fontWeight: 700, padding: "8px 0", borderBottom: "1px solid #F3F4F6", lineHeight: 1.4 }}>
                        • {r.before?.name || r.name} — {r.after?.pantryNote || r.reason || "ajustado pelos Itens em Casa"}
                      </div>
                    ))}
                  </div>
                )}
                {(pantryComparison.kept || []).length > 0 && (
                  <div>
                    <div style={{ fontWeight: 900, color: "#166534", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Itens mantidos na lista
                    </div>
                    {pantryComparison.kept.map((r, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#374151", fontWeight: 700, padding: "8px 0", borderBottom: "1px solid #F3F4F6", lineHeight: 1.4 }}>
                        • {r.name} — não encontrado na Itens em Casa
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280", fontWeight: 700, lineHeight: 1.45 }}>
                  Visualização apenas informativa. Para alterar, volte à pré-lista.
                </div>
              </div>
            )}

            <button
              onClick={proceedAfterPantryComparison || (() => setScreen("create"))}
              style={{ ...createPrimaryBtn, WebkitTapHighlightColor: "transparent" }}
            >
              Prosseguir para pré-lista
            </button>
          </div>
        </div>
      )}
    </>
  );
}
