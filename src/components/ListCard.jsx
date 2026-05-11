```jsx
export default function ListCard(props) {
  const {
    list,
    listMenuId,
    setListMenuId,
    setCurrentList,
    setScreen,
    setSearch,
    setCollapsedCats,
    formatListDate,
    openListForEdit,
    setShareTargetList,
    setShareModal,
    duplicateList,
    stopListSharing,
    setConfirmDelete,
    WhatsAppIcon,
  } = props;

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

  const menuItemStyle = (color = "#111827") => ({
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
  });

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        border: "1px solid rgba(100, 80, 200, 0.10)",
        position: "relative",
        overflow: "visible",
      }}
    >
      <div
        onClick={openList}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          cursor: "pointer",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            {list.name || "Lista sem nome"}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#6B7280",
              marginTop: 6,
            }}
          >
            {formatListDate(list.createdAt)}
          </div>
        </div>

        <div
          style={{
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() =>
              setListMenuId(
                listMenuId === list.id ? null : list.id
              )
            }
            style={{
              border: "none",
              background: "#F3F4F6",
              borderRadius: 12,
              width: 38,
              height: 38,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            ⋯
          </button>

          {listMenuId === list.id && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 44,
                background: "#FFFFFF",
                borderRadius: 18,
                boxShadow:
                  "0 20px 40px rgba(0,0,0,0.18)",
                border:
                  "1px solid rgba(100,80,200,0.12)",
                zIndex: 99999,
                minWidth: 240,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => {
                  setListMenuId(null);
                  openListForEdit(list);
                }}
                style={menuItemStyle()}
              >
                ✏️ Editar lista
              </button>

              <button
                onClick={openShare}
                style={menuItemStyle("#25D366")}
              >
                <WhatsAppIcon size={18} />
                Enviar lista
              </button>

              <button
                onClick={() => {
                  setListMenuId(null);
                  duplicateList(list);
                }}
                style={menuItemStyle()}
              >
                📄 Fazer cópia
              </button>

              <button
                onClick={() => {
                  setListMenuId(null);
                  stopListSharing(list);
                }}
                style={menuItemStyle("#6D28D9")}
              >
                🔒 Encerrar compartilhamento
              </button>

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
```
