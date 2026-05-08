import PriceStatsEntryCard from "./PriceStatsEntryCard";
import RecentLists from "./RecentLists";

export default function ListsSection({
  lists,
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
  rebuildLocalPriceHistoryFromLists,
  setShowPriceStatsScreen,
  shareAppWhatsApp,
}) {
  return (
    <>
      <PriceStatsEntryCard
        onClick={() => {
          rebuildLocalPriceHistoryFromLists(lists);
          setShowPriceStatsScreen(true);
        }}
      />

      <RecentLists
        visibleLists={visibleLists}
        recentLists={recentLists}
        historyLists={historyLists}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        listMenuId={listMenuId}
        setListMenuId={setListMenuId}
        setCurrentList={setCurrentList}
        setScreen={setScreen}
        setSearch={setSearch}
        setCollapsedCats={setCollapsedCats}
        formatListDate={formatListDate}
        getListOriginMeta={getListOriginMeta}
        isListFinished={isListFinished}
        openListForEdit={openListForEdit}
        setShareTargetList={setShareTargetList}
        setShareModal={setShareModal}
        duplicateList={duplicateList}
        stopListSharing={stopListSharing}
        setConfirmDelete={setConfirmDelete}
        getListCardStats={getListCardStats}
        fmtR={fmtR}
        WhatsAppIcon={WhatsAppIcon}
      />

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={shareAppWhatsApp}
          style={{
            width: "100%",
            padding: "15px 16px",
            borderRadius: 20,
            background: "#25D366",
            border: "none",
            color: "white",
            fontWeight: 900,
            fontSize: 15,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 12px 28px rgba(37,211,102,0.22)",
          }}
        >
          <WhatsAppIcon size={19} /> Compartilhe o Tá na Lista
        </button>
        <div
          style={{
            fontSize: 12,
            color: "#6B7280",
            textAlign: "center",
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          Convide outras pessoas para organizar listas e controlar o orçamento.
        </div>
      </div>
    </>
  );
}
