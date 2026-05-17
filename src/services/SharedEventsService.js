import { SUPABASE_URL } from "../config/env";
import { APP_USER_NAME_KEY } from "../config/storageKeys";
import { getStoredValue } from "../utils/storageUtils";
import {
  hasSupabaseConfig,
  supabaseHeaders,
  getSharedListRecord,
} from "./sharedListService";

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

function normalizeSharedEventsCacheKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getAppUserNameForSharedEvents() {
  return (
    getStoredValue(APP_USER_NAME_KEY) ||
    getStoredValue("tnl_sender_name") ||
    ""
  ).trim();
}

// ─── EVENTOS NA LISTA COMPARTILHADA ──────────────────────────────────────────
// Grava eventos dentro do campo data.sharedEvents da lista compartilhada.
// Esses eventos são lidos pelo polling do dono para gerar notificações internas.
// ─────────────────────────────────────────────────────────────────────────────

export async function appendSharedListEvent(id, event = {}) {
  if (!id || !hasSupabaseConfig()) return false;
  try {
    const record = await getSharedListRecord(id);
    if (!record) return false;

    // ── CORREÇÃO: nunca espalhar record.data dentro de data novamente ──────
    // Extrai apenas sharedEvents e lastEventAt do data existente,
    // sem copiar o objeto data inteiro de volta para dentro de si mesmo.
    const existingData = record?.data && typeof record.data === "object" ? record.data : {};
    const existing = Array.isArray(existingData.sharedEvents) ? existingData.sharedEvents : [];

    const normalizedEvent = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: event.type || "info",
      message: event.message || "",
      actorName: event.actorName || getAppUserNameForSharedEvents() || "",
      targetName: event.targetName || existingData.ownerName || existingData.remetente || record.remetente || "",
      listName: event.listName || existingData.name || record.title || "Lista",
      listId: existingData.id || "",
      sharedId: id,
      createdAt: event.createdAt || new Date().toISOString(),
    };

    const nextEvents = [normalizedEvent, ...existing].slice(0, 80);

    // PATCH apenas nos campos sharedEvents e lastEventAt, sem reescrever data inteiro
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: supabaseHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify({
          data: {
            ...existingData,
            sharedEvents: nextEvents,
            lastEventAt: normalizedEvent.createdAt,
            lastEventType: normalizedEvent.type,
          },
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn("Erro ao registrar evento compartilhado:", err);
    return false;
  }
}

// ─── ARMAZENAMENTO LOCAL DE NOTIFICAÇÕES ─────────────────────────────────────

export function getNotificationStorageKey(userName = getAppUserNameForSharedEvents()) {
  const name = normalizeSharedEventsCacheKey(userName || "anon");
  return `tnl_internal_notifications:${name || "anon"}`;
}

export function loadStoredNotifications(userName = getAppUserNameForSharedEvents()) {
  try {
    const raw = localStorage.getItem(getNotificationStorageKey(userName)) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredNotifications(items, userName = getAppUserNameForSharedEvents()) {
  try {
    localStorage.setItem(
      getNotificationStorageKey(userName),
      JSON.stringify(Array.isArray(items) ? items.slice(0, 80) : [])
    );
  } catch {}
}

export function eventToNotification(event) {
  if (!event || !event.id) return null;
  return {
    id: `shared-${event.id}`,
    type: event.type || "shared",
    message: event.message || "Atualização em lista compartilhada",
    read: false,
    createdAt: event.createdAt || new Date().toISOString(),
    meta: {
      sharedId: event.sharedId || "",
      listId: event.listId || "",
      listName: event.listName || "",
      actorName: event.actorName || "",
    },
  };
}

export function buildSharedListEvent(sharedId, list, { type, actorName, targetName, message }) {
  const cleanActor = String(actorName || getAppUserNameForSharedEvents() || "Usuário").trim();
  const cleanTarget = String(
    targetName ||
    list?.ownerName ||
    list?.remetente ||
    list?.sharedOwner ||
    ""
  ).trim();

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: type || "info",
    actorName: cleanActor,
    targetName: cleanTarget,
    listName: list?.name || "Lista",
    listId: list?.id || "",
    sharedId: sharedId || list?.sharedId || "",
    createdAt: new Date().toISOString(),
    message: message || `${cleanActor} atualizou a lista "${list?.name || "compartilhada"}".`,
  };
}

export function addLocalSharedEventToList(list, event) {
  if (!list || !event?.id) return list;
  const current = Array.isArray(list.sharedEvents) ? list.sharedEvents : [];
  if (current.some((item) => item?.id === event.id)) return list;
  return {
    ...list,
    sharedEvents: [event, ...current].slice(0, 80),
    lastEventAt: event.createdAt || new Date().toISOString(),
  };
}

// ─── POLLING DE NOTIFICAÇÕES PARA O DONO DA LISTA ────────────────────────────
// Monitora os eventos da lista compartilhada e gera notificações internas
// para o usuário que compartilhou, quando:
//   - "list_opened"      → destinatário abriu a lista
//   - "shopping_started" → destinatário iniciou a compra
//   - "list_completed"   → lista foi finalizada
//
// Uso no App.jsx:
//   const stopPolling = startOwnerNotificationPolling(
//     sharedId,
//     currentUserName,
//     (notification) => { /* adiciona notificação ao estado */ }
//   );
//   // Para parar: stopPolling()
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_MESSAGES = {
  list_opened: (actorName, listName) =>
    `${actorName || "O destinatário"} abriu a lista "${listName}".`,
  shopping_started: (actorName, listName) =>
    `${actorName || "O destinatário"} começou a fazer as compras da lista "${listName}".`,
  list_completed: (actorName, listName) =>
    `A lista "${listName}" foi finalizada por ${actorName || "o destinatário"}.`,
};

export function startOwnerNotificationPolling(sharedId, ownerName, onNewNotification) {
  if (!sharedId || !hasSupabaseConfig()) return () => {};

  let active = true;
  let seenEventIds = new Set(
    loadStoredNotifications(ownerName)
      .map(n => n.meta?.sourceEventId)
      .filter(Boolean)
  );

  const poll = async () => {
    if (!active) return;
    try {
      const record = await getSharedListRecord(sharedId);
      if (!record) return;

      const data = record?.data && typeof record.data === "object" ? record.data : {};
      const events = Array.isArray(data.sharedEvents) ? data.sharedEvents : [];
      const listName = data.name || record.title || "Lista";

      // Filtra apenas eventos relevantes para o dono que ainda não foram vistos
      const newEvents = events.filter(evt =>
        evt?.id &&
        !seenEventIds.has(evt.id) &&
        Object.keys(EVENT_MESSAGES).includes(evt.type) &&
        // Não notifica eventos do próprio dono
        normalizeSharedEventsCacheKey(evt.actorName) !== normalizeSharedEventsCacheKey(ownerName)
      );

      if (newEvents.length === 0) return;

      const currentNotifications = loadStoredNotifications(ownerName);

      newEvents.forEach(evt => {
        seenEventIds.add(evt.id);

        const messageFn = EVENT_MESSAGES[evt.type];
        const message = messageFn
          ? messageFn(evt.actorName, listName)
          : `Atualização na lista "${listName}".`;

        const notification = {
          id: `owner-notif-${evt.id}`,
          type: evt.type,
          message,
          read: false,
          createdAt: evt.createdAt || new Date().toISOString(),
          meta: {
            sharedId,
            listId: data.id || "",
            listName,
            actorName: evt.actorName || "",
            sourceEventId: evt.id,
          },
        };

        currentNotifications.unshift(notification);
        onNewNotification?.(notification);
      });

      saveStoredNotifications(currentNotifications.slice(0, 80), ownerName);
    } catch {
      // silencia erros de rede
    }
  };

  // Polling a cada 8 segundos para notificações do dono
  // (menos frequente que o sync de itens pois não é tempo-crítico)
  const interval = setInterval(poll, 8000);
  poll();

  return () => {
    active = false;
    clearInterval(interval);
  };
}
