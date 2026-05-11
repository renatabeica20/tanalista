export default function ListCard({
  list,
  variant = "recent",
  listMenuId,
  setListMenuId,
  setCurrentList,
  setScreen,
  setSearch,
  setCollapsedCats,
  formatListDate,
  getListOriginMeta,
  isListFinished,
  openListForEdit,
  setShareTargetList,
  setShareModal,
  duplicateList,
  stopListSharing,
  setConfirmDelete,
  getListCardStats,
  fmtR,
  WhatsAppIcon,
}) {
  const icons = {
    mercado: "🛒",
    festa: "🎉",
    construcao: "🏗️",
    eletrico: "⚡",
    escolar: "🏫",
    farmacia: "💊",
    condominio: "🏢",
    outros: "📦",
  };

  const originMeta = typeof getListOriginMeta === "function" ? getListOriginMeta(list) : null;
  const shared = list?.isShared === true;

  const editableCopy = Boolean(
    list?.editableCopy === true ||
      list?.isCopy === true ||
      list?.copyMode === "prelist" ||
      list?.copiedFrom ||
      list?.copiedFromId ||
      list?.copiedFromListId ||
      list?.status === "draft"
  );

  const finished =
    editableCopy || typeof isListFinished !== "function"
      ? false
      : isListFinished(list);

  const canEditList = editableCopy || !finished;
  const stats =
    variant === "history" && typeof getListCardStats === "function"
      ? getListCardStats(list)
      : null;

  const isHistory = variant === "history";
  const menuOpen = listMenuId === list?.id;

  const openList = () => {
    setCurrentList?.(list);
    setScreen?.("list");
    setSearch?.("");
    setCollapsedCats?.({});
  };

  const openShare = () => {
    setCurrentList?.(list);
    setShareTargetList?.(list);
    setShareModal?.(true);
    setListMenuId?.(null);
  };

  const statusBadge = (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        color: finished ? "#B91C1C" : "#047857",
        background: finished
          ? "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
          : "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
        border: "1px solid " + (finished ? "#FCA5A5" : "#A7F3D0"),
        borderRadius: 999,
        padding: "4px 10px",
        whiteSpace: "nowrap",
        letterSpacing: 0.2,
        textTransform: "uppercase",
      }}
    >
      {finished ? "Finalizada" : "Em aberto"}
    </span>
  );

  const menuItemStyle = (color = "#0F172A") => ({
    width: "100%",
    padding: "13px 16px",
    border: "none",
    background: "#FFFFFF",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 700,
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: "inherit",
    borderRadius: 12,
  });

  return (
    <div
      key={list?.id}
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        boxShadow:
          "0 4px 18px -6px rgba(100, 80, 200, 0.12), 0 1px 2px rgba(15, 23, 42, 0.04)",
        border: "1px solid rgba(100, 80, 200, 0.10)",
        overflow: "visible",
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={openList}
        style={{
          display: "flex",
          alignItems: "center",
          gap: isHistory ? 14 : 12,
          padding: isHistory ? "16px" : "14px",
          cursor: "pointer",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: isHistory ? 46 : 44,
            height: isHistory ? 46 : 44,
            borderRadius: 14,
            background: "linear-gradient(135deg, #F3EFFF 0%, #EDE9FE 100%)",
            border: "1px solid rgba(124, 58, 237, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isHistory ? 22 : 21,
            flexShrink: 0,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 6px -2px rgba(124, 58, 237, 0.15)",
          }}
        >
          {icons[list?.type] || "📦"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ textAlign: isHistory ? "left" : "center", minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: isHistory ? 14.5 : 15,
                color: "#0F172A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                letterSpacing: -0.2,
              }}
            >
              {list?.name || "Lista sem nome"}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isHistory ? "flex-start" : "center",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 6,
              }}
            >
              {statusBadge}

              {shared && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#6D28D9",
                    background: "linear-gradient(135deg, #F3EFFF 0%, #EDE9FE 100%)",
                    border: "1px solid #DDD6FE",
                    borderRadius: 999,
                    padding: "4px 9px",
                    whiteSpace: "nowrap",
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  Compartilhada
                </span>
              )}

              {isHistory && (
                <span
                  style={{
                    fontSize: 12,
                    color: "#047857",
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    background: "rgba(4, 120, 87, 0.08)",
                    border: "1px solid rgba(4, 120, 87, 0.18)",
                    borderRadius: 8,
                    padding: "2px 8px",
                  }}
                >
                  {typeof fmtR === "function" ? fmtR(stats?.fullTotal || list?.total || 0) : ""}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: "#94A3B8",
              marginTop: 6,
              fontWeight: 600,
              textAlign: isHistory ? "left" : "center",
            }}
          >
            {typeof formatListDate === "function"
              ? formatListDate(list?.createdAt)
              : list?.createdAt || ""}
          </div>

          {originMeta && (
            <div
              style={{
                display: "flex",
                justifyContent: isHistory ? "flex-start" : "center",
                marginTop: 7,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background:
                    originMeta.type === "received"
                      ? "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)"
                      : "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                  border:
                    "1px solid " +
                    (originMeta.type === "received" ? "#C4B5FD" : "#A7F3D0"),
                  color: originMeta.type === "received" ? "#4C1D95" : "#047857",
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: 0.2,
                }}
              >
                <span>{originMeta.icon}</span>
                <span>{originMeta.text}</span>
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            position: "relative",
            flexShrink: 0,
            overflow: "visible",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setListMenuId?.(menuOpen ? null : list?.id);
            }}
            style={{
              background: "#FBFAFF",
              border: "1px solid rgba(100, 80, 200, 0.12)",
              borderRadius: 12,
              padding: isHistory ? "7px 11px" : "6px 10px",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: isHistory ? 18 : 17,
              color: "#6D28D9",
              fontFamily: "inherit",
              lineHeight: 1,
            }}
            aria-label="Mais opções"
          >
            ⋯
          </button>

          {menuOpen && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                background: "#FFFFFF",
                borderRadius: 18,
                boxShadow:
                  "0 22px 50px -10px rgba(76, 29, 149, 0.28), 0 4px 12px rgba(15, 23, 42, 0.06)",
                border: "1px solid rgba(100, 80, 200, 0.14)",
                zIndex: 99999,
                minWidth: 240,
                overflow: "hidden",
                padding: "4px",
              }}
            >
              {canEditList && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setListMenuId?.(null);
                    openListForEdit?.(list);
                  }}
                  style={menuItemStyle()}
                >
                  ✏️ Editar lista
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openShare();
                }}
                style={menuItemStyle("#25D366")}
              >
                {WhatsAppIcon ? <WhatsAppIcon size={18} /> : null}
                Enviar lista
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setListMenuId?.(null);
                  duplicateList?.(list);
                }}
                style={menuItemStyle()}
              >
                📄 Fazer cópia
              </button>

              {shared && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setListMenuId?.(null);
                    stopListSharing?.(list);
                  }}
                  style={menuItemStyle("#6D28D9")}
                >
                  🔒 Encerrar compartilhamento
                </button>
              )}

              <div
                style={{
                  height: 1,
                  background: "rgba(100, 80, 200, 0.10)",
                  margin: "4px 8px",
                }}
              />

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDelete?.(list?.id);
                  setListMenuId?.(null);
                }}
                style={menuItemStyle("#DC2626")}
              >
                🗑 Excluir lista
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
