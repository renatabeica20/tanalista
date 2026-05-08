import { SUPABASE_URL } from "../config/env";
import { APP_USER_NAME_KEY } from "../config/storageKeys";
import { getStoredValue } from "../utils/storageUtils";
import {
  hasSupabaseConfig,
  supabaseHeaders,
  getSharedListRecord,
} from "./sharedListService";

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

export async function appendSharedListEvent(id, event = {}) {
  if (!id || !hasSupabaseConfig()) return false;
  try {
    const record = await getSharedListRecord(id);
    if (!record) return false;
    const data = record?.data && typeof record.data === "object" ? record.data : {};
    const existing = Array.isArray(data.sharedEvents) ? data.sharedEvents : [];
    const normalizedEvent = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: event.type || "info",
      message: event.message || "",
      actorName: event.actorName || getAppUserNameForSharedEvents() || "",
      targetName: event.targetName || data.ownerName || data.remetente || record.remetente || "",
      listName: event.listName || data.name || record.title || "Lista",
      listId: data.id || "",
      sharedId: id,
      createdAt: event.createdAt || new Date().toISOString(),
    };
    const nextEvents = [normalizedEvent, ...existing].slice(0, 80);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: supabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify({ data: { ...data, sharedEvents: nextEvents, lastEventAt: normalizedEvent.createdAt } }),
    });
    return res.ok;
  } catch (err) {
    console.warn("Erro ao registrar evento compartilhado:", err);
    return false;
  }
}

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
