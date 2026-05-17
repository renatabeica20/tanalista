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
            background: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #8B5CF6 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "white",
            fontWeight: 900,
            fontSize: 15,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 18px 36px -10px rgba(76,29,149,0.55), 0 8px 18px -6px rgba(124,58,237,0.40), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.10)",
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
