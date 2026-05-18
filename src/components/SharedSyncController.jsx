import { useEffect, useRef } from "react";

// Intervalo de polling em ms.
// 15s é suficiente para sincronização em tempo real no mercado
// e reduz o egress em ~75% comparado ao intervalo anterior de 4s.
const POLL_INTERVAL_MS = 15000;

// Pausa após gravação local — evita race condition onde o polling
// busca antes da escrita completar e desfaz a marcação do usuário.
const POST_WRITE_PAUSE_MS = 8000;

export default function SharedSyncController({
  screen,
  currentList,
  isRealSharedList,
  getListSyncStamp,
  autoSyncNoticeRef,
  onRefresh,
  lastLocalWriteAt,
}) {
  const intervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const lastLocalWriteAtRef = useRef(lastLocalWriteAt);

  // Mantém ref sempre atualizada sem reiniciar o intervalo
  useEffect(() => {
    lastLocalWriteAtRef.current = lastLocalWriteAt;
  }, [lastLocalWriteAt]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

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

      const msSinceWrite = lastLocalWriteAtRef.current
        ? Date.now() - lastLocalWriteAtRef.current
        : Infinity;
      if (msSinceWrite < POST_WRITE_PAUSE_MS) return;

      isPollingRef.current = true;
      try {
        await onRefresh?.();
      } catch {
        // silencia erros de rede
      } finally {
        isPollingRef.current = false;
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

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
