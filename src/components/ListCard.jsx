<div
  style={{ position: "relative", flexShrink: 0 }}
  onClick={(e) => e.stopPropagation()}
>
  <button
    onClick={() => setListMenuId(listMenuId === list.id ? null : list.id)}
    style={menuButtonStyle}
    aria-label="Mais opções"
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
          "0 22px 50px -10px rgba(76, 29, 149, 0.28), 0 4px 12px rgba(15, 23, 42, 0.06)",
        border: "1px solid rgba(100, 80, 200, 0.14)",
        zIndex: 500,
        minWidth: 240,
        overflow: "hidden",
        padding: "4px",
      }}
    >
      {canEditList && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setListMenuId(null);
            openListForEdit(list);
          }}
          style={{ ...menuItemStyle(), borderRadius: 12 }}
        >
          ✏️ Editar lista
        </button>
      )}

      <button
        onClick={openShare}
        style={{ ...menuItemStyle("#25D366"), borderRadius: 12 }}
      >
        <WhatsAppIcon size={18} /> Enviar lista
      </button>

      <button
        onClick={() => duplicateList(list)}
        style={{ ...menuItemStyle(), borderRadius: 12 }}
      >
        📄 Fazer cópia
      </button>

      {shared && (
        <button
          onClick={() => stopListSharing(list)}
          style={{ ...menuItemStyle("#6D28D9"), borderRadius: 12 }}
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
        onClick={() => {
          setConfirmDelete(list.id);
          setListMenuId(null);
        }}
        style={{ ...menuItemStyle("#DC2626"), borderRadius: 12 }}
      >
        🗑 Excluir lista
      </button>
    </div>
  )}
</div>
