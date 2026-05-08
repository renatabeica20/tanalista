import { useEffect } from "react";

export default function SharedSyncController({
  screen,
  currentList,
  isRealSharedList,
  getListSyncStamp,
  autoSyncNoticeRef,
  onRefresh,
}) {
  useEffect(() => {
    // Atualização automática somente para lista realmente compartilhada/recebida.
    // Lista própria sincronizada na nuvem não deve ser recarregada automaticamente ao abrir o histórico,
    // pois uma cópia remota antiga pode desmarcar itens já finalizados.
    if (screen !== "list" || !currentList?.sharedId || !isRealSharedList?.(currentList)) return;

    const lastPull = getListSyncStamp?.({
      lastSyncedAt: currentList.lastCloudSeenAt || currentList.pulledAt,
    });

    if (lastPull && Date.now() - lastPull < 45000) return;

    const now = Date.now();
    if (now - (autoSyncNoticeRef?.current || 0) < 45000) return;

    if (autoSyncNoticeRef) autoSyncNoticeRef.current = now;
    onRefresh?.().catch(() => null);
  }, [
    screen,
    currentList?.id,
    currentList?.sharedId,
    currentList?.isShared,
    currentList?.imported,
    currentList?.lastCloudSeenAt,
    currentList?.pulledAt,
    isRealSharedList,
    getListSyncStamp,
    autoSyncNoticeRef,
    onRefresh,
  ]);

  return null;
}
