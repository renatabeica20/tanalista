import {
  SUPABASE_URL,
} from "../config/env";
import {
  APP_USER_NAME_KEY,
  APP_DEVICE_ID_KEY,
  APP_USER_REGISTERED_KEY,
  APP_USER_ID_KEY,
} from "../config/storageKeys";
import {
  getStoredValue,
  setStoredValue,
} from "../utils/storageUtils";
import {
  normalizeAuthName,
} from "../utils/formatters";
import {
  hasSupabaseConfig,
  supabaseHeaders,
  getSharedListRecord,
} from "./sharedListService";

/*
 * CloudPersistenceService
 * Centraliza identidade leve do app, recuperação/salvamento de listas no Supabase
 * e utilitários de sincronização cloud/local.
 */

function normalizeDeletedKeyPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getListPersistenceKeys(listOrId) {
  if (!listOrId) return [];
  if (typeof listOrId === "string" || typeof listOrId === "number") return [`id:${String(listOrId)}`, `shared:${String(listOrId)}`];

  const keys = [];
  const data = listOrId.data && typeof listOrId.data === "object" ? listOrId.data : null;

  if (listOrId.id) keys.push(`id:${String(listOrId.id)}`);
  if (listOrId.sharedId) keys.push(`shared:${String(listOrId.sharedId)}`);
  if (data?.id) keys.push(`id:${String(data.id)}`);
  if (data?.sharedId) keys.push(`shared:${String(data.sharedId)}`);
  const createdPart = normalizeDeletedKeyPart(listOrId.created_at || listOrId.createdAt || data?.createdAt || data?.created_at || "");
  if (createdPart && listOrId.user_id && listOrId.title) keys.push(`user:${String(listOrId.user_id)}:${normalizeDeletedKeyPart(listOrId.title)}:${createdPart}`);
  if (createdPart && listOrId.userId && listOrId.name) keys.push(`user:${String(listOrId.userId)}:${normalizeDeletedKeyPart(listOrId.name)}:${createdPart}`);
  if (createdPart && data?.userId && data?.name) keys.push(`user:${String(data.userId)}:${normalizeDeletedKeyPart(data.name)}:${createdPart}`);
  if (createdPart && listOrId.remetente && listOrId.title) keys.push(`owner:${normalizeDeletedKeyPart(listOrId.remetente)}:${normalizeDeletedKeyPart(listOrId.title)}:${createdPart}`);
  if (createdPart && listOrId.ownerName && listOrId.name) keys.push(`owner:${normalizeDeletedKeyPart(listOrId.ownerName)}:${normalizeDeletedKeyPart(listOrId.name)}:${createdPart}`);

  return Array.from(new Set(keys.filter(Boolean)));
}

function getListComparableStamp(list) {
  const data = list?.data && typeof list.data === "object" ? list.data : null;
  const candidates = [
    list?.lastSyncedAt, data?.lastSyncedAt,
    list?.lastLocalUpdateAt, data?.lastLocalUpdateAt,
    list?.updatedAt, data?.updatedAt,
    list?.createdAt, data?.createdAt,
    list?.created_at, data?.created_at,
  ];
  for (const value of candidates) {
    const t = value ? new Date(value).getTime() : 0;
    if (Number.isFinite(t) && t > 0) return t;
  }
  return 0;
}

function getAppDeviceId() {
  let id = getStoredValue(APP_DEVICE_ID_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setStoredValue(APP_DEVICE_ID_KEY, id);
  }
  return id;
}

function getAppUserName() {
  return (
    getStoredValue(APP_USER_NAME_KEY) ||
    getStoredValue("tnl_sender_name") ||
    ""
  ).trim();
}

function saveAppUserName(name) {
  const clean = String(name || "").trim();
  if (!clean) return "";
  setStoredValue(APP_USER_NAME_KEY, clean);
  setStoredValue("tnl_sender_name", clean);
  return clean;
}

