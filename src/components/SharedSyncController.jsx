import { useEffect, useRef } from "react";

// ─── SharedSyncController ─────────────────────────────────────────────────────
// Versão anterior: fazia apenas um pull único com intervalo mínimo de 45s.
// Versão atual: polling contínuo a cada 4s enquanto a lista compartilhada
// está aberta, permitindo uso simultâneo em tempo real no supermercado.
//
// O polling só roda quando:
//   - screen === "list" (lista está aberta)
//   - currentList.sharedId existe (é uma lista compartilhada)
//   - isRealSharedList retorna true
//
// Para quando:
//   - Usuário sai da tela da lista
//   - Componente desmonta
// ─────────────────────────────────────────────────────────────────────────────

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
    // Limpa qualquer polling anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Só inicia polling quando a lista compartilhada está aberta
    const shouldPoll =
      screen === "list" &&
      currentList?.sharedId &&
      isRealSharedList?.(currentList);

    if (!shouldPoll) return;

    // Função de poll — busca dados atualizados do Supabase
    const poll = async () => {
      if (isPollingRef.current) return; // evita chamadas simultâneas
      isPollingRef.current = true;
      try {
        await onRefresh?.();
      } catch {
        // silencia erros de rede
      } finally {
        isPollingRef.current = false;
      }
    };

    // Polling a cada 4 segundos
    intervalRef.current = setInterval(poll, 4000);

    // Cleanup ao sair da tela ou desmontar
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
    currentList?.isShared,
    currentList?.imported,
    isRealSharedList,
    onRefresh,
  ]);

  return null;
}
