import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "../config/env";
import { getStoredValue } from "../utils/storageUtils";
import { APP_USER_ID_KEY } from "../config/storageKeys";

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function getAppUserId() {
  return getStoredValue(APP_USER_ID_KEY) || null;
}

export async function getSharedListRecord(id) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado.");
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: "GET",
      headers: supabaseHeaders(),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Erro ao abrir lista compartilhada (${res.status}) ${text}`.trim()
    );
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : null;
}

// ─── CORREÇÃO DO BUG RECURSIVO ────────────────────────────────────────────────
// O bug anterior espalhava `...list` diretamente no campo `data`, incluindo
// qualquer campo `data` que já existisse no objeto list (vindo de leituras
// anteriores do banco). Isso criava data.data.data... infinito.
//
// A correção extrai apenas os campos de lista que fazem sentido persistir,
// explicitamente, sem espalhar o objeto inteiro. O campo `data` do registro
// do banco nunca é incluído no payload de escrita.
// ─────────────────────────────────────────────────────────────────────────────
function buildSafeDataPayload(list, id) {
  // Extrai apenas os campos relevantes da lista, excluindo campos de banco
  // que causam a recursão (como `data`, `remetente`, `user_id`, etc.)
  const {
    // Campos do banco que NÃO devem ir para dentro do data jsonb
    data: _data,           // <- este é o campo recursivo, nunca incluir
    remetente: _remetente,
    user_id: _user_id,
    created_at: _created_at,
    // Campos de lista que SÃO válidos para persistir
    id: listId,
    name,
    type,
    budget,
    categories,
    items,
    ownerName,
    sharedOwner,
    userId,
    deviceId,
    isShared,
    imported,
    importedAt,
    receivedAt,
    sharedAt,
    sharedEvents,
    lastEventAt,
    lastSyncedAt,
    lastSyncSource,
    lastRemoteSignature,
    lastCloudSeenAt,
    status,
    completedAt,
    market_name,
    // Qualquer campo restante que não seja do banco
    ...rest
  } = list || {};

  return {
    id: listId,
    name,
    type,
    budget,
    categories,
    items,
    ownerName,
    sharedOwner,
    userId: userId || getAppUserId() || null,
    deviceId,
    isShared,
    imported,
    importedAt,
    receivedAt,
    sharedAt,
    sharedEvents,
    lastEventAt,
    lastSyncedAt: new Date().toISOString(),
    lastSyncSource,
    lastRemoteSignature,
    lastCloudSeenAt,
    status,
    completedAt,
    market_name,
    sharedId: id,
    // Inclui campos extras que não sejam do banco
    ...Object.fromEntries(
      Object.entries(rest).filter(([k]) =>
        !["title", "list_type", "user_id", "created_at"].includes(k)
      )
    ),
  };
}

export async function updateSharedListRecord(id, list) {
  if (!id || !hasSupabaseConfig()) return null;

  const userId = list?.userId || getAppUserId() || null;
  const safeData = buildSafeDataPayload(list, id);

  const payload = {
    title: list?.name || "Lista de compras",
    list_type: list?.type || "general",
    budget: Number(list?.budget || 0),
    data: safeData,
    user_id: userId,
  };

  const patchSharedList = async (bodyPayload) =>
    fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${id}`, {
      method: "PATCH",
      headers: supabaseHeaders({
        Prefer: "return=representation",
      }),
      body: JSON.stringify(bodyPayload),
    });

  let res = await patchSharedList(payload);

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    if (/user_id|column/i.test(text)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.user_id;

      res = await patchSharedList(fallbackPayload);

      if (!res.ok) {
        const retryText = await res.text().catch(() => "");
        throw new Error(
          `Erro ao sincronizar lista compartilhada (${res.status}) ${retryText}`.trim()
        );
      }
    } else {
      throw new Error(
        `Erro ao sincronizar lista compartilhada (${res.status}) ${text}`.trim()
      );
    }
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

