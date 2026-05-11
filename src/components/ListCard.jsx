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
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setListMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [setListMenuId]);

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

  const originMeta = getListOriginMeta(list);

  const shared = list.isShared === true;

  const editableCopy = Boolean(
    list?.editableCopy === true ||
      list?.isCopy === true ||
      list?.copyMode === "prelist" ||
      list?.copiedFrom ||
      list?.copiedFromId ||
      list?.copiedFromListId ||
      list?.status === "draft"
  );

  const finished = editableCopy
    ? false
    : isListFinished(list);

  const canEditList = editableCopy || !finished;

  const stats =
    variant === "history"
      ? getListCardStats(list)
      : null;

  const isHistory = variant === "history";

  const openList = () => {
    setCurrentList(list);
    setScreen("list");
    setSearch("");
    setCollapsedCats({});
  };

  const openShare = () => {
    setCurrentList(list);
    setShareTargetList(list);
    setShareModal(true);
    setListMenuId(null);
  };

  const menuOpen = listMenuId === list.id;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        boxShadow:
          "0 4px 18px -6px rgba(100, 80, 200, 0.12)",
        border:
          "1px solid rgba(100, 80, 200, 0.10)",
        overflow: "visible",
        position: "relative",
      }}
    >
      <div
        onClick={openList}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 16,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg,#F3EFFF,#EDE9FE)",
            flexShrink: 0,
          }}
        >
          {icons[list.type] || "📦"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {list.name || "Lista sem nome"}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#6B7280",
              fontWeight: 600,
            }}
          >
            {formatListDate(list.createdAt)}
          </div>

          {originMeta && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: 700,
                color:
                  originMeta.type === "received"
                    ? "#4C1D95"
                    : "#047857",
              }}
            >
              {originMeta.icon} {originMeta.text}
            </div>
          )}
        </div>

        <div
          ref={menuRef}
          style={{
            position: "relative",
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setListMenuId(
                menuOpen ? null : list.id
              );
            }}
            style={{
              background: "#FBFAFF",
              border:
                "1px solid rgba(100,80,200,0.12)",
              borderRadius: 12,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 18,
              color: "#6D28D9",
            }}
          >
            ⋯
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 240,
                background: "#FFFFFF",
                borderRadius: 18,
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.18)",
                border:
                  "1px solid rgba(100,80,200,0.12)",
                zIndex: 99999,
                overflow: "hidden",
                animation:
                  "fadeIn .18s ease-out",
              }}
            >
              {canEditList && (
                <button
                  onClick={() => {
                    setListMenuId(null);
                    openListForEdit(list);
                  }}
                  style={itemStyle()}
                >
                  ✏️ Editar lista
                </button>
              )}

              <button
                onClick={openShare}
                style={itemStyle("#25D366")}
              >
                <WhatsAppIcon size={18} />
                Enviar lista
              </button>

              <button
                onClick={() => {
                  setListMenuId(null);
                  duplicateList(list);
                }}
                style={itemStyle()}
              >
                📄 Fazer cópia
              </button>

              {shared && (
                <button
                  onClick={() => {
                    setListMenuId(null);
                    stopListSharing(list);
                  }}
                  style={itemStyle("#6D28D9")}
                >
                  🔒 Encerrar compartilhamento
                </button>
              )}

              <div
                style={{
                  height: 1,
                  background:
                    "rgba(100,80,200,0.12)",
                }}
              />

              <button
                onClick={() => {
                  setConfirmDelete(list.id);
                  setListMenuId(null);
                }}
                style={itemStyle("#DC2626")}
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

function itemStyle(color = "#111827") {
  return {
    width: "100%",
    padding: "14px 16px",
    border: "none",
    background: "#FFFFFF",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 600,
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };
}
```
