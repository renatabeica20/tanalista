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
  const getListTime = (list) => {
    const value =
      list?.updatedAt ||
      list?.completedAt ||
      list?.finishedAt ||
      list?.createdAt ||
      list?.date ||
      "";
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const allListsChronological = [
    ...(Array.isArray(visibleLists) ? visibleLists : []),
    ...(Array.isArray(recentLists) ? recentLists : []),
    ...(Array.isArray(historyLists) ? historyLists : []),
  ]
    .filter(Boolean)
    .filter((list, index, arr) => {
      const key = list?.id || list?.sharedId || `${list?.name || "lista"}-${list?.createdAt || index}`;
      return arr.findIndex((item, itemIndex) => {
        const itemKey = item?.id || item?.sharedId || `${item?.name || "lista"}-${item?.createdAt || itemIndex}`;
        return itemKey === key;
      }) === index;
    })
    .sort((a, b) => getListTime(b) - getListTime(a));

  const safeRecentLists = allListsChronological.slice(0, 3);
  const safeHistoryLists = allListsChronological.slice(3);
  const baseVisibleLists = allListsChronological;

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

  const sectionHeader = (label, count, countLabel) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        margin: "4px 2px 14px",
        width: "100%",
        boxSizing: "border-box",
        clear: "both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            width: 4,
            height: 18,
            borderRadius: 999,
            background: "linear-gradient(180deg,#7C3AED,#A855F7)",
            boxShadow: "0 2px 8px -2px rgba(124,58,237,0.55)",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontWeight: 900,
            fontSize: 11.5,
            color: "#4C1D95",
            textTransform: "uppercase",
            letterSpacing: "1px",
            background: "linear-gradient(90deg,#4C1D95,#7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
      </div>
      {count > 0 && (
        <span
          style={{
            fontSize: 11,
            color: "#6D28D9",
            fontWeight: 800,
            flexShrink: 0,
            background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)",
            border: "1px solid rgba(124,58,237,0.18)",
            borderRadius: 999,
            padding: "4px 10px",
            letterSpacing: 0.2,
            whiteSpace: "nowrap",
          }}
        >
          {count} {count === 1 ? countLabel.singular : countLabel.plural}
        </span>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes tnl-recent-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tnl-recent-list { animation: tnl-recent-in 280ms cubic-bezier(0.22,1,0.36,1) both; }
        .tnl-history-toggle {
          transition: background 200ms ease, border-color 200ms ease, box-shadow 200ms ease, transform 160ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        .tnl-history-toggle:hover {
          border-color: rgba(124,58,237,0.35) !important;
          box-shadow: 0 14px 30px -10px rgba(124,58,237,0.22) !important;
        }
        .tnl-history-toggle:active { transform: scale(0.985); }
      `}</style>

      {sectionHeader("Listas recentes", baseVisibleLists.length, {
        singular: "lista salva",
        plural: "listas salvas",
      })}

      {baseVisibleLists.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "36px 22px",
            color: "#6B7280",
            background:
              "linear-gradient(135deg, #FFFFFF 0%, #FBFAFF 100%)",
            border: "1px dashed rgba(124,58,237,0.28)",
            borderRadius: 22,
            boxShadow:
              "0 10px 28px -12px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              background: "linear-gradient(135deg,#F3EFFF,#EDE9FE)",
              border: "1px solid rgba(124,58,237,0.22)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            🛒
          </div>
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.5,
              fontWeight: 900,
              margin: "0 0 6px",
              color: "#0F172A",
              letterSpacing: "-0.2px",
            }}
          >
            Nenhuma lista ainda
          </p>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              fontWeight: 600,
              margin: 0,
              color: "#6B7280",
            }}
          >
            Entre em Compras para criar sua primeira lista.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {safeRecentLists.map((list, i) => (
            <div
              key={list.id}
              className="tnl-recent-list"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <ListCard list={list} variant="recent" {...listCardProps} />
            </div>
          ))}
        </div>
      )}

      {safeHistoryLists.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {sectionHeader("Histórico", safeHistoryLists.length, {
            singular: "lista",
            plural: "listas",
          })}
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="tnl-history-toggle"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 18,
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #FBFAFF 100%)",
              border: "1px solid rgba(124,58,237,0.18)",
              color: "#0F172A",
              fontWeight: 900,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              boxShadow:
                "0 8px 22px -10px rgba(124,58,237,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
              letterSpacing: "-0.1px",
            }}
            aria-expanded={showHistory}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg,#F3EFFF,#EDE9FE)",
                  border: "1px solid rgba(124,58,237,0.22)",
                  fontSize: 15,
                }}
              >
                🕘
              </span>
              <span>Histórico</span>
            </span>
            <span
              style={{
                color: "#6D28D9",
                fontSize: 13,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {showHistory ? "Ocultar" : "Ver"} ({safeHistoryLists.length})
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  transition: "transform 240ms cubic-bezier(0.22,1,0.36,1)",
                  transform: showHistory ? "rotate(180deg)" : "rotate(0deg)",
                  fontSize: 11,
                }}
              >
                ▾
              </span>
            </span>
          </button>
          {showHistory && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 12,
                paddingLeft: 2,
                borderLeft: "2px solid rgba(124,58,237,0.12)",
                marginLeft: 4,
                paddingTop: 2,
              }}
            >
              {safeHistoryLists.map((list, i) => (
                <div
                  key={list.id}
                  className="tnl-recent-list"
                  style={{ animationDelay: `${i * 30}ms`, paddingLeft: 8 }}
                >
                  <ListCard list={list} variant="history" {...listCardProps} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
