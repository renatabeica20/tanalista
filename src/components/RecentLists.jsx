import ListCard from "./ListCard";

export default function RecentLists({
  visibleLists,
  recentLists,
  historyLists,
  showHistory,
  setShowHistory,
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
  const allLists = [
    ...(Array.isArray(visibleLists) ? visibleLists : []),
    ...(Array.isArray(recentLists) ? recentLists : []),
    ...(Array.isArray(historyLists) ? historyLists : []),
  ];

  const uniqueLists = allLists.filter(
    (list, index, arr) =>
      arr.findIndex((item) => item?.id === list?.id) === index
  );

  const recent = uniqueLists.slice(0, 3);
  const history = uniqueLists.slice(3);

  const listCardProps = {
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
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        width: "100%",
        overflow: "visible",
        position: "relative",
      }}
    >
      <div
        style={{
          overflow: "visible",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontWeight: 900,
              fontSize: 14,
              color: "#6D28D9",
              letterSpacing: "0.08em",
            }}
          >
            LISTAS RECENTES
          </div>

          <div
            style={{
              background: "#F3EFFF",
              color: "#6D28D9",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {recent.length} listas salvas
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "visible",
            position: "relative",
          }}
        >
          {recent.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              variant="recent"
              {...listCardProps}
            />
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div
          style={{
            overflow: "visible",
            position: "relative",
            zIndex: 0,
          }}
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 14,
                  color: "#6D28D9",
                  letterSpacing: "0.08em",
                }}
              >
                HISTÓRICO
              </div>

              <div
                style={{
                  color: "#6D28D9",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {showHistory ? "Ocultar" : "Mostrar"}
              </div>
            </div>
          </button>

          {showHistory && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                overflow: "visible",
                position: "relative",
              }}
            >
              {history.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  variant="history"
                  {...listCardProps}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