export async function deleteSharedListRecord(id) {
  if (!id || !hasSupabaseConfig()) return false;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: supabaseHeaders(),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Erro ao excluir lista compartilhada (${res.status}) ${text}`.trim()
      );
    }

    return true;
  } catch (err) {
    console.warn("Erro ao excluir lista compartilhada no Supabase:", err);
    return false;
  }
}

// ─── REALTIME: SINCRONIZAÇÃO EM TEMPO REAL ────────────────────────────────────
// Abre um canal WebSocket via Supabase Realtime e chama `onUpdate` sempre que
// o registro da lista compartilhada for alterado por qualquer cliente.
// Retorna uma função de cleanup para cancelar a subscription.
//
// Uso:
//   const unsubscribe = subscribeToSharedList(sharedId, (updatedRecord) => {
//     // atualiza o estado local com os dados novos
//   });
//   // Para cancelar: unsubscribe()
// ─────────────────────────────────────────────────────────────────────────────
export function subscribeToSharedList(sharedId, onUpdate) {
  if (!sharedId || !hasSupabaseConfig()) return () => {};

  // Supabase Realtime via REST (sem SDK) — usa EventSource/WebSocket manual
  // Como o projeto usa fetch direto sem o SDK do Supabase, usamos polling
  // eficiente com intervalo curto como fallback compatível com a arquitetura atual.
  // Para migrar para WebSocket nativo do Supabase SDK no futuro, basta substituir
  // este bloco por supabase.channel(...).on('postgres_changes', ...).subscribe()
  
  let active = true;
  let lastSignature = null;
  let interval = null;

  const poll = async () => {
    if (!active) return;
    try {
      const record = await getSharedListRecord(sharedId);
      if (!record) return;
      
      // Gera uma assinatura simples baseada nos dados para detectar mudanças
      const sig = JSON.stringify({
        checked: (record.data?.categories || [])
          .flatMap(c => (c.items || []))
          .map(i => `${i.name}:${i.checked}:${i.notFound}`)
          .join("|"),
        lastSyncedAt: record.data?.lastSyncedAt || "",
      });

      if (lastSignature !== null && sig !== lastSignature) {
        onUpdate(record);
      }
      lastSignature = sig;
    } catch {
      // silencia erros de rede durante polling
    }
  };

  // Polling a cada 4 segundos — frequência adequada para uso simultâneo no mercado
  // sem sobrecarregar o banco. Ajuste conforme necessário.
  interval = setInterval(poll, 4000);
  poll(); // executa imediatamente na primeira vez

  return () => {
    active = false;
    if (interval) clearInterval(interval);
  };
}

// ─── REALTIME: EVENTOS DE NOTIFICAÇÃO ENTRE USUÁRIOS ─────────────────────────
// Registra eventos de status na lista compartilhada para que o dono
// seja notificado dentro do app quando:
//   - o destinatário abriu a lista        → tipo: "list_opened"
//   - o destinatário iniciou a compra     → tipo: "shopping_started"
//   - a lista foi finalizada              → tipo: "list_completed"
// ─────────────────────────────────────────────────────────────────────────────
export async function registerSharedListEvent(sharedId, eventType, actorName) {
  if (!sharedId || !hasSupabaseConfig()) return false;

  try {
    const record = await getSharedListRecord(sharedId);
    if (!record) return false;

    const existingData = record.data && typeof record.data === "object" ? record.data : {};
    const existingEvents = Array.isArray(existingData.sharedEvents) ? existingData.sharedEvents : [];

    const newEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: eventType,
      actorName: actorName || "Usuário",
      createdAt: new Date().toISOString(),
    };

    const updatedEvents = [newEvent, ...existingEvents].slice(0, 80);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(sharedId)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({
          data: {
            ...existingData,
            sharedEvents: updatedEvents,
            lastEventAt: newEvent.createdAt,
            lastEventType: eventType,
          },
        }),
      }
    );

    return res.ok;
  } catch (err) {
    console.warn("Erro ao registrar evento na lista compartilhada:", err);
    return false;
  }
}