function getAppUserId() {
  return getStoredValue(APP_USER_ID_KEY);
}

function saveAppUserId(id) {
  if (id) setStoredValue(APP_USER_ID_KEY, id);
}

async function findAppUserByDeviceId(deviceId) {
  if (!deviceId || !hasSupabaseConfig()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?device_id=eq.${encodeURIComponent(deviceId)}&select=id,nome,device_id&limit=1`, {
      method: "GET",
      headers: supabaseHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}

async function findAppUserByName(name) {
  const clean = String(name || "").trim();
  if (!clean || !hasSupabaseConfig()) return null;

  const normalized = normalizeAuthName(clean);

  const tryFetch = async (filter) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?${filter}&select=id,nome,device_id,nome_normalizado&limit=1`, {
      method: "GET",
      headers: supabaseHeaders({ "Cache-Control": "no-store" }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : null;
  };

  try {
    return (
      await tryFetch(`nome_normalizado=eq.${encodeURIComponent(normalized)}`) ||
      await tryFetch(`nome=eq.${encodeURIComponent(clean)}`) ||
      await tryFetch(`nome=ilike.${encodeURIComponent(clean)}`)
    );
  } catch {
    return null;
  }
}

async function getSharedListsByUserId(userId) {
  if (!userId || !hasSupabaseConfig()) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?user_id=eq.${encodeURIComponent(userId)}&list_type=neq.auth_profile&select=*&order=created_at.desc`, {
      method: "GET",
      headers: supabaseHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getSharedListsByOwnerName(name) {
  const clean = String(name || "").trim();
  if (!clean || !hasSupabaseConfig()) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?remetente=ilike.${encodeURIComponent(clean)}&list_type=neq.auth_profile&select=*&order=created_at.desc`, {
      method: "GET",
      headers: supabaseHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getSharedListsForUser(userId, name) {
  const byUser = userId ? await getSharedListsByUserId(userId) : [];
  const byName = name ? await getSharedListsByOwnerName(name) : [];
  const map = new Map();
  [...byUser, ...byName].forEach(record => {
    if (!record) return;
    const key = record?.data?.id ? `id:${String(record.data.id)}` : (record?.id || record?.data?.sharedId || JSON.stringify(record));
    const prev = map.get(key);
    const prevStamp = getListComparableStamp(prev || {});
    const nextStamp = getListComparableStamp({ ...(record || {}), ...(record?.data || {}) });
    if (key && (!prev || nextStamp >= prevStamp)) map.set(key, record);
  });
  return Array.from(map.values()).sort((a, b) => getListComparableStamp({ ...(b || {}), ...(b?.data || {}) }) - getListComparableStamp({ ...(a || {}), ...(a?.data || {}) }));
}

// ─── CORREÇÃO: sharedRecordToLocalList ───────────────────────────────────────
// Versão anterior não preservava os campos imported/importedAt/importedFrom,
// fazendo com que listas recebidas perdessem seu status após recargas.
//
// Agora: preserva explicitamente todos os campos de origem da lista,
// sem sobrescrever ownerName/remetente quando já estão definidos no registro.
// ─────────────────────────────────────────────────────────────────────────────
function sharedRecordToLocalList(record) {
  const base = record?.data || {};
  const currentUserName = getAppUserName();
  const recordOwner = record?.remetente || base.ownerName || base.remetente || "";

  // Detecta se a lista foi recebida de outro usuário comparando o remetente
  // do registro com o usuário atual. Usa normalização para evitar falsos negativos
  // por diferença de maiúsculas/acentos.
  const normalizedOwner = normalizeAuthName(recordOwner);
  const normalizedCurrent = normalizeAuthName(currentUserName);
  const isFromAnotherUser = Boolean(
    normalizedOwner &&
    normalizedCurrent &&
    normalizedOwner !== normalizedCurrent
  );

  // Preserva imported=true se já estava definido, OU se detectamos que veio
  // de outro usuário E há marca de importação (importedAt ou receivedAt).
  const wasImported = base.imported === true || Boolean(base.importedAt || base.receivedAt);
  const shouldMarkImported = wasImported && isFromAnotherUser;

  return {
    ...base,
    id: base.id || `shared-${record?.id || Date.now()}`,
    sharedId: record?.id || base.sharedId || null,
    userId: record?.user_id || base.userId || null,
    // Preserva o nome do dono original — não sobrescreve com o usuário atual
    ownerName: recordOwner || currentUserName || "Usuário do Tá na Lista",
    remetente: recordOwner || base.remetente || currentUserName || "Usuário do Tá na Lista",
    // ── Campos de origem preservados explicitamente ──
    imported: shouldMarkImported,
    importedAt: base.importedAt || null,
    importedFrom: base.importedFrom || (isFromAnotherUser ? recordOwner : null),
    receivedAt: base.receivedAt || null,
    isShared: base.isShared === true,
    restoredFromCloud: true,
    restoredAt: new Date().toISOString(),
  };
}

async function registerAppUser(name, { force = false } = {}) {
  const clean = String(name || getAppUserName() || "").trim();
  if (!clean || !hasSupabaseConfig()) return false;

  const device_id = getAppDeviceId();
  const existingUserId = getAppUserId();
  const alreadyRegistered = getStoredValue(APP_USER_REGISTERED_KEY);
  if (!force && alreadyRegistered === device_id && existingUserId) return existingUserId;

  try {
    const foundByNameFirst = force ? await findAppUserByName(clean) : null;
    if (foundByNameFirst?.id) {
      saveAppUserId(foundByNameFirst.id);
      setStoredValue(APP_USER_REGISTERED_KEY, device_id);
      if (foundByNameFirst.nome) saveAppUserName(foundByNameFirst.nome);
      return foundByNameFirst.id;
    }

    const found = await findAppUserByDeviceId(device_id);
    if (found?.id) {
      saveAppUserId(found.id);
      setStoredValue(APP_USER_REGISTERED_KEY, device_id);
      if (found.nome) saveAppUserName(found.nome);
      return found.id;
    }

    const foundByName = await findAppUserByName(clean);
    if (foundByName?.id) {
      saveAppUserId(foundByName.id);
      setStoredValue(APP_USER_REGISTERED_KEY, device_id);
      if (foundByName.nome) saveAppUserName(foundByName.nome);
      return foundByName.id;
    }

    const nomeNormalizado = normalizeAuthName(clean);
    const payload = {
      nome: clean,
      nome_normalizado: nomeNormalizado,
      device_id,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=nome_normalizado`, {
      method: "POST",
      headers: supabaseHeaders({
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 409 || /duplicate key|users_nome_normalizado_unique|nome_normalizado/i.test(text)) {
        const existing = await findAppUserByName(clean);
        if (existing?.id) {
          saveAppUserId(existing.id);
          setStoredValue(APP_USER_REGISTERED_KEY, device_id);
          if (existing.nome) saveAppUserName(existing.nome);
          return existing.id;
        }
      }
      if (/nome_normalizado|column/i.test(text)) {
        const fallbackRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
          method: "POST",
          headers: supabaseHeaders({ Prefer: "return=representation" }),
          body: JSON.stringify({ nome: clean, device_id }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json().catch(() => []);
          const fallbackCreated = Array.isArray(fallbackData) ? fallbackData[0] : fallbackData;
          if (fallbackCreated?.id) saveAppUserId(fallbackCreated.id);
          setStoredValue(APP_USER_REGISTERED_KEY, device_id);
          return fallbackCreated?.id || true;
        }
      }
      console.warn("Não foi possível registrar usuário:", res.status, text);
      return false;
    }

    const data = await res.json().catch(() => []);
    const created = Array.isArray(data) ? data[0] : data;
    if (created?.id) saveAppUserId(created.id);
    if (created?.nome) saveAppUserName(created.nome);
    setStoredValue(APP_USER_REGISTERED_KEY, device_id);
    return created?.id || true;
  } catch (err) {
    console.warn("Erro ao registrar usuário:", err);
    return false;
  }
}

// ─── CORREÇÃO: createSharedListRecord ────────────────────────────────────────
// Versão anterior fazia ...list dentro de data, herdando o bug recursivo
// de data.data.data... igual ao sharedListService.
// Agora usa buildSafeListData para extrair apenas campos de lista válidos.
// ─────────────────────────────────────────────────────────────────────────────
function buildSafeListData(list, ownerName) {
  const {
    // Campos do banco que NUNCA devem ir dentro do data jsonb
    data: _data,
    remetente: _remetente,
    user_id: _user_id,
    created_at: _created_at,
    // Campos válidos de lista
    id,
    name,
    type,
    budget,
    categories,
    items,
    sharedOwner,
    userId,
    deviceId,
    isShared,
    imported,
    importedAt,
    importedFrom,
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
    sharedId,
    ...rest
  } = list || {};

  return {
    id,
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
    importedFrom,
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
    sharedId,
    ...Object.fromEntries(
      Object.entries(rest).filter(([k]) =>
        !["title", "list_type", "user_id", "created_at"].includes(k)
      )
    ),
  };
}

async function findSharedListRecordByList(list) {
  if (!list || !hasSupabaseConfig()) return null;
  try {
    const userId = list.userId || list.user_id || getAppUserId();
    const ownerName = list.ownerName || list.remetente || getAppUserName();
    const name = list.name || "";
    if (!name) return null;

    const tryFetch = async (filter) => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/shared_lists?${filter}&list_type=neq.auth_profile&select=*&order=created_at.desc&limit=5`,
        { method: "GET", headers: supabaseHeaders({ "Cache-Control": "no-store" }) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    };

    const candidates = userId
      ? await tryFetch(`user_id=eq.${encodeURIComponent(userId)}`)
      : ownerName
        ? await tryFetch(`remetente=ilike.${encodeURIComponent(ownerName)}`)
        : [];

    const normalizedName = String(name).trim().toLowerCase();
    const match = candidates.find(record => {
      const recordName = String(record?.data?.name || record?.title || "").trim().toLowerCase();
      return recordName === normalizedName && !record?.data?.isDeleted;
    });

    return match || null;
  } catch {
    return null;
  }
}

async function createSharedListRecord(list) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.");
  }

  const ownerName = list?.remetente || list?.ownerName || getAppUserName() || "Usuário do Tá na Lista";
  const userId = await registerAppUser(ownerName).catch(() => getAppUserId());

  const payload = {
    title: list?.name || "Lista de compras",
    list_type: list?.type || "geral",
    budget: Number(list?.budget || 0),
    data: buildSafeListData(list, ownerName),
    remetente: ownerName,
    user_id: userId || getAppUserId() || null,
  };

  const postSharedList = async (bodyPayload) => fetch(`${SUPABASE_URL}/rest/v1/shared_lists`, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(bodyPayload),
  });

  let res = await postSharedList(payload);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (/user_id|column/i.test(text)) {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.user_id;
      res = await postSharedList(fallbackPayload);
      if (!res.ok) {
        const retryText = await res.text().catch(() => "");
        throw new Error(`Erro ao salvar lista compartilhada (${res.status}) ${retryText}`.trim());
      }
    } else {
      throw new Error(`Erro ao salvar lista compartilhada (${res.status}) ${text}`.trim());
    }
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function hideSharedListRecordForCurrentUser(id) {
  if (!id || !hasSupabaseConfig()) return false;

  try {
    const record = await getSharedListRecord(id);
    if (!record) return false;

    const deviceId = getAppDeviceId();
    const userId = getAppUserId();
    const userName = getAppUserName();
    const data = record?.data && typeof record.data === "object" ? record.data : {};
    const hiddenForDeviceIds = Array.from(new Set([...(Array.isArray(data.hiddenForDeviceIds) ? data.hiddenForDeviceIds : []), deviceId].filter(Boolean)));
    const hiddenForUserIds = Array.from(new Set([...(Array.isArray(data.hiddenForUserIds) ? data.hiddenForUserIds : []), userId].filter(Boolean)));
    const hiddenForNames = Array.from(new Set([...(Array.isArray(data.hiddenForNames) ? data.hiddenForNames : []), userName].filter(Boolean).map(v => String(v).trim().toLowerCase())));

    const payload = {
      data: {
        ...data,
        hiddenForDeviceIds,
        hiddenForUserIds,
        hiddenForNames,
        lastHiddenAt: new Date().toISOString(),
      },
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: supabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("Não foi possível ocultar lista compartilhada no Supabase:", res.status, text);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Erro ao ocultar lista compartilhada para o usuário:", err);
    return false;
  }
}

async function softDeleteSharedListRecord(id, list = null) {
  if (!id || !hasSupabaseConfig()) return false;

  try {
    const record = await getSharedListRecord(id);
    if (!record) return false;

    const now = new Date().toISOString();
    const data = record?.data && typeof record.data === "object" ? record.data : {};
    const userId = getAppUserId() || list?.userId || data?.userId || record?.user_id || null;
    const userName = getAppUserName() || list?.ownerName || list?.remetente || data?.ownerName || data?.remetente || record?.remetente || "";

    const payload = {
      data: {
        ...data,
        isDeleted: true,
        deletedAt: now,
        deletedByUserId: userId,
        deletedByName: userName || null,
        deletedListKeys: getListPersistenceKeys({ ...(list || {}), ...record, data }),
        lastSyncedAt: now,
      },
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: supabaseHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("Não foi possível marcar lista como excluída no Supabase:", res.status, text);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Erro ao marcar lista como excluída no Supabase:", err);
    return false;
  }
}

function sharedListSignature(list) {
  try {
    if (!list) return "";
    return JSON.stringify({
      name: list.name || "",
      type: list.type || "",
      budget: Number(list.budget || 0),
      categories: Array.isArray(list.categories) ? list.categories : [],
      total: Number(list.total || 0),
    });
  } catch {
    return "";
  }
}

function getListSyncStamp(list) {
  const candidates = [list?.lastSyncedAt, list?.lastCloudSeenAt, list?.cloudUpdatedAt, list?.updatedAt, list?.lastLocalUpdateAt, list?.createdAt];
  for (const value of candidates) {
    const t = value ? new Date(value).getTime() : 0;
    if (Number.isFinite(t) && t > 0) return t;
  }
  return 0;
}

function formatRelativeSyncTime(value) {
  const t = value ? new Date(value).getTime() : 0;
  if (!Number.isFinite(t) || t <= 0) return "ainda não sincronizada";
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min === 1) return "há 1 min";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h === 1) return "há 1 h";
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}

function markListCloudSynced(list, remoteData = null) {
  const now = new Date().toISOString();
  const base = remoteData || list || {};
  const cloudStamp = base.lastSyncedAt || base.cloudUpdatedAt || base.updatedAt || now;
  return {
    ...(list || {}),
    lastCloudSeenAt: cloudStamp,
    lastRemoteSignature: sharedListSignature(base),
    lastSyncStatus: "ok",
  };
}

export {
  getAppDeviceId,
  getAppUserName,
  saveAppUserName,
  getAppUserId,
  saveAppUserId,
  findAppUserByDeviceId,
  findAppUserByName,
  getSharedListsByUserId,
  getSharedListsByOwnerName,
  getSharedListsForUser,
  sharedRecordToLocalList,
  registerAppUser,
  createSharedListRecord,
  hideSharedListRecordForCurrentUser,
  softDeleteSharedListRecord,
  findSharedListRecordByList,
  sharedListSignature,
  getListSyncStamp,
  formatRelativeSyncTime,
  markListCloudSynced,
};
