import { useEffect, useRef } from "react";

export default function SharedSyncController({
  screen,
  currentList,
  isRealSharedList,
  getListSyncStamp,
  autoSyncNoticeRef,
  onRefresh,
}) {
  const intervalRef = useRef(null);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Verifica sharedId em todos os campos possíveis — listas importadas
    // guardam o ID original em originalSharedId ou sourceSharedId
    const effectiveSharedId =
      currentList?.sharedId ||
      currentList?.originalSharedId ||
      currentList?.sourceSharedId;

    const shouldPoll =
      screen === "list" &&
      effectiveSharedId &&
      isRealSharedList?.(currentList);

    if (!shouldPoll) return;

    const poll = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        await onRefresh?.();
      } catch {
        // silencia erros de rede
      } finally {
        isPollingRef.current = false;
      }
    };

    intervalRef.current = setInterval(poll, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    screen,
    currentList?.id,
    currentList?.sharedId,
    currentList?.originalSharedId,
    currentList?.sourceSharedId,
    currentList?.isShared,
    currentList?.imported,
    isRealSharedList,
    onRefresh,
  ]);

  return null;
}
