import { useState, useRef, useCallback, useEffect } from "react";
// Etapa 7.60 - Gráficos estáveis de orçamento, seções e produtos com filtros leves

// ── API Anthropic via função segura do Vercel ─────────────────────────────
// O navegador chama /api/anthropic; a chave fica protegida no servidor.
const ANTHROPIC_MODEL_CLASSIFY = import.meta.env.VITE_ANTHROPIC_MODEL_CLASSIFY || "claude-3-5-haiku-latest";
const ANTHROPIC_MODEL_ORGANIZE = import.meta.env.VITE_ANTHROPIC_MODEL_ORGANIZE || "claude-3-5-sonnet-latest";
const ANTHROPIC_MODEL_VISION = import.meta.env.VITE_ANTHROPIC_MODEL_VISION || "claude-3-5-sonnet-latest";

// ── Supabase: listas compartilháveis ──────────────────────────────────────
// Usa a REST API do Supabase diretamente para evitar dependência adicional.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}


function ensureMobileViewport() {
  try {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");

    let style = document.getElementById("tnl-mobile-fit-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "tnl-mobile-fit-style";
      document.head.appendChild(style);
    }
    style.textContent = `
      html, body, #root {
        width: 100%;
        min-width: 0;
        max-width: 100%;
        min-height: 100%;
        overflow-x: hidden;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
        overscroll-behavior-x: none;
        touch-action: manipulation;
      }
      html {
        height: 100%;
        overflow-x: hidden;
        background: #FFFFFF;
      }
      body {
        min-height: 100dvh;
        position: relative;
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
        background: #FFFFFF;
      }
      #root {
        width: 100%;
        max-width: 100%;
        min-height: 100dvh;
        overflow-x: hidden;
        isolation: isolate;
      }
      #root > * {
        max-width: 100%;
        overflow-x: hidden;
      }
      *, *::before, *::after {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }
      input, select, textarea, button {
        font-size: 16px;
        touch-action: manipulation;
      }
      input, textarea, select {
        -webkit-user-select: text;
        user-select: text;
      }
      img, svg, video, canvas {
        max-width: 100%;
      }
    `;
  } catch {}
}

// Aplica o viewport antes do primeiro render para evitar abertura com zoom/deslocamento no celular.
if (typeof document !== "undefined") {
  ensureMobileViewport();
}


// ── Cadastro leve de usuários ─────────────────────────────────────────────
// Identifica o usuário sem login/senha. O device_id permite mensurar usuários únicos.
const APP_USER_NAME_KEY = "tnl_user_name";
const APP_DEVICE_ID_KEY = "tnl_device_id";
const APP_USER_REGISTERED_KEY = "tnl_user_registered_device_id";
const APP_USER_ID_KEY = "tnl_user_id";
const APP_PIN_SESSION_NAME_KEY = "tnl_pin_verified_name";
const APP_PIN_SESSION_AT_KEY = "tnl_pin_verified_at";

function getStoredValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignora bloqueios pontuais de armazenamento local.
  }
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
    // A identidade principal agora é o nome normalizado, protegido por índice único no Supabase.
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

function sharedRecordToLocalList(record) {
  const base = record?.data || {};
  return {
    ...base,
    id: base.id || `shared-${record?.id || Date.now()}`,
    sharedId: record?.id || base.sharedId || null,
    userId: record?.user_id || base.userId || null,
    ownerName: record?.remetente || base.ownerName || base.remetente || getAppUserName() || "Usuario do Ta na Lista",
    remetente: record?.remetente || base.remetente || base.ownerName || getAppUserName() || "Usuario do Ta na Lista",
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
    // Quando o usuário informa o nome no login, o nome passa a ser a identidade principal.
    // O device_id continua apenas como identificação auxiliar do aparelho.
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

    // Se o armazenamento local foi perdido ou o acesso veio de outro aparelho,
    // recupera pelo nome antes de criar novo cadastro.
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
      // Se o banco bloquear duplicidade por corrida de requisições, reaproveita o usuário já existente.
      if (res.status === 409 || /duplicate key|users_nome_normalizado_unique|nome_normalizado/i.test(text)) {
        const existing = await findAppUserByName(clean);
        if (existing?.id) {
          saveAppUserId(existing.id);
          setStoredValue(APP_USER_REGISTERED_KEY, device_id);
          if (existing.nome) saveAppUserName(existing.nome);
          return existing.id;
        }
      }
      // Compatibilidade temporária: se a coluna ainda não existir em algum ambiente, tenta o fluxo antigo.
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
    data: {
      ...list,
      ownerName,
      userId: userId || getAppUserId() || null,
    },
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
    // Compatibilidade: se a coluna user_id ainda não existir no Supabase, salva a lista sem quebrar o compartilhamento.
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

async function getSharedListRecord(id) {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase não configurado.");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: "GET",
    headers: supabaseHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Erro ao abrir lista compartilhada (${res.status}) ${text}`.trim());
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : null;
}

async function updateSharedListRecord(id, list) {
  if (!id || !hasSupabaseConfig()) return null;

  const userId = list?.userId || getAppUserId() || null;
  const payload = {
    title: list?.name || "Lista de compras",
    list_type: list?.type || "geral",
    budget: Number(list?.budget || 0),
    data: {
      ...list,
      userId,
      sharedId: id,
      lastSyncedAt: new Date().toISOString(),
    },
    user_id: userId,
  };

  const patchSharedList = async (bodyPayload) => fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: supabaseHeaders({ Prefer: "return=representation" }),
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
        throw new Error(`Erro ao sincronizar lista compartilhada (${res.status}) ${retryText}`.trim());
      }
    } else {
      throw new Error(`Erro ao sincronizar lista compartilhada (${res.status}) ${text}`.trim());
    }
  }

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function deleteSharedListRecord(id) {
  if (!id || !hasSupabaseConfig()) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: supabaseHeaders(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Erro ao excluir lista compartilhada (${res.status}) ${text}`.trim());
    }

    return true;
  } catch (err) {
    console.warn("Erro ao excluir lista compartilhada no Supabase:", err);
    return false;
  }
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



function isPinSessionVerified(name) {
  const clean = String(name || "").trim().toLowerCase();
  const verified = getStoredValue(APP_PIN_SESSION_NAME_KEY).trim().toLowerCase();
  return Boolean(clean && verified && clean === verified);
}

function markPinSessionVerified(name) {
  const clean = String(name || "").trim();
  if (!clean) return;
  setStoredValue(APP_PIN_SESSION_NAME_KEY, clean);
  setStoredValue(APP_PIN_SESSION_AT_KEY, new Date().toISOString());
}

function clearPinSession() {
  try {
    localStorage.removeItem(APP_PIN_SESSION_NAME_KEY);
    localStorage.removeItem(APP_PIN_SESSION_AT_KEY);
  } catch {}
}

function normalizeAuthName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

async function hashUserPin(name, pin) {
  const cleanName = normalizeAuthName(name);
  const cleanPin = String(pin || "").trim();
  const raw = `ta-na-lista:v1:${cleanName}:${cleanPin}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback simples para navegadores antigos. Preferencialmente, todos os navegadores modernos usarão SHA-256.
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = Math.imul(31, h) + raw.charCodeAt(i) | 0;
  }
  return `fallback-${Math.abs(h)}`;
}

function normalizePin(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function isValidPin(value) {
  const pin = normalizePin(value);
  return pin.length >= 4 && pin.length <= 6;
}

async function findUserAuthProfile(name) {
  const clean = String(name || "").trim();
  if (!clean || !hasSupabaseConfig()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?list_type=eq.auth_profile&remetente=ilike.${encodeURIComponent(clean)}&select=*&order=created_at.asc&limit=1`, {
      method: "GET",
      headers: supabaseHeaders({ "Cache-Control": "no-store" }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}

async function createUserAuthProfile(name, pinHash) {
  const clean = String(name || "").trim();
  if (!clean || !pinHash || !hasSupabaseConfig()) return null;
  const payload = {
    title: `Perfil de acesso - ${clean}`,
    list_type: "auth_profile",
    budget: 0,
    remetente: clean,
    user_id: null,
    data: {
      authProfile: true,
      name: clean,
      pinHash,
      pinVersion: "sha256-v1",
      createdAt: new Date().toISOString(),
    },
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists`, {
    method: "POST",
    headers: supabaseHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Não foi possível criar PIN de acesso (${res.status}) ${detail}`.trim());
  }
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data[0] : data;
}

async function resetUserAuthPin(name, newPin, newPinConfirm = "") {
  const clean = String(name || "").trim();
  const safePin = normalizePin(newPin);
  const safeConfirm = normalizePin(newPinConfirm);

  if (!clean) return { ok: false, message: "Informe seu nome para recuperar o acesso." };
  if (!hasSupabaseConfig()) return { ok: false, message: "Configuração do Supabase não encontrada." };
  if (!isValidPin(safePin)) return { ok: false, message: "Informe um novo PIN de 4 a 6 dígitos." };
  if (!safeConfirm) return { ok: false, message: "Confirme o novo PIN para redefinir o acesso." };
  if (safePin !== safeConfirm) return { ok: false, message: "Os PINs informados não conferem." };

  const profile = await findUserAuthProfile(clean);
  if (!profile?.id || !profile?.data?.pinHash) {
    return { ok: false, message: "Não encontrei PIN cadastrado para este nome. Use o primeiro acesso para criar um PIN." };
  }

  // Recuperação de PIN compatível com iOS/Safari.
  // Em alguns aparelhos o localStorage pode regenerar o device_id, fazendo o mesmo iPhone parecer outro aparelho.
  // Por isso, se o perfil de PIN existe e o nome informado confere, a recuperação é permitida e a sessão local é reancorada.
  const deviceId = getAppDeviceId();
  const storedUserId = getAppUserId();
  const storedName = normalizeAuthName(getAppUserName());
  const appUser = await findAppUserByName(clean);
  const cleanNormalized = normalizeAuthName(clean);
  const profileNameMatches = Boolean(
    normalizeAuthName(profile?.remetente) === cleanNormalized ||
    normalizeAuthName(profile?.data?.name) === cleanNormalized
  );
  const deviceMatches = Boolean(appUser?.device_id && appUser.device_id === deviceId);
  const localUserMatches = Boolean(storedUserId && appUser?.id && storedUserId === appUser.id);
  const localNameMatches = Boolean(storedName && storedName === cleanNormalized);
  const appUserNameMatches = Boolean(appUser?.nome && normalizeAuthName(appUser.nome) === cleanNormalized);

  if (!profileNameMatches && !deviceMatches && !localUserMatches && !localNameMatches && !appUserNameMatches) {
    return {
      ok: false,
      message: "Não foi possível validar este usuário para redefinir o PIN. Confira o nome informado e tente novamente.",
    };
  }

  saveAppUserName(clean);
  if (appUser?.id) saveAppUserId(appUser.id);
  setStoredValue(APP_USER_REGISTERED_KEY, deviceId);

  const pinHash = await hashUserPin(clean, safePin);
  const payload = {
    data: {
      ...(profile.data || {}),
      authProfile: true,
      name: clean,
      pinHash,
      pinVersion: "sha256-v1",
      resetAt: new Date().toISOString(),
      resetDeviceId: deviceId,
    },
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${encodeURIComponent(profile.id)}`, {
    method: "PATCH",
    headers: supabaseHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Não foi possível redefinir o PIN (${res.status}) ${detail}`.trim());
  }

  const data = await res.json().catch(() => []);
  markPinSessionVerified(clean);
  return { ok: true, profile: Array.isArray(data) ? data[0] : data };
}

async function verifyOrCreateUserPin(name, pin, pinConfirm = "") {
  const clean = String(name || "").trim();
  const safePin = normalizePin(pin);
  const safeConfirm = normalizePin(pinConfirm);

  if (!clean) return { ok: false, message: "Informe seu nome para continuar." };
  if (!isValidPin(safePin)) return { ok: false, message: "Informe um PIN de 4 a 6 dígitos." };

  const existing = await findUserAuthProfile(clean);
  const hash = await hashUserPin(clean, safePin);

  if (existing?.data?.pinHash) {
    if (existing.data.pinHash !== hash) {
      return { ok: false, message: "PIN incorreto para este usuário." };
    }
    return { ok: true, mode: "login", profile: existing };
  }

  if (!safeConfirm) {
    return { ok: false, message: "Primeiro acesso: confirme o PIN para criar seu cadastro." };
  }
  if (safePin !== safeConfirm) {
    return { ok: false, message: "Os PINs informados não conferem." };
  }

  const created = await createUserAuthProfile(clean, hash);
  return { ok: true, mode: "created", profile: created };
}


async function appendSharedListEvent(id, event = {}) {
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
      actorName: event.actorName || getAppUserName() || "",
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

function getNotificationStorageKey() {
  const name = normalizeCacheKey(getAppUserName() || "anon");
  return `tnl_internal_notifications:${name || "anon"}`;
}

function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(getNotificationStorageKey()) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredNotifications(items) {
  try {
    localStorage.setItem(getNotificationStorageKey(), JSON.stringify(Array.isArray(items) ? items.slice(0, 80) : []));
  } catch {}
}

function eventToNotification(event) {
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


function buildSharedListEvent(sharedId, list, { type, actorName, targetName, message }) {
  const cleanActor = String(actorName || getAppUserName() || "Usuário").trim();
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

function addLocalSharedEventToList(list, event) {
  if (!list || !event?.id) return list;
  const current = Array.isArray(list.sharedEvents) ? list.sharedEvents : [];
  if (current.some((item) => item?.id === event.id)) return list;
  return {
    ...list,
    sharedEvents: [event, ...current].slice(0, 80),
    lastEventAt: event.createdAt || new Date().toISOString(),
  };
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

function extractJsonObject(text) {
  const raw = String(text || "").trim().replace(/```json|```/g, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON não encontrado na resposta da IA");
  return JSON.parse(match[0]);
}

async function callAnthropicJSON({ prompt, system, maxTokens = 800, model }) {
  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system, maxTokens, model }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Erro na função /api/anthropic HTTP ${res.status}${errorText ? ` - ${errorText.slice(0, 180)}` : ""}`);
  }

  const data = await res.json();
  if (data?.json && typeof data.json === "object") return data.json;
  return extractJsonObject(data?.text || "");
}

async function transcribeVoiceAudio(file) {
  if (!file) throw new Error("Áudio não informado.");

  // Envio binário direto. Isso evita falhas de multipart/form-data no Vercel/iPhone.
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: {
      "Content-Type": file.type || "audio/webm",
      "X-Audio-Filename": encodeURIComponent(file.name || "lista-voz.webm"),
      "X-Audio-Language": "pt",
    },
    body: file,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.details?.error?.message || `Erro ao transcrever áudio (${res.status})`);
  }

  return String(data?.text || "").trim();
}


// ── CACHE LOCAL DE CLASSIFICAÇÃO ───────────────────────────────────────────
// Evita repetir chamadas à IA para produtos já classificados neste navegador.
const PRODUCT_CLASSIFICATION_CACHE_VERSION = "v1";
const PRODUCT_CLASSIFICATION_CACHE_PREFIX = `ta-na-lista:product-classification:${PRODUCT_CLASSIFICATION_CACHE_VERSION}:`;

function normalizeCacheKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getProductClassificationCache(name) {
  try {
    const key = normalizeCacheKey(name);
    if (!key || typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(PRODUCT_CLASSIFICATION_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      marcas: Array.isArray(parsed.marcas) ? parsed.marcas : [],
      tipos: Array.isArray(parsed.tipos) ? parsed.tipos : [],
      pesos: Array.isArray(parsed.pesos) ? parsed.pesos : [],
      volumes: Array.isArray(parsed.volumes) ? parsed.volumes : [],
      unidades: Array.isArray(parsed.unidades) && parsed.unidades.length ? parsed.unidades : ["unidade", "pacote", "kg"],
    };
  } catch {
    return null;
  }
}

function setProductClassificationCache(name, cfg) {
  try {
    const key = normalizeCacheKey(name);
    if (!key || typeof window === "undefined" || !window.localStorage) return;
    const safe = {
      marcas: Array.isArray(cfg?.marcas) ? cfg.marcas.slice(0, 12) : [],
      tipos: Array.isArray(cfg?.tipos) ? cfg.tipos.slice(0, 12) : [],
      pesos: Array.isArray(cfg?.pesos) ? cfg.pesos.slice(0, 12) : [],
      volumes: Array.isArray(cfg?.volumes) ? cfg.volumes.slice(0, 12) : [],
      unidades: Array.isArray(cfg?.unidades) && cfg.unidades.length ? cfg.unidades.slice(0, 12) : ["unidade", "pacote", "kg"],
      cachedAt: Date.now(),
    };
    window.localStorage.setItem(PRODUCT_CLASSIFICATION_CACHE_PREFIX + key, JSON.stringify(safe));
  } catch {
    // Se o armazenamento estiver cheio/bloqueado, apenas segue sem cache.
  }
}

async function classifyProduct(name) {
  // Primeiro tenta a base local. Ela já cobre os itens mais comuns e evita falha/custo de IA.
  const localCfg = getProductConfig(name);
  const hasLocalDetails =
    (Array.isArray(localCfg.marcas) && localCfg.marcas.length > 0) ||
    (Array.isArray(localCfg.tipos) && localCfg.tipos.length > 0) ||
    (Array.isArray(localCfg.pesos) && localCfg.pesos.length > 0) ||
    (Array.isArray(localCfg.volumes) && localCfg.volumes.length > 0);

  if (hasLocalDetails) {
    return localCfg;
  }

  const cachedCfg = getProductClassificationCache(name);
  if (cachedCfg) {
    return cachedCfg;
  }

  const prompt = [
    "Você é especialista em supermercados brasileiros, como Atacadão, Carrefour e Assaí.",
    "Classifique o produto para lista de compras: " + name,
    "",
    "Retorne APENAS JSON válido, sem markdown, sem explicação e sem texto antes ou depois:",
    '{"marcas":["Marca1","Marca2"],"tipos":["Tipo1","Tipo2"],"pesos":["500g","1kg"],"volumes":["500ml","1L"],"unidades":["unidade","pacote","kg"]}',
    "",
    "Regras:",
    "- marcas: 4 a 8 marcas brasileiras comuns;",
    "- tipos: 3 a 7 variações comuns;",
    "- pesos: tamanhos em g/kg se for sólido, senão [];",
    "- volumes: tamanhos em ml/L se for líquido, senão [];",
    "- unidades: formas de contagem, como pacote, kg, fardo, lata, garrafa e unidade.",
  ].join("\n");

  try {
    const p = await callAnthropicJSON({
      prompt,
      model: ANTHROPIC_MODEL_CLASSIFY,
      maxTokens: 600,
    });

    const cfg = {
      marcas: Array.isArray(p.marcas) ? p.marcas : [],
      tipos: Array.isArray(p.tipos) ? p.tipos : [],
      pesos: Array.isArray(p.pesos) ? p.pesos : [],
      volumes: Array.isArray(p.volumes) ? p.volumes : [],
      unidades: Array.isArray(p.unidades) && p.unidades.length ? p.unidades : ["unidade", "pacote", "kg"],
    };

    setProductClassificationCache(name, cfg);
    return cfg;
  } catch (err) {
    console.warn("Classificação por IA indisponível; usando base local.", err);
    return localCfg;
  }
}


// ── PALETA DE CORES POR CATEGORIA ─────────────────────────────────────────
// Cores alinhadas às categorias do Atacadão (atacadao.com.br)
const CAT_THEME = {
  // ── ALIMENTAÇÃO ──────────────────────────────────────────────────
  "Hortifruti":              { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"🥬" },
  "Carnes e Aves":           { bg:"#FCE4EC", border:"#C62828", header:"#B71C1C", icon:"🥩" },
  "Frios e Laticínios":      { bg:"#E3F2FD", border:"#1565C0", header:"#0D47A1", icon:"🧀" },
  "Frios e Embutidos":       { bg:"#E8EAF6", border:"#4527A0", header:"#311B92", icon:"🍖" },
  "Laticínios":              { bg:"#E3F2FD", border:"#1565C0", header:"#0D47A1", icon:"🥛" },
  "Mercearia":               { bg:"#F3E5F5", border:"#6A1B9A", header:"#4A148C", icon:"🛒" },
  "Congelados":              { bg:"#E0F2F1", border:"#00695C", header:"#004D40", icon:"🧊" },
  // ── PADARIA E MATINAIS ───────────────────────────────────────────
  "Padaria e Matinais":      { bg:"#FFF8E1", border:"#E65100", header:"#BF360C", icon:"🍞" },
  "Padaria e Cereais":       { bg:"#FFF8E1", border:"#E65100", header:"#BF360C", icon:"🍞" },
  "Cafés e Chás":            { bg:"#EFEBE9", border:"#4E342E", header:"#3E2723", icon:"☕" },
  // ── BEBIDAS ──────────────────────────────────────────────────────
  "Bebidas":                 { bg:"#E1F5FE", border:"#0277BD", header:"#01579B", icon:"🥤" },
  "Cervejas":                { bg:"#FFF8E1", border:"#F57F17", header:"#E65100", icon:"🍺" },
  "Bebidas Alcoólicas":      { bg:"#FFF8E1", border:"#F57F17", header:"#E65100", icon:"🍺" },
  "Vinhos e Destilados":     { bg:"#F3E5F5", border:"#6A1B9A", header:"#4A148C", icon:"🍷" },
  // ── LIMPEZA ──────────────────────────────────────────────────────
  "Limpeza":                 { bg:"#E1F5FE", border:"#0277BD", header:"#01579B", icon:"🧹" },
  // ── HIGIENE ──────────────────────────────────────────────────────
  "Higiene e Perfumaria":    { bg:"#FCE4EC", border:"#AD1457", header:"#880E4F", icon:"🪥" },
  "Higiene e Beleza":        { bg:"#FCE4EC", border:"#AD1457", header:"#880E4F", icon:"🪥" },
  "Bebês":                   { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"👶" },
  // ── DESCARTÁVEIS ─────────────────────────────────────────────────
  "Descartáveis e Embalagens":{ bg:"#ECEFF1", border:"#455A64", header:"#263238", icon:"🥡" },
  "Descartáveis":            { bg:"#ECEFF1", border:"#455A64", header:"#263238", icon:"🥡" },
  // ── SNACKS ───────────────────────────────────────────────────────
  "Snacks e Doces":          { bg:"#FBE9E7", border:"#BF360C", header:"#870000", icon:"🍫" },
  "Snacks":                  { bg:"#FBE9E7", border:"#BF360C", header:"#870000", icon:"🍪" },
  "Chocolates e Doces":      { bg:"#FBE9E7", border:"#BF360C", header:"#870000", icon:"🍫" },
  // ── TEMPEROS ─────────────────────────────────────────────────────
  "Temperos e Condimentos":  { bg:"#FFF3E0", border:"#E65100", header:"#BF360C", icon:"🧂" },
  "Temperos":                { bg:"#FFF3E0", border:"#E65100", header:"#BF360C", icon:"🧂" },
  // ── CONSTRUÇÃO / ELÉTRICO ────────────────────────────────────────
  "Hidráulica":              { bg:"#E0F7FA", border:"#006064", header:"#004D40", icon:"🚿" },
  "Elétrica":                { bg:"#FFFDE7", border:"#F57F17", header:"#E65100", icon:"⚡" },
  "Ferragens":               { bg:"#EFEBE9", border:"#3E2723", header:"#1B0000", icon:"🔩" },
  "Ferramentas":             { bg:"#F5F5F5", border:"#424242", header:"#212121", icon:"🔧" },
  "Iluminação":              { bg:"#FFFDE7", border:"#F9A825", header:"#F57F17", icon:"💡" },
  "Acabamento":              { bg:"#EDE7F6", border:"#4527A0", header:"#311B92", icon:"🖌️" },
  // ── OUTROS ───────────────────────────────────────────────────────
  "Medicamentos":            { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"💊" },
  "Jardim":                  { bg:"#F1F8E9", border:"#558B2F", header:"#33691E", icon:"🌿" },
  "Cadernos":                { bg:"#E3F2FD", border:"#1565C0", header:"#0D47A1", icon:"📓" },
  "Material de Escrita":     { bg:"#E8F5E9", border:"#2E7D32", header:"#1B5E20", icon:"✏️" },
  "Arte":                    { bg:"#FCE4EC", border:"#AD1457", header:"#880E4F", icon:"🎨" },
  "Utilidades Domésticas":   { bg:"#F3E5F5", border:"#6A1B9A", header:"#4A148C", icon:"🏠" },
  "Itens Extras":            { bg:"#FFF3E0", border:"#E64A19", header:"#BF360C", icon:"⭐" },
  "Outros":                  { bg:"#FAFAFA", border:"#757575", header:"#424242", icon:"📦" },
};

function getCatTheme(name) {
  return CAT_THEME[name] || { bg:"#FAFAFA", border:"#BDBDBD", header:"#424242", icon:"📦" };
}

function hexToRgba(hex, alpha = 1) {
  try {
    const clean = String(hex || "").replace("#", "");
    const value = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
    const num = parseInt(value, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(17,24,39,${alpha})`;
  }
}

function getPremiumSectionStyle(theme, { isExtraCat = false, allDone = false } = {}) {
  const border = isExtraCat ? "#F97316" : allDone ? "#22C55E" : theme.border;
  return {
    marginBottom: 18,
    borderRadius: 22,
    overflow: "hidden",
    border: `1.5px solid ${hexToRgba(border, 0.58)}`,
    background: "rgba(255,255,255,0.96)",
    boxShadow: `0 18px 42px ${hexToRgba(border, 0.12)}, 0 2px 8px rgba(15,23,42,0.05)`,
    transition: "border-color 0.25s, box-shadow 0.25s, transform 0.18s",
  };
}

function getPremiumSectionHeaderStyle(theme, { isExtraCat = false, allDone = false, isCollapsed = false } = {}) {
  const base = isExtraCat ? "#F97316" : allDone ? "#22C55E" : theme.border;
  return {
    background: `linear-gradient(135deg, ${hexToRgba(base, 0.14)}, ${hexToRgba(base, 0.055)})`,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
    borderBottom: isCollapsed ? "none" : `1px solid ${hexToRgba(base, 0.18)}`,
  };
}

function AppLogo({ size = 48, radius = 16, shadow = true }) {
  return (
    <img
      src="/icon-192.png"
      alt="Tá na Lista"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        display: "block",
        boxShadow: shadow ? "0 14px 30px rgba(109,40,217,0.24)" : "none",
        border: "1px solid rgba(255,255,255,0.28)",
      }}
    />
  );
}

function BrandWordmark({ compact = false, color = "#111827" }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:compact?8:12,justifyContent:"center"}}>
      <AppLogo size={compact?42:64} radius={compact?14:20} />
      <div style={{fontWeight:900,fontSize:compact?22:"clamp(28px, 9vw, 34px)",color,letterSpacing:"-1px",lineHeight:1,whiteSpace:"nowrap"}}>Tá na Lista</div>
    </div>
  );
}

function ModuleIcon({ type="compras", size=72, active=false }) {
  const iconMap = {
    compras: "/compras.svg",
    festa: "/festa.svg",
    conta: "/conta.svg",
    saude: "/saude.svg",
    eventos: "/eventos.svg",
    condominio: "/condominio.svg",
  };

  const fallbackMap = {
    compras: "🛒",
    festa: "🎉",
    conta: "💳",
    saude: "💊",
    eventos: "🎟️",
    condominio: "🏢",
  };

  const src = iconMap[type] || iconMap.compras;
  const fallback = fallbackMap[type] || "•";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt={type}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          borderRadius: Math.round(size * 0.24),
          boxShadow: active
            ? "0 18px 34px rgba(109,40,217,0.28)"
            : "0 14px 26px rgba(109,40,217,0.18)",
        }}
        onError={(e)=>{
          e.currentTarget.style.display="none";
          const fallbackNode = e.currentTarget.nextSibling;
          if (fallbackNode) fallbackNode.style.display="flex";
        }}
      />
      <span
        style={{
          display:"none",
          width:size,
          height:size,
          borderRadius:Math.round(size*0.24),
          alignItems:"center",
          justifyContent:"center",
          color:"#FFFFFF",
          fontSize:Math.round(size*0.44),
          fontWeight:900,
          background:"linear-gradient(135deg,#4C1D95,#7C3AED)",
          boxShadow:active?"0 18px 34px rgba(109,40,217,0.28)":"0 14px 26px rgba(109,40,217,0.18)",
        }}
      >
        {fallback}
      </span>
    </div>
  );
}

function WhatsAppIcon({ size = 20 }) {
  // Ícone do WhatsApp no padrão visual reconhecido: círculo verde, balão e telefone brancos.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle" }}
    >
      <circle cx="16" cy="16" r="15.5" fill="#25D366" />
      <path
        fill="#FFFFFF"
        d="M16.02 6.4c-5.32 0-9.64 4.31-9.64 9.62 0 1.7.45 3.36 1.3 4.82L6.3 25.9l5.17-1.35a9.6 9.6 0 0 0 4.55 1.16h.01c5.31 0 9.63-4.31 9.63-9.62S21.34 6.4 16.02 6.4Zm0 17.68h-.01a7.99 7.99 0 0 1-4.06-1.11l-.29-.17-3.07.8.82-2.99-.19-.31a7.96 7.96 0 0 1-1.22-4.27c0-4.42 3.6-8.01 8.03-8.01a7.98 7.98 0 0 1 5.68 2.35 7.97 7.97 0 0 1 2.35 5.67c0 4.43-3.6 8.04-8.04 8.04Z"
      />
      <path
        fill="#FFFFFF"
        d="M20.42 17.93c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.18-.71-.64-1.19-1.42-1.33-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}

function getListOriginMeta(list) {
  if (!list) return null;
  const currentName = getAppUserName();
  const normalizedCurrent = normalizeAuthName(currentName || "");
  const owner = list.ownerName || list.remetente || currentName;
  const normalizedOwner = normalizeAuthName(owner || "");
  const from = list.importedFrom || list.sharedOwner || list.remetente || list.ownerName || "não informado";
  const normalizedFrom = normalizeAuthName(from || "");

  // Lista recebida só deve aparecer como recebida quando veio de outra pessoa.
  // Listas próprias sincronizadas na nuvem também têm sharedId, mas isso não significa
  // que foram compartilhadas nem recebidas.
  const receivedFromAnotherUser = Boolean(list.imported === true || list.receivedAt || list.importedAt)
    && Boolean(normalizedFrom)
    && (!normalizedCurrent || normalizedFrom !== normalizedCurrent);

  if (receivedFromAnotherUser) {
    return { type:"received", icon:"📥", text:"Recebida de " + from };
  }

  if (owner) {
    return { type:"created", icon:"✍️", text: normalizedCurrent && normalizedOwner === normalizedCurrent ? "Criada por você" : "Feita por " + owner };
  }
  return null;
}

const LIST_TYPES = [
  {id:"mercado",   label:"🛒 Supermercado"},
  {id:"festa",     label:"🎉 Eventos"},
  {id:"construcao",label:"🏗️ Construção"},
  {id:"eletrico",  label:"⚡ Elétrico"},
  {id:"escolar",   label:"🏫 Escolar"},
  {id:"farmacia",  label:"💊 Farmácia"},
  {id:"condominio",label:"🏢 Condomínio"},
  {id:"outros",    label:"📦 Outras"},
];

const TYPE_NAMES = {
  mercado:"supermercado", festa:"eventos", construcao:"construção",
  eletrico:"material elétrico", escolar:"material escolar",
  farmacia:"farmácia", condominio:"condomínio", outros:"geral",
};


// ══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO COMPLETA DE PRODUTOS — BASEADA NO ATACADÃO (atacadao.com.br)
// ══════════════════════════════════════════════════════════════════════════
// Departamentos: Mercearia · Bebidas · Cervejas · Cafés/Chás/Achocolatados
// Padaria e Matinais · Limpeza · Higiene e Perfumaria · Bebês
// Frios e Laticínios · Carnes e Aves · Hortifrúti · Congelados
// Descartáveis e Embalagens · Utilidades Domésticas
//
// Cada entrada: { marcas[], tipos[], pesos[], volumes[], unidades[] }
// marcas  = principais marcas do Atacadão para o produto
// tipos   = variações / sabores / versões do produto
// pesos   = tamanhos em gramas/kg (produtos sólidos — embalagem pacote/saco/lata)
// volumes = tamanhos em ml/L (produtos líquidos — garrafa/frasco/caixinha)
// unidades= como o produto é contado na compra
function getProductConfig(name) {
  const n = name.toLowerCase().trim();

  // ════════════════════════════════════════════════════
  // MERCEARIA — Grãos e Cereais
  // ════════════════════════════════════════════════════

  if (/\barroz\b/.test(n))
    return {
      marcas:["Tio João","Camil","Prato Fino","Namorado","Urbano","Broto Legal"],
      tipos:["Branco Tipo 1 (Agulhinha)","Integral","Parboilizado","Parboilizado Integral","Arbóreo (risoto)"],
      pesos:["1kg","2kg","5kg","10kg"],
      unidades:["pacote","saco","fardo 10kg"]
    };

  if (/\bfeijão\b/.test(n))
    return {
      marcas:["Camil","Tio João","Kicaldo","Leco","Broto Legal"],
      tipos:["Carioca Tipo 1","Preto Tipo 1","Branco","Fradinho","Jalo","Bolinha"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","saco"]
    };

  if (/macarrão|massa/.test(n))
    return {
      marcas:["Renata","Divella","Barilla","De Cecco","Santa Amália","Petybon"],
      tipos:["Espaguete","Parafuso","Penne","Talharim","Fusilli","Lasanha","Ave-maria","Farfalle","Conchiglie"],
      pesos:["500g","1kg"],
      unidades:["pacote","caixa"]
    };

  if (/\baçúcar\b/.test(n))
    return {
      marcas:["União","Da Barra","Guarani","Refinações de Milho","Dobradinha"],
      tipos:["Refinado","Cristal","Demerara","Mascavo","Light","Confeiteiro"],
      pesos:["1kg","2kg","5kg"],
      unidades:["pacote","saco","fardo 10kg"]
    };

  if (/farinha de trigo|farinha trigo/.test(n))
    return {
      marcas:["Renata","Dona Benta","Anaconda","Orquídea","Santa Amália"],
      tipos:["Tradicional","Integral","Com fermento","Sem fermento","Especial"],
      pesos:["1kg","2kg","5kg"],
      unidades:["pacote","saco"]
    };

  if (/\bfarinha\b/.test(n))
    return {
      marcas:["Yoki","Kimura","Broto Legal","Camil"],
      tipos:["Trigo","Mandioca crua","Mandioca torrada","Milho","Fubá","Rosca","Tempero"],
      pesos:["500g","1kg","2kg","5kg"],
      unidades:["pacote","saco"]
    };

  if (/\bsal\b(?! de frutas| grosso para churrasco)/.test(n))
    return {
      marcas:["Cisne","Lebre","Mariner","Salina","Refinosal"],
      tipos:["Refinado iodado","Grosso","Marinho","Light (cloreto de potássio)"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","caixa"]
    };

  if (/\bazeite\b/.test(n))
    return {
      marcas:["Gallo","Andorinha","Carbonell","Borges","La Española","Coppini","Português","Tipo Único"],
      tipos:["Extra virgem","Virgem","Composto","Tempero (alho/ervas)"],
      volumes:["250ml","500ml","750ml","1L"],
      unidades:["garrafa","lata","unidade"]
    };

  if (/\bóleo\b/.test(n))
    return {
      marcas:["Soya","Liza","Salada","Vivo","Cocinero","Bunge Pro"],
      tipos:["Soja","Girassol","Canola","Milho","Algodão","Composto"],
      volumes:["500ml","900ml","1,5L","2L"],
      unidades:["garrafa","unidade","fardo 6"]
    };

  if (/\bvinagre\b/.test(n))
    return {
      marcas:["Heinz","Castelo","Minhoto","Real","Companhia das Ervas"],
      tipos:["Álcool","Maçã","Vinho branco","Vinho tinto","Balsâmico"],
      volumes:["500ml","750ml","1L"],
      unidades:["garrafa","unidade","fardo 12"]
    };

  if (/maionese/.test(n))
    return {
      marcas:["Hellmann's","Heinz","Quero","Sura","Mosteiro","Arisco"],
      tipos:["Tradicional","Light","Azeite","Temperada","Zero"],
      pesos:["200g","250g","390g","500g","1kg"],
      unidades:["pote","sachê","unidade","balde"]
    };

  if (/ketchup/.test(n))
    return {
      marcas:["Heinz","Quero","Hellmann's","Arisco","Hunt's"],
      tipos:["Tradicional","Picante","Light","Zero"],
      pesos:["200g","300g","390g","1kg"],
      unidades:["pote","sachê","unidade"]
    };

  if (/mostarda/.test(n))
    return {
      marcas:["Hellmann's","Heinz","Quero","Arisco","L'ancienne"],
      tipos:["Tradicional","Dijon","Grainy","Mel","Picante"],
      pesos:["200g","250g","380g"],
      unidades:["pote","sachê","unidade"]
    };

  if (/molho de tomate|extrato de tomate|polpa de tomate/.test(n))
    return {
      marcas:["Quero","Pomarola","Heinz","Peixe","Fugini","Cica","Carrefour"],
      tipos:["Molho tradicional","Molho temperado","Molho com manjericão","Molho com azeitona","Extrato","Polpa","Pelado"],
      pesos:["190g","200g","300g","340g","520g","1kg"],
      unidades:["caixinha","lata","sachê","unidade"]
    };

  if (/\batum\b/.test(n))
    return {
      marcas:["Gomes da Costa","Coqueiro","Italmar","Pescador","Frescatto","Rio de Una"],
      tipos:["Em água","Em óleo","Com limão","Light","Defumado","Pedaço","Sólido"],
      pesos:["170g","300g"],
      unidades:["lata","caixa 3","caixa 12","unidade"]
    };

  if (/\bsardinha\b/.test(n))
    return {
      marcas:["Gomes da Costa","Coqueiro","Bom Porto","Real","Frutos do Mar"],
      tipos:["Em óleo","Em molho de tomate","Defumada","Temperada","Com limão"],
      pesos:["125g","250g"],
      unidades:["lata","caixa 3","caixa 12","unidade"]
    };

  if (/milho verde|milho em lata/.test(n))
    return {
      marcas:["Quero","Bonduelle","Predilecta","Fugini","Cica","Green Giant"],
      tipos:["Em conserva","Cremoso","Orgânico"],
      pesos:["170g","200g","300g"],
      unidades:["lata","caixa 12","unidade"]
    };

  if (/ervilha/.test(n))
    return {
      marcas:["Quero","Bonduelle","Predilecta","Fugini","Cica"],
      tipos:["Em conserva","Partida seca","Extra-fina"],
      pesos:["170g","200g","300g"],
      unidades:["lata","caixa 12","unidade"]
    };

  if (/\baveia\b/.test(n))
    return {
      marcas:["Quaker","Yoki","Native","Jasmine","Dr. Oetker"],
      tipos:["Flocos finos","Flocos grossos","Farelo","Em grão","Crunch"],
      pesos:["250g","500g","1kg"],
      unidades:["pacote","lata","caixa"]
    };

  if (/linhaça|chia|quinoa|gergelim|amaranto/.test(n))
    return {
      marcas:["Yoki","Native","Jasmine","Vitalin","Foods","Sítio Capuava"],
      tipos:["Dourada","Marrom","Triturada","Orgânica"],
      pesos:["200g","500g","1kg"],
      unidades:["pacote"]
    };

  if (/\bfubá\b|\bpolenta\b/.test(n))
    return {
      marcas:["Yoki","Kimura","Broto Legal","Camil","Canguru"],
      tipos:["Mimoso","Grosso","Creme de milho","Pré-cozido","Temperado"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","saco"]
    };

  if (/tempero|caldo knorr|maggi|sazon|arisco/.test(n))
    return {
      marcas:["Knorr","Maggi","Sazon","Arisco","Fondor","Ajinomoto"],
      tipos:["Caldo de carne","Caldo de frango","Caldo de legumes","Tempero baiano","Alho e sal","Completo","Colorau"],
      pesos:["50g","57g","100g","200g","300g"],
      unidades:["caixa","pacote","unidade","tubo"]
    };

  if (/\bcolorau\b|\bpáprica\b/.test(n))
    return {
      marcas:["Arisco","Kitano","Yoki","Alimba"],
      tipos:["Colorau","Páprica doce","Páprica picante","Páprica defumada"],
      pesos:["60g","100g","200g"],
      unidades:["unidade","pacote"]
    };

  if (/doce de leite/.test(n))
    return {
      marcas:["Italac","Quatá","Mococa","Leite Moça","Aviação"],
      tipos:["Cremoso","Em tablete","Light"],
      pesos:["200g","400g","500g","1kg"],
      unidades:["pote","lata","unidade"]
    };

  if (/leite condensado/.test(n))
    return {
      marcas:["Moça","Piracanjuba","Italac","Ninho","Elegê"],
      tipos:["Tradicional","Light","Zero lactose"],
      pesos:["395g","397g"],
      unidades:["lata","caixinha","unidade","fardo 12"]
    };

  if (/creme de leite/.test(n))
    return {
      marcas:["Nestlé","Parmalat","Italac","Quatá","Elegê","Vigor"],
      tipos:["Caixinha","Lata","Fresco UHT","Culinário"],
      pesos:["200g","300g"],
      unidades:["caixinha","lata","unidade","fardo 12"]
    };

  if (/biscoito|bolacha/.test(n))
    return {
      marcas:["Oreo","Recheio","Trakinas","Wafer Bauducco","Cream Cracker Nestlé","Maria Nestlé","Maizena","Triunfo","Marilan","Adria"],
      tipos:["Recheado chocolate","Recheado morango","Recheado baunilha","Cream cracker","Água e sal","Maria","Maizena","Integral","Wafer","Amanteigado","Rosquinha"],
      pesos:["100g","130g","200g","300g","375g","400g","500g"],
      unidades:["pacote","caixa","fardo"]
    };

  if (/cereal matinal|granola|sucrilhos|corn flakes/.test(n))
    return {
      marcas:["Kellogg's","Nestlé","Quaker","Native","Jasmine","Nutri Free"],
      tipos:["Corn Flakes","Sucrilhos","Granola com mel","Granola com frutas","Aveia granola","Musli","Integral"],
      pesos:["200g","250g","300g","500g","1kg"],
      unidades:["caixa","pacote","lata"]
    };

  if (/chocolate em pó|achocolatado em pó|nescau|toddy|milo/.test(n))
    return {
      marcas:["Nescau","Toddy","Milo","Ovomaltine","Forno de Minas","Cacau Show"],
      tipos:["Tradicional","50% cacau","Zero açúcar","Diet","Com vitaminas"],
      pesos:["200g","400g","800g","1kg"],
      unidades:["lata","pacote","caixa"]
    };

  if (/\bchocolate\b/.test(n))
    return {
      marcas:["Nestlé","Lacta","Harald","Garoto","Hershey's","Cacau Show","Lindt","Melken"],
      tipos:["Ao leite","Meio amargo","Branco","70% cacau","Com castanhas","Com amendoim","Trufado"],
      pesos:["25g","80g","90g","150g","200g","400g"],
      unidades:["unidade","tablete","caixa","pacote"]
    };

  if (/salgadinho|batata chips|doritos|ruffles|fandangos|cheetos/.test(n))
    return {
      marcas:["Elma Chips","Doritos","Ruffles","Cheetos","Fandangos","Lays","Pringles","Torcida"],
      tipos:["Batata original","Batata cheddar","Milho","Trigo","Amendoim crocante","Mix de salgados"],
      pesos:["45g","55g","100g","120g","167g","200g","300g"],
      unidades:["pacote","lata","caixa"]
    };

  if (/\bpipoca\b/.test(n))
    return {
      marcas:["Yoki","Pop Weaver","Cinépolis","Sinhá"],
      tipos:["Manteiga","Sal","Caramelo","Natural","Micro-ondas","Canjiquinha"],
      pesos:["50g","100g","200g","400g"],
      unidades:["pacote","caixa"]
    };

  // ════════════════════════════════════════════════════
  // CAFÉS, CHÁS E ACHOCOLATADOS
  // ════════════════════════════════════════════════════

  if (/\bcafé\b/.test(n))
    return {
      marcas:["Pilão","Melitta","3 Corações","Café do Ponto","Nespresso","Nescafé","Illy","Santa Clara","Dois Frades","Pelé"],
      tipos:["Torrado e moído tradicional","Extra forte","Suave","Gourmet premium","Solúvel","Cápsulas Nespresso","Cápsulas Dolce Gusto","Cappuccino","Filtro de papel"],
      pesos:["250g","500g","1kg"],
      unidades:["pacote","lata","caixa","cápsula 10un","cápsula 50un"]
    };

  if (/\bchá\b/.test(n))
    return {
      marcas:["Leão","Matte Leão","Lipton","Camomila Fazendinha","Twinings","Dr. Oetker"],
      tipos:["Verde","Preto","Camomila","Erva-doce","Hortelã","Hibisco","Mate","Cidreira","Boldo","Misto frutas"],
      pesos:["10 sachês","15 sachês","20 sachês","25 sachês","50 sachês"],
      unidades:["caixa","pacote"]
    };

  if (/achocolatado líquido|bebida láctea achocolatada/.test(n))
    return {
      marcas:["Toddynho","Nescau","Ninho","Nestlé","Batavo","Parmalat"],
      tipos:["Chocolate","Baunilha","Morango","Zero açúcar"],
      volumes:["200ml","1L"],
      unidades:["unidade","caixinha","fardo 6","caixa 12","caixa 27"]
    };

  // ════════════════════════════════════════════════════
  // PADARIA E MATINAIS — Leites, Pães, Cereais
  // ════════════════════════════════════════════════════

  if (/\bleite\b(?! condensado| de coco)/.test(n))
    return {
      marcas:["Piracanjuba","Italac","Nestlé Ninho","Parmalat","Elegê","Betânia","Vigor","Camponesa"],
      tipos:["Integral","Semidesnatado","Desnatado","Zero lactose","Orgânico","Com ferro e vitaminas"],
      volumes:["1L","500ml"],
      unidades:["caixinha","unidade","fardo 6","caixa 12"]
    };

  if (/pão de forma|pão pullman/.test(n))
    return {
      marcas:["Seven Boys","Wickbold","Plus Vita","Pullman","Bauducco","Ana Maria","Pão de Açúcar"],
      tipos:["Tradicional","Integral","Light","Multigrãos","Sem glúten","Hot dog","Hambúrguer"],
      pesos:["350g","400g","500g","600g","750g"],
      unidades:["pacote","unidade"]
    };

  if (/\bpão\b/.test(n))
    return {
      marcas:["Bauduco","Seven Boys","Pullman","Wickbold","Ana Maria"],
      tipos:["Francês","Bisnaguinha","Hot dog","Hambúrguer","Sírio","Ciabatta","Integral","Brioche"],
      pesos:[],
      unidades:["unidade","pacote","kg","dúzia"]
    };

  if (/iogurte/.test(n))
    return {
      marcas:["Nestlé","Danone","Itambé","Piracanjuba","Vigor","Batavo","Activia","YoPro"],
      tipos:["Natural integral","Natural desnatado","Grego","Morango","Baunilha","Manga","Limão","Blueberry","Zero açúcar","Proteico"],
      pesos:["90g","160g","170g","500g","1kg"],
      unidades:["unidade","pote","bandeja 4","bandeja 6","pacote"]
    };

  // ════════════════════════════════════════════════════
  // FRIOS E LATICÍNIOS
  // ════════════════════════════════════════════════════

  if (/\bqueijo\b/.test(n))
    return {
      marcas:["Forno de Minas","Tirolez","Quatá","Presidente","Polenghi","Vigor","Kraft","BOM"],
      tipos:["Mussarela","Prato","Parmesão ralado","Coalho","Cottage","Ricota","Brie","Provolone","Gouda","Burguer"],
      pesos:["150g","200g","400g","500g","1kg"],
      unidades:["pacote","peça","pote","unidade"]
    };

  if (/manteiga/.test(n))
    return {
      marcas:["Aviação","Tirolez","Vigor","Itambé","Président","Reny Picot","Nestlé"],
      tipos:["Com sal","Sem sal","Extra cremosa","Ghee clarificada"],
      pesos:["200g","500g"],
      unidades:["tablete","pote","unidade"]
    };

  if (/margarina/.test(n))
    return {
      marcas:["Qualy","Becel","Delícia","Doriana","Primor","Vigor","Claybon"],
      tipos:["Com sal","Sem sal","Light","Culinária","Com vitaminas"],
      pesos:["250g","500g","1kg"],
      unidades:["pote","unidade"]
    };

  if (/requeijão/.test(n))
    return {
      marcas:["Catupiry","Vigor","Itambé","Nestlé","Tirolez","Polenghi","Forno de Minas"],
      tipos:["Cremoso tradicional","Light","Zero lactose","Copo","Bisnaga"],
      pesos:["150g","200g","250g","500g"],
      unidades:["pote","copo","bisnaga","unidade"]
    };

  if (/presunto/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Friboi","Rezende"],
      tipos:["Fatiado cozido","Defumado fatiado","Light","Em peça","Tender"],
      pesos:["100g","150g","200g","300g","500g","1kg"],
      unidades:["pacote","bandeja","peça"]
    };

  if (/mortadela/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Rezende","Bordon"],
      tipos:["Tradicional fatiada","Bologna","Light","Com azeitona","Defumada","Temperada","Em peça"],
      pesos:["200g","300g","500g","1kg"],
      unidades:["pacote","bandeja","peça"]
    };

  if (/peito de peru/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Chester"],
      tipos:["Fatiado defumado","Grelhado fatiado","Light","Com ervas","Peru defumado"],
      pesos:["100g","150g","200g","300g","1kg"],
      unidades:["pacote","bandeja","peça"]
    };

  if (/salame/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Milano"],
      tipos:["Italiano fatiado","Milano","Pepperoni","Calabrês","Em peça"],
      pesos:["100g","150g","200g","500g"],
      unidades:["pacote","bandeja","peça"]
    };

  // ════════════════════════════════════════════════════
  // CARNES E AVES
  // ════════════════════════════════════════════════════

  if (/picanha/.test(n))
    return {
      marcas:["Friboi","Mafrig","Minerva","JBS","Marfrig","Swift"],
      tipos:["Bovina","Suína"],
      pesos:["500g","1kg","1,5kg","2kg"],
      unidades:["kg","bandeja","peça"]
    };

  if (/alcatra|fraldinha|contra.filé|filé mignon|maminha|coxão|patinho/.test(n))
    return {
      marcas:["Friboi","Swift","Seara Beef","JBS","Marfrig","Minerva"],
      tipos:["Bovino especial"],
      pesos:["500g","1kg","1,5kg","2kg"],
      unidades:["kg","bandeja"]
    };

  if (/acém|músculo|paleta|ossobuco|cupim/.test(n))
    return {
      marcas:["Friboi","Swift","Marfrig","JBS"],
      tipos:["Para guisado","Para caldo","Para assar"],
      pesos:["500g","1kg","2kg"],
      unidades:["kg","bandeja","pacote"]
    };

  if (/carne moída/.test(n))
    return {
      marcas:["Friboi","Swift","Seara Beef","JBS"],
      tipos:["Patinho","Acém","Contrafilé","Fraldinha","Músculo"],
      pesos:["500g","1kg"],
      unidades:["bandeja","kg"]
    };

  if (/costela/.test(n))
    return {
      marcas:["Friboi","Swift","Marfrig","Minerva","Resfriada"],
      tipos:["Minga","Janela","Ripa","Suína","Defumada"],
      pesos:["1kg","2kg","3kg","5kg"],
      unidades:["kg","bandeja","peça"]
    };

  if (/\bfrango\b/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Macedo","Copacol","Diplomata"],
      tipos:["Peito filé","Peito com osso","Coxa e sobrecoxa","Asa","Coxinha da asa","Frango inteiro","Filé temperado","Nuggets"],
      pesos:["500g","1kg","2kg"],
      unidades:["bandeja","kg","pacote"]
    };

  if (/\bpeixe\b/.test(n))
    return {
      marcas:["Pescador","Seara","Temperinha","Isabela","Frescatto"],
      tipos:["Tilápia filé","Salmão filé","Merluza filé","Saint Peter","Cação","Pescada amarela"],
      pesos:["300g","500g","1kg","2kg"],
      unidades:["kg","bandeja","pacote"]
    };

  if (/\bsalmão\b/.test(n))
    return {
      marcas:["Marine Harvest","Cermaq","Grieg","Frioribe"],
      tipos:["Filé com pele","Filé sem pele","Defumado","Grelhado","In natura"],
      pesos:["300g","500g","1kg"],
      unidades:["kg","bandeja","pacote"]
    };

  if (/linguiça|calabresa/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Bordon","Rezende"],
      tipos:["Calabresa defumada","Toscana","Frango","Mista","Fininha para churrasco","Meia cura"],
      pesos:["500g","1kg","2kg"],
      unidades:["pacote","bandeja","kg"]
    };

  if (/\bsalsicha\b/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Rezende","Bordon"],
      tipos:["Frankfurt","Frango","Vaca e porco","Cocktail","Defumada","Hot dog"],
      pesos:["500g","1kg"],
      unidades:["pacote","bandeja","caixa"]
    };

  if (/hambúrguer|burger/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","Friboi","Veggie"],
      tipos:["Bovino","Frango","Misto","Smash","Artesanal","Vegano","Blend"],
      pesos:["56g un","672g (12un)","1,2kg"],
      unidades:["unidade","pacote","caixa"]
    };

  // ════════════════════════════════════════════════════
  // HORTIFRÚTI
  // ════════════════════════════════════════════════════

  if (/\btomate\b(?! de árvore| pelado| extrato| molho| cereja)/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Caqui","Italiano","Débora","Cereja","Grape"],
      pesos:[],
      unidades:["kg","bandeja","unidade"]
    };

  if (/\bcebola\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum amarela","Roxa","Branca"],
      pesos:[],
      unidades:["kg","unidade","saco 1kg","saco 3kg"]
    };

  if (/\balho\b/.test(n))
    return {
      marcas:["Produção nacional","Importado Argentina/China","Arisco pasta"],
      tipos:["Cabeça","Graúdo","Médio","Picado conserva","Pasta de alho"],
      pesos:[],
      unidades:["kg","cabeça","bandeja 100g","bandeja 250g","pote"]
    };

  if (/\bbatata\b(?! chips| frita| palha)/.test(n))
    return {
      marcas:["Produção regional","Bela Vista"],
      tipos:["Inglesa","Doce laranja","Doce roxa","Baroa (mandioquinha)","Bolinha"],
      pesos:[],
      unidades:["kg","saco 1kg","saco 2kg","saco 5kg","unidade"]
    };

  if (/\bcenoura\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum","Baby","Ralada em conserva"],
      pesos:[],
      unidades:["kg","pacote 500g","saco 1kg","bandeja"]
    };

  if (/\blimão\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Tahiti","Siciliano","Cravo"],
      pesos:[],
      unidades:["kg","unidade","saco 1kg"]
    };

  if (/\bbanana\b/.test(n))
    return {
      marcas:["Produção regional","Dole"],
      tipos:["Prata","Nanica","Da terra","Maçã","Ouro"],
      pesos:[],
      unidades:["kg","cacho","unidade","dúzia"]
    };

  if (/\bmaçã\b/.test(n))
    return {
      marcas:["Dole","Fuji","Gala","Importada"],
      tipos:["Fuji","Gala","Red Delicious","Granny Smith (verde)"],
      pesos:[],
      unidades:["kg","unidade","bandeja 6"]
    };

  if (/\blaranja\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Pera","Bahia","Lima","Valência","Kinkan"],
      pesos:[],
      unidades:["kg","unidade","saco 3kg"]
    };

  if (/\bmamão\b|\bmamao\b/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Formosa","Papaya","Havaí"],
      pesos:[],
      unidades:["kg","unidade","bandeja"]
    };

  if (/\bmanga\b/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Tommy","Palmer","Espada","Rosa"],
      pesos:[],
      unidades:["kg","unidade","bandeja"]
    };

  if (/\buva\b/.test(n))
    return {
      marcas:["Produção regional","Importada","Orgânico"],
      tipos:["Thompson","Niágara","Rubi","Vitória","Sem semente"],
      pesos:[],
      unidades:["kg","bandeja","cacho"]
    };

  if (/\bmelão\b|\bmelao\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Amarelo","Cantaloupe","Gália","Orange"],
      pesos:[],
      unidades:["kg","unidade","metade"]
    };

  if (/\babacaxi\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Pérola","Havaí"],
      pesos:[],
      unidades:["unidade","kg"]
    };

  if (/\babacate\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum","Hass","Manteiga"],
      pesos:[],
      unidades:["unidade","kg"]
    };

  if (/\bmelancia\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Com semente","Sem semente","Mini"],
      pesos:[],
      unidades:["unidade","metade","quarto","kg"]
    };

  if (/\balface\b/.test(n))
    return {
      marcas:["Produção regional","Orgânico"],
      tipos:["Americana","Crespa","Lisa","Roxa","Romana","Mimosa"],
      pesos:[],
      unidades:["unidade","pé"]
    };

  if (/\bbr[oó]colis\b|\bchuchu\b|\babobrinha\b|\bpimentão\b|\bjiló\b/.test(n))
    return {
      marcas:["Produção regional"],
      tipos:["Comum","Orgânico"],
      pesos:[],
      unidades:["kg","unidade","bandeja"]
    };

  // ════════════════════════════════════════════════════
  // BEBIDAS — Cervejas (destaque do Atacadão)
  // ════════════════════════════════════════════════════

  if (/\bcerveja\b/.test(n))
    return {
      marcas:["Brahma","Skol","Antarctica","Heineken","Amstel","Budweiser","Corona","Bohemia","Itaipava","Devassa","Original","Eisenbahn","Baden Baden","Stella Artois"],
      tipos:["Pilsen","Lager puro malte","IPA","Weiss","Stout","Red ale","Sem álcool","Zero álcool"],
      volumes:["Lata 269ml","Lata 350ml","Long neck 355ml","Garrafa 600ml","Litrão 1L"],
      unidades:["unidade","fardo 6","fardo 8","fardo 12","fardo 15","fardo 24","caixa 24"]
    };

  if (/\brefrigerante\b/.test(n))
    return {
      marcas:["Coca-Cola","Pepsi","Guaraná Antarctica","Fanta","Sprite","Kuat","Del Valle","Schweppes","Dolly","Mineirinho"],
      tipos:["Cola","Guaraná","Laranja","Uva","Limão","Tônica","Ginger Ale","Zero açúcar","Light"],
      volumes:["350ml lata","600ml","1L","1,5L","2L","2,5L"],
      unidades:["unidade","fardo 6","fardo 12","pack 6"]
    };

  if (/suco (de caixa|pronto|néctar|em caixa)|néctar/.test(n))
    return {
      marcas:["Del Valle","Sufresh","Minute Maid","Maguary","Do Bem","Taeq","Juxx"],
      tipos:["Laranja","Uva","Maçã","Caju","Manga","Pêssego","Goiaba","Maracujá","Limão","Abacaxi"],
      volumes:["200ml","1L","1,5L"],
      unidades:["caixinha","garrafa","unidade","caixa 6","caixa 12"]
    };

  if (/água de coco/.test(n))
    return {
      marcas:["Do Bem","Kero Coco","Natural One","Amacoco","Frutap"],
      tipos:["Natural","Com polpa","Orgânica","Com colagénio"],
      volumes:["200ml","330ml","1L"],
      unidades:["caixinha","unidade","fardo 12"]
    };

  if (/água mineral|água com gás|água sem gás/.test(n))
    return {
      marcas:["Crystal","Bonafont","Schin","Indaiá","Serra da Canastra","São Lourenço","Perrier","Evian"],
      tipos:["Com gás","Sem gás","Levemente gaseificada","Saborizada"],
      volumes:["300ml","500ml","1,5L","5L","10L","20L"],
      unidades:["unidade","fardo 6","fardo 12","galão"]
    };

  if (/energético|energy drink/.test(n))
    return {
      marcas:["Red Bull","Monster","TNT","Burn","Flash Power","Cafeína","Integralmedica"],
      tipos:["Original","Zero","Tropical","Melancia","Açaí","Mango"],
      volumes:["250ml","355ml","473ml"],
      unidades:["unidade","fardo 4","caixa 6","caixa 12"]
    };

  if (/\bvinho\b/.test(n))
    return {
      marcas:["Miolo","Casa Valduga","Salton","Santa Helena","Almaden","Casillero del Diablo","Don Guerino","Aurora"],
      tipos:["Tinto seco","Tinto suave","Tinto demi-sec","Branco seco","Branco suave","Rosé seco","Espumante brut","Espumante demi-sec","Moscatel"],
      volumes:["375ml","750ml","1L","1,5L"],
      unidades:["garrafa","unidade","caixa 6"]
    };

  if (/\bcachaça\b/.test(n))
    return {
      marcas:["51","Pitú","Ypióca","Velho Barreiro","São Francisco","Caninha","Sagatiba","Weber Haus"],
      tipos:["Comum prata","Ouro envelhecida","Artesanal","Premium"],
      volumes:["700ml","1L","2L"],
      unidades:["garrafa","unidade","fardo 12"]
    };

  if (/\bvodka\b/.test(n))
    return {
      marcas:["Smirnoff","Absolut","Sky","Crystal","Grey Goose","Stolichnaya"],
      tipos:["Pura","Limão","Melancia","Morango","Menta","Blue"],
      volumes:["275ml","700ml","1L"],
      unidades:["garrafa","unidade"]
    };

  if (/whisky|whiskey/.test(n))
    return {
      marcas:["Johnnie Walker","Jack Daniel's","Chivas Regal","White Horse","Old Parr","Black & White","Ballantine's"],
      tipos:["Red Label","Black Label","Gold Label","Tennessee","12 anos","Single malt","Blended"],
      volumes:["750ml","1L","1,75L"],
      unidades:["garrafa","unidade"]
    };

  if (/\brum\b/.test(n))
    return {
      marcas:["Bacardi","Havana Club","Montilla","Old Nick","Captain Morgan"],
      tipos:["Claro","Ouro","Dark","Especiado"],
      volumes:["700ml","1L"],
      unidades:["garrafa","unidade"]
    };

  if (/\bgin\b/.test(n))
    return {
      marcas:["Tanqueray","Beefeater","Gordons","Bombay Sapphire","Hendrick's","Amázzoni"],
      tipos:["London Dry","Floral","Cítrico","Premium"],
      volumes:["700ml","1L"],
      unidades:["garrafa","unidade"]
    };

  // ════════════════════════════════════════════════════
  // CONGELADOS
  // ════════════════════════════════════════════════════

  if (/pão de queijo/.test(n))
    return {
      marcas:["Forno de Minas","Chessy","BemPão","Qualitá","Ana Maria"],
      tipos:["Tradicional","Recheado com queijo","Mini","Integral","Com calabresa"],
      pesos:["400g","1kg","2kg","3kg"],
      unidades:["pacote","caixa","fardo"]
    };

  if (/lasanha/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Nestlé","Batavo","Qualy"],
      tipos:["Bolonhesa","Frango","Quatro queijos","Presunto e queijo","Vegetariana"],
      pesos:["600g","1kg","2kg"],
      unidades:["unidade","caixa","bandeja"]
    };

  if (/\bpizza\b/.test(n))
    return {
      marcas:["Sadia","Perdigão","Forno de Pedra","Big Hug","Di Napoli"],
      tipos:["Mussarela","Calabresa","Frango","Margherita","Portuguesa","Pepperoni","Veggie"],
      pesos:["460g","550g","700g","1kg"],
      unidades:["unidade","caixa"]
    };

  if (/batata frita|batata palito/.test(n))
    return {
      marcas:["McCain","Bonduelle","Sadia","Seara","Hortus"],
      tipos:["Palito","Frisada","Ondulada","Rústica","Pré-frita para assar","Batata smile"],
      pesos:["400g","1kg","2kg"],
      unidades:["pacote","caixa"]
    };

  if (/\bsorvete\b/.test(n))
    return {
      marcas:["Kibon","Nestlé","Frutos do Brasil","Vigor","Itambé","Naturello"],
      tipos:["Creme","Chocolate","Morango","Napolitano","Flocos","Açaí","Limão"],
      pesos:["1,5L","2L","3L","5L"],
      unidades:["pote","caixa"]
    };

  if (/nugget|empanado/.test(n))
    return {
      marcas:["Sadia","Perdigão","Seara","Aurora","McCain"],
      tipos:["Frango tradicional","Frango com queijo","Veggie","Peixe","Bife empanado"],
      pesos:["300g","500g","1kg","2kg"],
      unidades:["pacote","caixa","bandeja"]
    };

  // ════════════════════════════════════════════════════
  // LIMPEZA — Líquidos
  // ════════════════════════════════════════════════════

  if (/detergente/.test(n))
    return {
      marcas:["Ypê","Limpol","Minuano","Azulim","Brilhante","Scott","Procter"],
      tipos:["Neutro","Limão","Original","Laranja","Concentrado","Bactericida"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade","fardo 24"]
    };

  if (/amaciante/.test(n))
    return {
      marcas:["Downy","Comfort","Ypê","Minuano","Fofo","Brilhante"],
      tipos:["Brisa primavera","Lavanda","Floral","Bebê","Concentrado","Refil"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/desinfetante/.test(n))
    return {
      marcas:["Pinho Sol","Veja","Lysol","Ypê","Ajax","Sanifresh","Cif"],
      tipos:["Pinho","Lavanda","Citrus","Floral","Original","Herbal","Eucalipto"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/água sanitária/.test(n))
    return {
      marcas:["Qboa","Candida","Magik","Ypê","Sanol"],
      tipos:["Regular 2,5%","Concentrada 10%","Com fragrância"],
      volumes:["1L","2L","5L"],
      unidades:["frasco","galão","unidade","fardo 12"]
    };

  if (/limpador multiuso|limpa tudo|veja|ajax/.test(n))
    return {
      marcas:["Veja","Ajax","Cif","Mr. Músculo","Lysoform","Ypê","Flash Limp"],
      tipos:["Regular","Desengordurante","Banheiro","Cozinha","Tira-mofos","Anticalcário"],
      volumes:["500ml","1L","2L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/limpa vidro|limpador de vidro/.test(n))
    return {
      marcas:["Veja","Mr. Músculo","Spartan","Lysoform"],
      tipos:["Spray","Concentrado","Com álcool"],
      volumes:["400ml","500ml"],
      unidades:["frasco","unidade"]
    };

  if (/lava.roupas líquido|sabão líquido roupa/.test(n))
    return {
      marcas:["OMO","Ariel","Brilhante","Ypê","Surf","Ace"],
      tipos:["Regular","Concentrado","Color","Bebê","Perfumado"],
      volumes:["1L","2L","3L","5L"],
      unidades:["frasco","galão","unidade","refil"]
    };

  if (/álcool (em gel|líquido|70|46)/.test(n))
    return {
      marcas:["Asseptgel","Álcool Gel Esterilizador","Antisséptico 70°","Backer","Johnsons"],
      tipos:["Álcool 70° líquido","Álcool 46° líquido","Álcool em gel 70°","Spray"],
      volumes:["500ml","1L","2L","5L"],
      unidades:["frasco","galão","unidade"]
    };

  // ════════════════════════════════════════════════════
  // LIMPEZA — Sólidos / Papéis
  // ════════════════════════════════════════════════════

  if (/sabão em pó/.test(n))
    return {
      marcas:["OMO","Ariel","Brilhante","Surf","Ypê","Ace","Minuano"],
      tipos:["Regular","Concentrado","Multiação","Com amaciante","Lavanda","Bebê"],
      pesos:["500g","1kg","1,5kg","2kg","3kg","5kg"],
      unidades:["caixa","pacote","balde","fardo"]
    };

  if (/\besponja\b/.test(n))
    return {
      marcas:["Scotch-Brite","Bettanin","Clorox","Assolan","Bombril","Flash Limp"],
      tipos:["Dupla face amarela","Dupla face verde","Macia para antiaderente","Palha de aço","Fralda","Tira-manchas"],
      pesos:[],
      unidades:["unidade","pacote 3","pacote 5","pacote 8","pacote 10"]
    };

  if (/palha de aço/.test(n))
    return {
      marcas:["Bombril","Assolan","Bettanin","Inox"],
      tipos:["Regular","Extra resistente","Inox"],
      pesos:[],
      unidades:["pacote 8","pacote 12","pacote 20","caixa"]
    };

  if (/papel higiênico/.test(n))
    return {
      marcas:["Neve","Personal","Scott","Volare","Mili","Soffione","Toque de Seda"],
      tipos:["Folha simples","Folha dupla","Folha tripla","Neutro","Perfumado","Extra macio","Compacto"],
      pesos:[],
      unidades:["pacote 4","pacote 8","pacote 12","pacote 30","fardo 48","fardo 64"]
    };

  if (/papel toalha/.test(n))
    return {
      marcas:["Neve","Scott","Personal","Volare","Folha de Rosto"],
      tipos:["Simples","Duplo","Multiuso"],
      pesos:[],
      unidades:["rolo","pacote 2","pacote 4","pacote 6","fardo"]
    };

  if (/guardanapo/.test(n))
    return {
      marcas:["Neve","Personal","Scott","Volare","Mili"],
      tipos:["Simples","Duplo","Colorido","Serigrafia"],
      pesos:[],
      unidades:["pacote 50","pacote 100","pacote 200","caixa"]
    };

  if (/saco de lixo/.test(n))
    return {
      marcas:["Veja","Glad","Cia do Lixo","Bettanin","Bompack"],
      tipos:["Preto","Azul","Verde","Colorido","Reforçado","Perfumado"],
      pesos:["10L","15L","30L","50L","60L","100L","200L"],
      unidades:["rolo","pacote","caixa"]
    };

  if (/vassoura/.test(n))
    return {
      marcas:["Mor","Sanremo","Plasvale","Bettanin","Tigre"],
      tipos:["Vassoura mista","Pelo macio","Pelo duro","Vassoura de palha","Vassoura sanitária"],
      pesos:[],
      unidades:["unidade"]
    };

  if (/rodo|mop/.test(n))
    return {
      marcas:["Bettanin","Mor","Sanremo","Flash Limp"],
      tipos:["Rodo 40cm","Rodo 60cm","MOP giratório","MOP flat refil"],
      pesos:[],
      unidades:["unidade","kit com refil"]
    };

  // ════════════════════════════════════════════════════
  // HIGIENE E PERFUMARIA
  // ════════════════════════════════════════════════════

  if (/\bshampoo\b/.test(n))
    return {
      marcas:["Seda","Pantene","Head & Shoulders","Elseve","TRESemmé","Dove","Garnier","Lóreal","Clear","OX","Nazca"],
      tipos:["Limpeza suave","Cabelo oleoso","Cabelo seco","Anticaspa","Infantil","Hidratação intensa","Cachos","Liso","Antiqueda"],
      volumes:["200ml","300ml","400ml","750ml","1L"],
      unidades:["frasco","unidade","kit"]
    };

  if (/condicionador/.test(n))
    return {
      marcas:["Seda","Pantene","Elseve","TRESemmé","Dove","Garnier","Lóreal","OX","Nazca"],
      tipos:["Normal","Ressecado","Cachos","Liso","Antiqueda","Hidratação 3 minutos","Infantil"],
      volumes:["200ml","300ml","400ml","750ml","1L"],
      unidades:["frasco","unidade"]
    };

  if (/creme para cabelo|máscara capilar/.test(n))
    return {
      marcas:["Pantene","Elseve","Dove","TRESemmé","Wella","Keratine"],
      tipos:["Hidratação","Nutrição","Reconstrução","Cachos","Pós-química"],
      pesos:["250g","300g","500g","1kg"],
      unidades:["pote","unidade"]
    };

  if (/sabonete/.test(n))
    return {
      marcas:["Dove","Lux","Protex","Palmolive","Lifebuoy","Nívea","Neutrogena","Francis","Phebo","Kelma"],
      tipos:["Barra hidratante","Barra antibacteriano","Barra esfoliante","Barra aveia","Líquido antibacteriano","Líquido hidratante"],
      pesos:["80g","90g","180g","200g"],
      volumes:["200ml","250ml","400ml"],
      unidades:["unidade","pacote 3","pacote 6","frasco","caixa 12"]
    };

  if (/creme dental|pasta de dente/.test(n))
    return {
      marcas:["Colgate","Oral-B","Sensodyne","Close Up","Sorriso","Signal","Odonto","Aquafresh"],
      tipos:["Branqueador","Clareador","Sensível","Anticárie","Carvão","Infantil","Herbal","Menta refrescante"],
      pesos:["50g","70g","90g","150g","180g","200g"],
      unidades:["unidade","caixa 3","kit família"]
    };

  if (/desodorante/.test(n))
    return {
      marcas:["Rexona","Dove","Axe","Old Spice","Nivea","Gillette","Secret","Monange","Avon"],
      tipos:["Aerosol masculino","Aerosol feminino","Roll-on masculino","Roll-on feminino","Bastão","Creme"],
      volumes:["50ml","75ml","150ml","200ml"],
      unidades:["unidade","frasco","kit 2"]
    };

  if (/fio dental/.test(n))
    return {
      marcas:["Colgate","Oral-B","Johnson","Sanifil","GUM"],
      tipos:["Encerado menta","Não encerado","Ultra clean","Tape","Essencial"],
      pesos:["25m","50m","100m"],
      unidades:["unidade","caixa","kit 3"]
    };

  if (/escova de dente/.test(n))
    return {
      marcas:["Colgate","Oral-B","Sorriso","Sanifil","GUM","Curaprox"],
      tipos:["Macia","Média","Dura","Infantil","Ultrafina","Elétrica"],
      pesos:[],
      unidades:["unidade","pacote 2","pacote 3","pacote 4"]
    };

  if (/absorvente/.test(n))
    return {
      marcas:["Always","Carefree","Intimus","Kotex","OB","Tena","Saba"],
      tipos:["Com abas normal","Com abas noturno","Sem abas","Diário (protetor)","Interno regular","Interno super","Ultra fino"],
      pesos:[],
      unidades:["pacote 8","pacote 16","pacote 32","caixa"]
    };

  if (/fralda/.test(n))
    return {
      marcas:["Pampers","Huggies","Turma da Mônica","MamyPoko","Babysec","Confort"],
      tipos:["RN (recém-nascido)","P","M","G","XG","XXG","XXXG","Geriátrica (adulto)"],
      pesos:[],
      unidades:["pacote","fardo","caixa"]
    };

  if (/len[cç]o[s]?\s*umedecido[s]?|lenco[s]?\s*umedecido[s]?|umedecido[s]?/.test(n))
    return {
      marcas:["Pampers","Huggies","WetKiss","Turma da Mônica","OB","Cottonbaby"],
      tipos:["Bebê sem perfume","Bebê com perfume","Adulto antibacteriano","Íntimo","Facial"],
      pesos:[],
      unidades:["pacote 50","pacote 80","pacote 100","caixa","kit 3"]
    };

  if (/protetor solar|filtro solar/.test(n))
    return {
      marcas:["Neutrogena","Nivea","La Roche-Posay","Sundown","Isdin","Banana Boat","Adcos"],
      tipos:["FPS 30 corpo","FPS 50 corpo","FPS 50+ face","FPS 70 face","Infantil FPS 50","Toque seco","Bronzeador"],
      volumes:["120ml","200ml","300ml"],
      unidades:["frasco","unidade"]
    };

  // ════════════════════════════════════════════════════
  // DESCARTÁVEIS E EMBALAGENS
  // ════════════════════════════════════════════════════

  if (/copo descartável/.test(n))
    return {
      marcas:["Descartline","Copobras","JL Copos","Crystal","Plastilene","Maxpack"],
      tipos:["Plástico 50ml (café)","Plástico 80ml","Plástico 150ml","Plástico 180ml","Plástico 200ml","Plástico 300ml","Plástico 400ml","Plástico 500ml","Papel 180ml","Papel 240ml"],
      pesos:[],
      unidades:["pacote 50","pacote 100","caixa 1.000","caixa 2.500"]
    };

  if (/prato descartável/.test(n))
    return {
      marcas:["Descartline","JL","Maxpack","Crystal"],
      tipos:["Raso 15cm","Raso 18cm","Raso 21cm","Fundo","Sobremesa","Bandeja oval"],
      pesos:[],
      unidades:["pacote 10","pacote 20","pacote 50","caixa"]
    };

  if (/talher descartável|garfo descartável|colher descartável|faca descartável/.test(n))
    return {
      marcas:["Descartline","JL","Maxpack"],
      tipos:["Garfo","Faca","Colher de sobremesa","Colher de sopa","Kit completo","Preto premium"],
      pesos:[],
      unidades:["pacote 50","pacote 100","caixa 1.000"]
    };

  if (/papel alumínio/.test(n))
    return {
      marcas:["Wyda","Reynolds","Aluplast","Brasfort","Prata"],
      tipos:["Regular","Reforçado","Culinário grosso"],
      pesos:["7,5m","30m","45m","50m"],
      unidades:["rolo","caixa"]
    };

  if (/papel filme|filme plástico/.test(n))
    return {
      marcas:["Wyda","Reynolds","Aluplast","PVC"],
      tipos:["PVC regular","PVC reforçado"],
      pesos:["28m","30m","50m"],
      unidades:["rolo","caixa"]
    };

  if (/embalagem|marmita plástica|pote descartável/.test(n))
    return {
      marcas:["Descartline","JL","Maxpack","Plasútil","Plastipak"],
      tipos:["Pote 250ml","Pote 350ml","Pote 500ml","Marmita 750ml","Marmita 1L","Marmita 1,5L","Marmita 2L"],
      pesos:[],
      unidades:["unidade","pacote 10","pacote 25","caixa 100"]
    };

  if (/palito de dente|palito|guardanapo porta/.test(n))
    return {
      marcas:["Palissandro","Jontex","Familiar"],
      tipos:["Palito de madeira","Palito bambu","Palito com menta"],
      pesos:[],
      unidades:["caixa 200","caixa 1.000","pacote"]
    };

  // ════════════════════════════════════════════════════
  // MATERIAL DE CONSTRUÇÃO
  // ════════════════════════════════════════════════════

  if (/cimento/.test(n))
    return {
      marcas:["Votoran","Itambé","Ciplan","InterCement","Cauê"],
      tipos:["CP II-E","CP II-F","CP III","CP IV","Branco estrutural","Refratário"],
      pesos:["1kg","5kg","25kg","50kg"],
      unidades:["saco","kg"]
    };

  if (/argamassa/.test(n))
    return {
      marcas:["Votomassa","Revestex","Cimentcola","Qualicola","Plitex"],
      tipos:["Chapisco","Reboco","Assentamento tijolo","AC1 piso interno","AC2 piso externo","AC3 piscina"],
      pesos:["5kg","20kg","50kg"],
      unidades:["saco"]
    };

  if (/\btinta\b/.test(n))
    return {
      marcas:["Suvinil","Coral","Iquine","Lukscolor","Sayerlack","Montana","Renner"],
      tipos:["Acrílica fosca","Acrílica semibrilho","PVA econômica","Esmalte sintético","Verniz","Primer","Selador"],
      volumes:["900ml","3,6L","18L"],
      unidades:["lata","galão","balde"]
    };

  // ════════════════════════════════════════════════════
  // MATERIAL ELÉTRICO
  // ════════════════════════════════════════════════════

  if (/\blâmpada\b/.test(n))
    return {
      marcas:["Philips","Osram","GE","Ledvance","Avant","Elgin"],
      tipos:["LED bulbo","LED tubular","LED PAR30","Fluorescente compacta","Halógena","Filamento retrô"],
      pesos:["9W","12W","15W","25W","40W","60W"],
      unidades:["unidade","caixa 3","caixa 5","caixa 10"]
    };

  if (/\bfio\b|\bcabo elétrico\b/.test(n))
    return {
      marcas:["Nexans","Phelps Dodge","Cobrecom","Ficap","Conduspar"],
      tipos:["Flexível","Rígido","Paralelo PP","PP borracha","PPJA"],
      pesos:["1,5mm²","2,5mm²","4mm²","6mm²","10mm²"],
      unidades:["metro","rolo 50m","rolo 100m"]
    };

  if (/disjuntor/.test(n))
    return {
      marcas:["Schneider","WEG","ABB","Siemens","Intesis","Pial"],
      tipos:["Monopolar","Bipolar","Tripolar","DR residencial","DPS surto"],
      pesos:["10A","16A","20A","25A","32A","40A","50A","63A"],
      unidades:["unidade"]
    };

  // ════════════════════════════════════════════════════
  // DEFAULT — produto não mapeado
  // ════════════════════════════════════════════════════
  return {
    marcas: [],
    tipos: [],
    pesos: [],
    volumes: [],
    unidades: ["unidade","pacote","caixa","kg","g","L","ml","fardo","lata","garrafa","dúzia","par","peça"],
  };
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function parseBRL(str) {
  if (!str && str !== 0) return null;
  const clean = String(str)
    .replace(/[^\d.,]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const val = parseFloat(clean);
  return Number.isNaN(val) ? null : val;
}
function fmtBRL(val) {
  if (val == null || isNaN(val)) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
}

function formatMoneyInput(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const value = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeDecimalInput(raw) {
  const value = String(raw || "")
    .replace(/[^0-9,.]/g, "")
    .replace(/\./g, ",");
  const parts = value.split(",");
  if (parts.length <= 1) return parts[0] || "";
  return `${parts[0]},${parts.slice(1).join("").slice(0, 3)}`;
}

function formatQtyDisplay(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "1";
  return String(Math.round(n * 1000) / 1000).replace(".", ",");
}
function fmtR(val) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(val || 0));
}
function maskBRLInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return fmtBRL(Number(digits) / 100);
}

// ── AI ─────────────────────────────────────────────────────────────────────
async function aiOrganize(items, type) {
  const typeName = TYPE_NAMES[type] || "geral";
  const list = items
    .map((i) => `${[i.marca, i.tipo, i.name, i.embalagem || i.peso || i.volume].filter(Boolean).join(" ")} - ${i.qty} ${i.unit}`)
    .join("\n");

  const prompt = `Organize em categorias para lista de "${typeName}". Retorne APENAS JSON válido, sem markdown:
{"categories":[{"name":"Categoria","items":[{"name":"Nome","detail":"tipo e tamanho","qty":1,"unit":"un","price":null,"checked":false}]}]}

ITENS:
${list}

Regras: categorias em português do Brasil, máximo 8 categorias, preserve qty e unit exatos.\nRegras de categoria obrigatórias:\n- frutas, legumes e verduras (mamão, manga, pera, maçã, banana, tomate, alface etc.) devem ficar em Hortifruti;\n- cerveja, refrigerante, água, suco e energético devem ficar em Bebidas ou Cervejas;\n- carne bovina, frango, peixe, linguiça e similares devem ficar em Carnes e Aves;\n- não crie item separado apenas para quantidade, como "24 unidades"; trate isso como detalhe/embalagem do item anterior.`;

  const parsed = await callAnthropicJSON({
    prompt,
    model: ANTHROPIC_MODEL_ORGANIZE,
    maxTokens: 2000,
  });

  const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
  categories.forEach((c) => {
    c.items = Array.isArray(c.items) ? c.items : [];
    c.items.forEach((i) => {
      i.checked = false;
      i.price = null;
      i.notFound = false;
    });
  });
  return enforceKnownCategoryRules(sanitizeCategories(categories));
}


function capitalizeProductName(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && ["de", "da", "do", "das", "dos", "e"].includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}


function normalizePlainText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeTextForCategory(value) {
  return normalizePlainText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(pct|pcte|pacote|pacotes|cx|caixa|caixas|un|unid|unidade|unidades|kg|g|ml|l)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizePortugueseWord(word) {
  const original = String(word || "").trim();
  if (!original) return "";
  const lower = original.toLowerCase();
  const plain = normalizePlainText(lower);

  const irregular = {
    "ovos":"ovo",
    "paes":"pão",
    "pães":"pão",
    "pasteis":"pastel",
    "papéis":"papel",
    "papeis":"papel",
    "detergentes":"detergente",
    "sabonetes":"sabonete",
    "tomates":"tomate",
    "batatas":"batata",
    "cebolas":"cebola",
    "cenouras":"cenoura",
    "bananas":"banana",
    "laranjas":"laranja",
    "macas":"maçã",
    "maçãs":"maçã",
    "garrafas":"garrafa",
    "caixas":"caixa",
    "pacotes":"pacote",
    "latas":"lata",
    "unidades":"unidade",
    "fardos":"fardo"
  };
  if (irregular[lower]) return irregular[lower];
  if (irregular[plain]) return irregular[plain];

  if (["arroz", "feijao", "feijão", "macarrao", "macarrão", "leite", "oleo", "óleo", "cafe", "café", "sal", "acucar", "açúcar"].includes(plain)) return lower;

  if (plain.endsWith("oes") && lower.length > 5) return lower.replace(/ões$/i, "ão").replace(/oes$/i, "ão");
  if (plain.endsWith("aes") && lower.length > 5) return lower.replace(/ães$/i, "ão").replace(/aes$/i, "ão");
  if (plain.endsWith("res") && lower.length > 5) return lower.slice(0, -2);
  if (plain.endsWith("les") && lower.length > 5) return lower.slice(0, -2);
  if (plain.endsWith("es") && lower.length > 5) return lower.slice(0, -1);
  if (plain.endsWith("s") && lower.length > 4) return lower.slice(0, -1);
  return lower;
}

function normalizeProductName(value) {
  const clean = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\b(de|do|da|dos|das)\s*$/i, "")
    .trim();
  if (!clean) return "";

  const keepLower = new Set(["de", "da", "do", "das", "dos", "e"]);
  const normalized = clean
    .split(/\s+/)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && keepLower.has(lower)) return lower;
      return singularizePortugueseWord(lower);
    })
    .join(" ");

  return capitalizeProductName(normalized);
}

function normalizeUnitValue(unit) {
  const raw = normalizePlainText(unit || "unidade");
  if (/^pacote/.test(raw)) return "pacote";
  if (/^caixa/.test(raw)) return "caixa";
  if (/^fardo/.test(raw)) return "fardo";
  if (/^lata/.test(raw)) return "lata";
  if (/^garrafa/.test(raw)) return "garrafa";
  if (/^quilo|^kg$/.test(raw)) return "kg";
  if (/^grama|^g$/.test(raw)) return "g";
  if (/^litro|^l$/.test(raw)) return "L";
  if (/^mililitro|^ml$/.test(raw)) return "ml";
  if (/^duzia/.test(raw)) return "dúzia";
  if (/^peca|^peça/.test(raw)) return "peça";
  if (/^par/.test(raw)) return "par";
  if (/^unidade|^un$/.test(raw)) return "unidade";
  return String(unit || "unidade").trim() || "unidade";
}

function formatUnitForQuantity(qty, unit) {
  const n = Number(qty || 1);
  const u = normalizeUnitValue(unit);
  const plural = {
    "pacote":"pacotes",
    "caixa":"caixas",
    "fardo":"fardos",
    "lata":"latas",
    "garrafa":"garrafas",
    "unidade":"unidades",
    "dúzia":"dúzias",
    "peça":"peças",
    "par":"pares"
  };
  if (["kg", "g", "L", "ml"].includes(u)) return u;
  return n > 1 ? (plural[u] || u) : u;
}

function formatQtyUnit(qty, unit) {
  const n = Number(qty || 1);
  return `${Number.isInteger(n) ? n : String(n).replace(".", ",")} ${formatUnitForQuantity(n, unit)}`;
}

const CATEGORY_CORRIDOR_ORDER = [
  "Hortifruti",
  "Padaria e Matinais",
  "Padaria e Cereais",
  "Cafés e Chás",
  "Mercearia",
  "Frios e Laticínios",
  "Frios e Embutidos",
  "Laticínios",
  "Carnes e Aves",
  "Congelados",
  "Bebidas",
  "Cervejas",
  "Bebidas Alcoólicas",
  "Vinhos e Destilados",
  "Snacks e Doces",
  "Snacks",
  "Chocolates e Doces",
  "Temperos e Condimentos",
  "Temperos",
  "Limpeza",
  "Higiene e Perfumaria",
  "Higiene e Beleza",
  "Bebês",
  "Descartáveis e Embalagens",
  "Descartáveis",
  "Utilidades Domésticas",
  "Itens Extras",
  "Outros"
];

function categoryOrderIndex(name) {
  const idx = CATEGORY_CORRIDOR_ORDER.findIndex(c => normalizePlainText(c) === normalizePlainText(name));
  return idx >= 0 ? idx : 999;
}

function normalizeListItem(item) {
  const qty = Number(String(item?.qty ?? item?.quantidade ?? 1).replace(",", "."));
  const unit = normalizeUnitValue(item?.unit || item?.unidade || "unidade");
  const name = normalizeProductName(item?.name || item?.nome || "");
  return {
    ...item,
    name,
    qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
    unit,
    detail: String(item?.detail || item?.tipo || item?.embalagem || item?.peso || item?.volume || "").trim(),
    price: item?.price ?? null,
    checked: Boolean(item?.checked),
    notFound: Boolean(item?.notFound),
  };
}

function sanitizeCategories(categories) {
  return (Array.isArray(categories) ? categories : [])
    .map((cat) => {
      const items = (Array.isArray(cat?.items) ? cat.items : [])
        .map(normalizeListItem)
        .filter(item => item.name && !isQuantityOnlyItemName(item.name))
        .sort((a, b) => normalizePlainText(a.name).localeCompare(normalizePlainText(b.name), "pt-BR"));
      return { ...cat, name: cat?.name || "Outros", items };
    })
    .filter(cat => cat.items.length > 0)
    .sort((a, b) => {
      const oa = categoryOrderIndex(a.name);
      const ob = categoryOrderIndex(b.name);
      if (oa !== ob) return oa - ob;
      return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
    });
}

function loadUserItemMemory() {
  try {
    const parsed = JSON.parse(localStorage.getItem("tnl_item_memory") || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUserItemMemoryFromCategories(categories) {
  try {
    const memory = loadUserItemMemory();
    (Array.isArray(categories) ? categories : []).forEach((cat) => {
      (Array.isArray(cat.items) ? cat.items : []).forEach((item) => {
        const key = normalizePlainText(item.name);
        if (!key) return;
        memory[key] = {
          name: item.name,
          category: cat.name,
          unit: normalizeUnitValue(item.unit || "unidade"),
          detail: item.detail || "",
          updatedAt: new Date().toISOString(),
        };
      });
    });
    localStorage.setItem("tnl_item_memory", JSON.stringify(memory));
  } catch {
    // Mantém o app funcionando mesmo se o navegador bloquear armazenamento local.
  }
}

function applyUserMemoryToItems(items) {
  const memory = loadUserItemMemory();
  return (Array.isArray(items) ? items : []).map((item) => {
    const normalized = normalizeListItem(item);
    const remembered = memory[normalizePlainText(normalized.name)];
    if (!remembered) return normalized;
    return {
      ...normalized,
      name: remembered.name || normalized.name,
      unit: normalizeUnitValue(normalized.unit || remembered.unit || "unidade"),
    };
  });
}


function numberFromPortuguese(value) {
  const raw = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const map = {
    "zero":0,"meio":0.5,"meia":0.5,"um":1,"uma":1,"dois":2,"duas":2,"tres":3,"quatro":4,"cinco":5,"seis":6,"sete":7,"oito":8,"nove":9,"dez":10,
    "onze":11,"doze":12,"treze":13,"quatorze":14,"catorze":14,"quinze":15,"dezesseis":16,"dezessete":17,"dezoito":18,"dezenove":19,"vinte":20,
    "trinta":30,"quarenta":40,"cinquenta":50,"sessenta":60,"setenta":70,"oitenta":80,"noventa":90,
    "cem":100,"cento":100,"duzento":200,"duzentos":200,"duzentas":200,"trezento":300,"trezentos":300,"trezentas":300,"quatrocento":400,"quatrocentos":400,"quatrocentas":400,"quinhento":500,"quinhentos":500,"quinhentas":500,
    "seiscento":600,"seiscentos":600,"seiscentas":600,"setecento":700,"setecentos":700,"setecentas":700,"oitocento":800,"oitocentos":800,"oitocentas":800,"novecento":900,"novecentos":900,"novecentas":900,
    "mil":1000
  };
  if (/^(um|uma)\s+e\s+mei[ao]$/.test(raw)) return 1.5;
  if (/^(dois|duas)\s+e\s+mei[ao]$/.test(raw)) return 2.5;
  if(map[raw] !== undefined) return map[raw];
  if (/\s+e\s+/.test(raw)) {
    const sum = raw.split(/\s+e\s+/).reduce((acc, part) => {
      const value = map[part.trim()];
      return value === undefined ? NaN : acc + value;
    }, 0);
    if (Number.isFinite(sum)) return sum;
  }
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}


function spokenNumberPattern() {
  return "(?:zero|meio|meia|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|duzentas|trezentos|trezentas|quatrocentos|quatrocentas|quinhentos|quinhentas|seiscentos|seiscentas|setecentos|setecentas|oitocentos|oitocentas|novecentos|novecentas|mil|\d+[,.]?\d*)";
}

function normalizeVoiceMeasurementPhrases(text) {
  let raw = String(text || "").toLowerCase();
  const num = spokenNumberPattern();

  const toNum = (v) => {
    const n = numberFromPortuguese(String(v || "").replace(/§DEC§/g, ","));
    return Number.isFinite(n) ? n : null;
  };

  const fmtQty = (value, decimals = 2) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "";
    return String(Number(n.toFixed(decimals))).replace(".", ",");
  };

  raw = raw.replace(/(\d+)\s*,\s*(\d+)/g, "$1§DEC§$2");

  // "um quilo e meio de carne" => "1,5 kg de carne".
  // Deve vir antes da regra de gramas para evitar "meio" virar 0,0005 kg.
  raw = raw.replace(new RegExp(`\\b(${num})\\s*(?:quilos?|quilo|kg)\\s+e\\s+mei[ao]\\s+de\\s+([^,.;]+)`, "gi"), (m, kg, product) => {
    const kgNum = toNum(kg);
    if (!Number.isFinite(kgNum)) return m;
    return `${fmtQty(kgNum + 0.5)} kg de ${product.trim()}`;
  });

  // "um quilo e duzentos gramas de picanha" / "1 kg e 200 g de picanha" => "1,2 kg de picanha".
  // Se a parte complementar for "cem", "duzentos", etc., interpreta como gramas.
  raw = raw.replace(new RegExp(`\\b(${num})\\s*(?:quilos?|quilo|kg)\\s+e\\s+(${num})\\s*(?:gramas?|g)?\\s+de\\s+([^,.;]+)`, "gi"), (m, kg, g, product) => {
    const gRaw = String(g || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    if (/^mei[ao]$/.test(gRaw)) return m;
    const kgNum = toNum(kg);
    const gNum = toNum(g);
    if (!Number.isFinite(kgNum) || !Number.isFinite(gNum)) return m;
    const total = kgNum + (gNum / 1000);
    return `${fmtQty(total)} kg de ${product.trim()}`;
  });

  // "dois litros e quinhentos ml de suco" => "2,5 L de suco"
  raw = raw.replace(new RegExp(`\\b(${num})\\s*(?:litros?|l)\\s+e\\s+(${num})\\s*(?:ml|mililitros?)?\\s+de\\s+([^,.;]+)`, "gi"), (m, l, ml, product) => {
    const lNum = toNum(l);
    const mlNum = toNum(ml);
    if (!Number.isFinite(lNum) || !Number.isFinite(mlNum)) return m;
    const total = lNum + (mlNum / 1000);
    return `${fmtQty(total)} L de ${product.trim()}`;
  });

  // "meio quilo de carne" => "0,5 kg de carne"
  raw = raw.replace(/\bmei[ao]\s+(?:quilo|quilos|kg)\s+de\s+([^,.;]+)/gi, (m, product) => `0,5 kg de ${product.trim()}`);
  raw = raw.replace(/\bmei[ao]\s+(?:litro|litros|l)\s+de\s+([^,.;]+)/gi, (m, product) => `0,5 L de ${product.trim()}`);

  return raw.replace(/§DEC§/g, ",");
}

function normalizeUnitSpoken(unit) {
  return normalizeUnitValue(unit);
}

function normalizeSizeSpoken(num, measure) {
  const n = numberFromPortuguese(num);
  if(!n) return "";
  const raw = String(measure || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if(/^quilo|^kg/.test(raw)) return `${n}kg`;
  if(/^grama|^g/.test(raw)) return `${n}g`;
  if(/^litro|^l$/.test(raw)) return `${n}L`;
  if(/^mililitro|^ml/.test(raw)) return `${n}ml`;
  return "";
}

function splitContinuousVoiceIntoChunks(text) {
  const qtyStartWords = "(?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|vinte|\\d+[,.]?\\d*)";
  const unitWords = "(?:pacotes?|caixas?|fardos?|latas?|garrafas?|unidades?|un|quilos?|kg|gramas?|g|litros?|l|ml|mililitros?|d[uú]zias?|pares?|pe[çc]as?)";
  const sizeWords = "(?:quilos?|kg|gramas?|g|litros?|l|ml|mililitros?)";
  const productWords = [
    "arroz","feijao","feijão","macarrao","macarrão","leite","detergente","carne","frango","cerveja","refrigerante","oleo","óleo","azeite","acucar","açúcar","sal","cafe","café","pao","pão","queijo","presunto","manteiga","margarina","iogurte","tomate","cebola","alho","batata","cenoura","banana","maca","maçã","laranja","limao","limão","alface","mamao","mamão","manga","uva","melão","melao","abacaxi","pera","pêra","sabonete","sabonetes","shampoo","condicionador","desodorante","papel","papel higienico","papel higiênico","sabao","sabão","amaciante","desinfetante","agua sanitaria","água sanitária","agua","água","suco","bolacha","biscoito","chocolate","salgadinho","farinha","fuba","fubá","maionese","ketchup","mostarda","molho","extrato","atum","sardinha","milho","ervilha","aveia","pipoca","vinagre","ovos","ovo","linguica","linguiça","salsicha","picanha","costela","peixe","salmao","salmão","pizza","lasanha","sorvete","fralda","absorvente","creme dental","escova","fio dental","copo","prato","garfo","faca","colher","guardanapo","saco de lixo","lixo"
  ];
  const normalizedProducts = productWords
    .map(w => w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())
    .sort((a,b)=>b.length-a.length);
  const escapeRegExp = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const productAlternation = normalizedProducts.map(escapeRegExp).join("|");

  let raw = normalizeVoiceMeasurementPhrases(text)
    .replace(/(\d+)\s*,\s*(\d+)/g, "$1§DEC§$2")
    .replace(/\b(um|uma|dois|duas)\s+e\s+mei[ao]\b/gi, (m) => m.toLowerCase().startsWith("do") ? "2§DEC§5" : "1§DEC§5")
    .replace(/\bcom\s+((?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\d+))\s+(unidades?|un|latas?|garrafas?|long\s+necks?)\b/gi, (m, n, u) => `com ${n}§JOIN§${u}`)
    .replace(/\b(?:quero|preciso|comprar|coloca|coloque|adiciona|adicione|por favor)\b/gi, " ")
    .replace(/\b(?:mais|tamb[eé]m|a[ií]|depois)\b/gi, ",")
    .replace(/\s+e\s+(?=(?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\d+)\b)/gi, ", ")
    .replace(/[.;\n]+/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  // iPhone/Whisper às vezes devolve tudo em uma única frase sem pontuação.
  // Criamos quebras antes de uma nova quantidade/unidade/produto.
  raw = raw.replace(new RegExp("\\s+(" + qtyStartWords + ")\\s+(?=(" + unitWords + "|" + productAlternation + ")\\b)", "gi"), ", $1 ");

  const explicit = raw.split(/\s*,\s*/g).map(v => v.trim()).filter(v => v.length > 1);

  const splitOne = (chunk) => {
    const normalized = chunk.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const matches = [];
    for (const product of normalizedProducts) {
      const re = new RegExp("(^|\\s)" + escapeRegExp(product) + "(?=\\s|$)", "g");
      let m;
      while ((m = re.exec(normalized)) !== null) {
        const idx = m.index + (m[1] ? m[1].length : 0);
        matches.push({ idx, product });
      }
    }
    const unique = [];
    for (const m of matches.sort((a,b)=>a.idx-b.idx || b.product.length-a.product.length)) {
      if (!unique.some(u => Math.abs(u.idx - m.idx) < 2)) unique.push(m);
    }
    if (unique.length <= 1) return [chunk];

    const parts = [];
    for (let i=0;i<unique.length;i++) {
      const start = unique[i].idx;
      const end = i + 1 < unique.length ? unique[i+1].idx : chunk.length;
      const prefix = i === 0 ? chunk.slice(0, start).trim() : "";
      const core = chunk.slice(start, end).trim();
      const part = `${prefix} ${core}`.trim();
      if (part) parts.push(part);
    }
    return parts;
  };

  const fragments = explicit
    .flatMap(splitOne)
    .map(v => v.replace(/§DEC§/g, ",").replace(/§JOIN§/g, " ").trim())
    .filter(v => v.length > 1);

  // Correção crítica: o transcritor às vezes separa o tamanho da embalagem
  // como se fosse um item próprio. Ex.: "1 pacote arroz, 5 kg".
  // Esses fragmentos de medida devem ser anexados ao item anterior.
  const merged = [];
  const measureOnlyRe = new RegExp("^(" + qtyStartWords + ")\\s*(" + sizeWords + ")$", "i");
  const looseMeasureStartRe = new RegExp("^(" + qtyStartWords + ")\\s*(" + sizeWords + ")\\b", "i");
  const fullItemStartRe = new RegExp("^(" + qtyStartWords + ")\\s+(" + unitWords + ")\\b", "i");

  for (const frag of fragments) {
    const cleanFrag = frag.trim();
    if (measureOnlyRe.test(cleanFrag) && merged.length) {
      merged[merged.length - 1] = (merged[merged.length - 1] + " de " + cleanFrag).trim();
      continue;
    }

    if (looseMeasureStartRe.test(cleanFrag) && merged.length && !fullItemStartRe.test(cleanFrag)) {
      merged[merged.length - 1] = (merged[merged.length - 1] + " de " + cleanFrag).trim();
      continue;
    }

    merged.push(cleanFrag);
  }

  return merged;
}

function parseSpokenShoppingItems(text) {
  const qtyWords = "(?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|vinte|\\d+[,.]?\\d*)";
  const unitWords = "(?:pacotes?|caixas?|fardos?|latas?|garrafas?|unidades?|un|quilos?|kg|gramas?|g|litros?|l|ml|mililitros?|d[uú]zias?|pares?|pe[çc]as?)";
  const sizeWords = "(?:quilos?|kg|gramas?|g|litros?|l|ml|mililitros?)";
  const chunks = splitContinuousVoiceIntoChunks(text);
  const items = [];

  for (const chunk of chunks) {
    let c = chunk
      .replace(/^(quero|preciso|comprar|coloca|coloque|adiciona|adicione)\s+/i, "")
      .replace(/^(?:e|de|do|da|dos|das|mais|tamb[eé]m|a[ií])\s+/i, "")
      .trim();
    let qty = 1;
    let unit = "unidade";
    let peso = "";
    let volume = "";
    let embalagem = "";

    let m = c.match(new RegExp(`^(${qtyWords})\\s+(${unitWords})(?:\\s+de)?\\s+(.+?)(?:\\s+de\\s+(${qtyWords})\\s*(${sizeWords}))?$`, "i"));
    if (m) {
      qty = numberFromPortuguese(m[1]) || 1;
      unit = normalizeUnitSpoken(m[2]);
      c = m[3].trim();
      if (m[4] && m[5]) {
        const size = normalizeSizeSpoken(m[4], m[5]);
        if (/kg|g$/i.test(size)) peso = size;
        if (/ml|L$/i.test(size)) volume = size;
        embalagem = size;
      }
    } else {
      m = c.match(new RegExp(`^(${qtyWords})\\s+(.+?)\\s+de\\s+(${qtyWords})\\s*(${sizeWords})$`, "i"));
      if (m) {
        qty = numberFromPortuguese(m[1]) || 1;
        c = m[2].trim();
        const size = normalizeSizeSpoken(m[3], m[4]);
        if (/kg|g$/i.test(size)) peso = size;
        if (/ml|L$/i.test(size)) volume = size;
        embalagem = size;
      } else {
        m = c.match(new RegExp(`^(.+?)\\s+de\\s+(${qtyWords})\\s*(${sizeWords})$`, "i"));
        if (m) {
          c = m[1].trim();
          const size = normalizeSizeSpoken(m[2], m[3]);
          if (/kg|g$/i.test(size)) peso = size;
          if (/ml|L$/i.test(size)) volume = size;
          embalagem = size;
        } else {
          m = c.match(new RegExp(`^(${qtyWords})\\s+(.+)$`, "i"));
          if (m) {
            qty = numberFromPortuguese(m[1]) || 1;
            c = m[2].trim();
          }
        }
      }
    }

    // Regra de fala comum: "oitocentos de carne" / "800 de beterraba" significa 800g do produto.
    if (unit === "unidade" && qty === 1) {
      const implicitGrams = c.match(new RegExp(`^(${qtyWords})\s+de\s+(.+)$`, "i"));
      if (implicitGrams) {
        const grams = numberFromPortuguese(implicitGrams[1]);
        const productName = implicitGrams[2].trim();
        if (Number.isFinite(grams) && grams > 0 && grams < 1000 && productName) {
          qty = Number((grams / 1000).toFixed(2));
          unit = "kg";
          c = productName;
        }
      }
    }

    const packMatch = c.match(/\bcom\s+((?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\d+))\s+(unidades?|un|latas?|garrafas?|long\s+necks?)\b/i);
    if (packMatch) {
      const packQty = numberFromPortuguese(packMatch[1]) || Number(packMatch[1]) || 1;
      const packUnit = normalizeUnitValue(packMatch[2]);
      embalagem = [embalagem, `com ${packQty} ${formatUnitForQuantity(Number(packQty) || 2, packUnit)}`].filter(Boolean).join(" ");
      c = c.replace(packMatch[0], "").trim();
    }

    c = c
      .replace(/^(?:e|de|do|da|dos|das|mais|tamb[eé]m|a[ií])\s+/i, "")
      .replace(/\b(de|do|da|dos|das|com)\s*$/i, "")
      .replace(/\bde\s+(um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\d+[,.]?\d*)\s*(quilo|quilos|kg|grama|gramas|g|litro|litros|l|ml|mililitros)\b/gi, "")
      .trim();

    const name = normalizeProductName(c);
    if (name) {
      items.push(normalizeListItem({ name, marca:"", tipo:"", embalagem, peso, volume, qty, unit, price:null, checked:false, notFound:false }));
    }
  }

  return items;
}

async function aiParseShoppingText(text, type = "mercado") {
  const cleanText = String(text || "").trim();
  if (!cleanText) return [];
  const typeName = TYPE_NAMES[type] || "geral";

  const prompt = [
    "Você é especialista em interpretar listas de compras ditadas ou coladas em português do Brasil.",
    "Transforme o texto em itens estruturados para uma lista do tipo: " + typeName + ".",
    "O texto pode vir como fala contínua, com vírgulas, pausas, 'e', quantidades ou unidades misturadas.",
    "Retorne APENAS JSON válido, sem markdown, sem explicação, neste formato:",
    '{"items":[{"name":"Arroz","qty":2,"unit":"pacote","marca":"","tipo":"","peso":"5kg","volume":"","embalagem":"5kg"}]}',
    "Regras obrigatórias:",
    "- Separe corretamente TODOS os itens ditados em sequência, mesmo quando não houver vírgula;",
    "- Trate ponto, vírgula, pausa de fala, 'mais', 'também', 'e' e 'aí' como possíveis separadores de itens;",
    "- Entenda fala contínua: 'arroz feijão leite detergente' deve virar 4 itens;",
    "- Quando houver sequência como 'dois pacotes de arroz de cinco quilos, três caixas de leite de um litro e uma lata de óleo 900 ml', gere três objetos separados;",
    "- Interprete números por extenso: um=1, dois=2, três=3, quatro=4, cinco=5, dez=10 etc.;",
    "- Exemplo: 'dois pacotes de arroz de cinco quilos' => name 'Arroz', qty 2, unit 'pacote', peso '5kg', embalagem '5kg';",
    "- Exemplo: 'um quilo e meio de carne' ou '1,5 kg de carne' => name 'Carne', qty 1.5, unit 'kg'; nunca transforme 1,5 em 5;",
    "- Exemplo: 'um quilo e duzentos gramas de picanha' => name 'Picanha', qty 1.2, unit 'kg'; gere UM ÚNICO item;",
    "- Exemplo: 'oitocentos de carne moída' ou '800 de carne moída' => name 'Carne moída', qty 0.8, unit 'kg';",
    "- Nunca deixe conectores como 'e', 'de', 'do', 'da' no começo do name;",
    "- Exemplo: 'três caixas de leite de um litro' => name 'Leite', qty 3, unit 'caixa', volume '1L', embalagem '1L';",
    "- Exemplo: 'um fardo de cerveja lata 350 ml' => name 'Cerveja', qty 1, unit 'fardo', volume '350ml', embalagem 'lata 350ml';",
    "- Exemplo: 'dois fardos de cerveja Heineken long neck com 24 unidades' => name 'Cerveja', marca 'Heineken', tipo 'Long neck', qty 2, unit 'fardo', embalagem 'com 24 unidades'; não crie item separado para 24 unidades;",
    "- Mamão, manga, pera, maçã, banana, tomate, uva, melão, abacaxi e similares são Hortifruti quando a lista for organizada por categoria;",
    "- name deve conter apenas o produto principal, sem quantidade, sem unidade e sem peso/volume;",
    "- unit deve representar a quantidade comprada: unidade, pacote, kg, g, L, ml, caixa, lata, garrafa, fardo, dúzia, par, peça;",
    "- peso use apenas g/kg quando houver tamanho/peso da embalagem;",
    "- volume use apenas ml/L quando houver tamanho/volume da embalagem;",
    "- embalagem pode combinar forma e tamanho, como 'pacote 5kg', 'lata 350ml' ou apenas '5kg';",
    "- marca e tipo só devem ser preenchidos quando forem expressamente citados pelo usuário;",
    "- Não invente itens não mencionados.",
    "",
    "TEXTO:",
    cleanText,
  ].join("\n");

  const parsed = await callAnthropicJSON({
    prompt,
    model: ANTHROPIC_MODEL_ORGANIZE,
    maxTokens: 1400,
  });

  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  const deterministicItems = parseSpokenShoppingItems(cleanText);
  const looksLikeVoice = /\b(um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|pacote|pacotes|caixa|caixas|fardo|lata|garrafa|quilo|quilos|litro|litros|ml|kg|mais|tamb[eé]m|a[ií])\b|[,.;\n]/i.test(cleanText);
  if (looksLikeVoice && deterministicItems.length >= rawItems.length) {
    return deterministicItems;
  }
  if (deterministicItems.length >= 2 && rawItems.length <= 1) {
    return deterministicItems;
  }
  return rawItems
    .map((item) => {
      const name = normalizeProductName(item?.name || item?.nome || "");
      if (!name) return null;
      const qty = Number(String(item?.qty || item?.quantidade || 1).replace(",", "."));
      const unit = normalizeUnitValue(item?.unit || item?.unidade || "unidade");
      const peso = String(item?.peso || "").trim();
      const volume = String(item?.volume || "").trim();
      const embalagem = String(item?.embalagem || peso || volume || "").trim();
      return normalizeListItem({
        name,
        marca: String(item?.marca || "").trim(),
        tipo: String(item?.tipo || "").trim(),
        embalagem,
        peso,
        volume,
        qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
        unit,
        price: null,
        checked: false,
        notFound: false,
      });
    })
    .filter(Boolean);
}

function isQuantityOnlyItemName(name) {
  const plain = normalizePlainText(name);
  if (!plain) return true;
  if (/^(kg|g|l|ml|quilo|quilos|grama|gramas|litro|litros|mililitro|mililitros)$/.test(plain)) return true;
  return /^(com\s+)?\d+(?:[,.]\d+)?\s*(unidade|unidades|un|pacote|pacotes|caixa|caixas|fardo|fardos|lata|latas|garrafa|garrafas|kg|g|l|ml)?$/.test(plain);
}

function inferPreferredCategoryForItem(item) {
  const n = normalizeTextForCategory([item?.name, item?.detail, item?.marca, item?.tipo, item?.embalagem].filter(Boolean).join(" "));
  const has = (...keys) => keys.some(k => n.includes(normalizeTextForCategory(k)));
  const hasWord = (...keys) => keys.some((k) => {
    const escaped = normalizeTextForCategory(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(n);
  });

  // Regras específicas primeiro. Isso evita conflitos como "molho de tomate" cair em Hortifruti
  // e evita que "macarrão" seja confundido com "maçã".
  if (has("molho de tomate", "extrato de tomate", "polpa de tomate", "tomate pelado", "massa de tomate")) return "Mercearia";
  if (has("farinha de mandioca", "farinha mandioca", "farofa de mandioca", "polvilho", "tapioca")) return "Mercearia";
  if (has("bolacha", "biscoito", "cookie", "oreo", "trakinas", "wafer", "chocolate", "salgadinho", "chips", "pipoca doce")) return "Snacks e Doces";
  if (has("colorau", "páprica", "paprica", "orégano", "oregano", "cominho", "tempero", "sazon", "caldo knorr", "caldo maggi", "alho e sal")) return "Temperos e Condimentos";
  if (/\blencos?\s+umedecid/.test(n) || /\bumedecid/.test(n) || has("lenço umedecido", "lenco umedecido", "lenços umedecidos", "lencos umedecidos", "umedecido", "umedecidos", "fralda", "pomada bebê", "pomada bebe", "talco bebê", "talco bebe")) return "Bebês";
  if (has("papel toalha", "guardanapo", "copo descartável", "copo descartavel", "prato descartável", "prato descartavel", "talher descartável", "talher descartavel", "papel alumínio", "papel aluminio", "papel filme", "saco freezer", "saco plástico", "saco plastico")) return "Descartáveis e Embalagens";
  if (has("pilha", "bateria", "lâmpada", "lampada", "tomada", "interruptor", "extensão", "extensao", "cabo elétrico", "cabo eletrico", "fio elétrico", "fio eletrico", "disjuntor")) return "Elétrica";
  if (has("bombril", "palha de aço", "palha de aco", "coala", "omo", "lava roupa", "lava roupas", "sabão em pó", "sabao em po", "sabão líquido", "sabao liquido", "detergente", "desinfetante", "amaciante", "água sanitária", "agua sanitaria", "limpador", "multiuso", "alvejante", "cloro", "esponja", "vassoura", "rodo", "saco de lixo")) return "Limpeza";
  if (has("pasta de dente", "creme dental", "sabonete", "shampoo", "condicionador", "desodorante", "escova de dente", "fio dental", "papel higiênico", "papel higienico", "absorvente", "barbeador", "aparelho de barbear")) return "Higiene e Perfumaria";

  const rules = [
    { cat: "Mercearia", keys: ["arroz","feijao","feijão","macarrao","macarrão","massa","farinha","acucar","açúcar","sal","oleo","óleo","azeite","vinagre","milho","ervilha","atum","sardinha","fuba","fubá","maionese","ketchup","mostarda","aveia","granola","cereal matinal","leite condensado","creme de leite"] },
    { cat: "Padaria e Matinais", keys: ["pao","pão","bisnaguinha","torrada","bolo","cereal","granola","aveia"] },
    { cat: "Cafés e Chás", keys: ["cafe","café","cha","chá","achocolatado","nescau","toddy"] },
    { cat: "Frios e Laticínios", keys: ["ovo","ovos","leite","queijo","iogurte","manteiga","margarina","requeijao","requeijão","presunto","mortadela","salame","peito de peru"] },
    { cat: "Carnes e Aves", keys: ["carne","frango","coxinha da asa","asa de frango","peixe","linguica","linguiça","picanha","costela","bife","file","filé","patinho","alcatra","maminha","fraldinha","salsicha","hamburguer","hambúrguer","bacon"] },
    { cat: "Bebidas", keys: ["cerveja","heineken","skol","brahma","refrigerante","agua","água","suco","energetico","energético","coca","guarana","guaraná","agua de coco","água de coco"] },
    { cat: "Cadernos", keys: ["caderno","agenda","fichario","fichário"] },
    { cat: "Material de Escrita", keys: ["lapis","lápis","caneta","borracha","apontador","marca texto","marca-texto","corretivo","grafite","lapiseira"] },
    { cat: "Medicamentos", keys: ["remedio","remédio","medicamento","dipirona","paracetamol","ibuprofeno","vitamina","xarope","soro fisiologico","soro fisiológico"] },
    { cat: "Hidráulica", keys: ["cano","tubo","conexao","conexão","registro","torneira","chuveiro","ralo","sifao","sifão"] },
    { cat: "Ferramentas", keys: ["martelo","chave de fenda","alicate","furadeira","parafusadeira"] },
    { cat: "Ferragens", keys: ["prego","parafuso","bucha","porca","arruela"] },
  ];
  for (const rule of rules) {
    if (rule.keys.some(k => n.includes(normalizeTextForCategory(k)))) return rule.cat;
  }

  if (hasWord("mamao","mamão","manga","pera","pêra","maca","maçã","banana","laranja","limao","limão","uva","melão","melao","abacaxi","abacate","melancia","morango","kiwi","goiaba","maracuja","maracujá","tomate","alface","cebola","alho","batata","cenoura","mandioca","aipim","macaxeira","cheiro verde","cheiro-verde","salsinha","cebolinha","chuchu","brocolis","brócolis","abobrinha","beterraba","pepino","repolho","couve","couve flor","couve-flor","berinjela","pimentao","pimentão","verdura","legume","fruta")) return "Hortifruti";
  return "";
}

function enforceKnownCategoryRules(categories) {
  const buckets = {};
  (Array.isArray(categories) ? categories : []).forEach((cat) => {
    (Array.isArray(cat.items) ? cat.items : []).forEach((item) => {
      if (isQuantityOnlyItemName(item.name)) return;
      const preferred = inferPreferredCategoryForItem(item) || cat.name || "Outros";
      if (!buckets[preferred]) buckets[preferred] = [];
      buckets[preferred].push(item);
    });
  });
  return sanitizeCategories(Object.entries(buckets).map(([name, items]) => ({ name, items })));
}

function demoOrganize(items) {
  // Categorias alinhadas ao Atacadão, com regras específicas antes das genéricas.
  const map = [
    [["molho de tomate","extrato de tomate","polpa de tomate","tomate pelado"],"Mercearia"],
    [["bolacha","biscoito","cookie","oreo","chocolate","salgadinho","snack","chips","barra","pipoca"],"Snacks e Doces"],
    [["colorau","paprica","páprica","tempero","orégano","oregano","cominho","sazon"],"Temperos e Condimentos"],
    [["lenço umedecido","lenco umedecido","lenços umedecidos","lencos umedecidos","umedecido","umedecidos","umedecid","fralda","pomada bebê","pomada bebe"],"Bebês"],
    [["papel toalha","guardanapo","copo descartável","copo descartavel","prato descartável","prato descartavel","talher","papel alumínio","papel aluminio","papel filme","embalagem"],"Descartáveis e Embalagens"],
    [["pilha","bateria","fio","cabo","tomada","interruptor","disjuntor","lampada","lâmpada","extensao","extensão"],"Elétrica"],
    [["bombril","palha","coala","detergente","sabão","sabao","desinfetante","vassoura","esponja","limpador","água sanitária","agua sanitaria","amaciante","lava roupa","omo","multiuso","rodo","saco de lixo"],"Limpeza"],
    [["pasta de dente","creme dental","shampoo","sabonete","escova","fio dental","desodorante","condicionador","absorvente","papel higiênico","papel higienico"],"Higiene e Perfumaria"],
    [["arroz","feijão","feijao","macarrão","macarrao","farinha","açúcar","acucar","sal","azeite","óleo","oleo","vinagre","milho","linhaça","chia","atum","sardinha"],"Mercearia"],
    [["carne","frango","coxinha da asa","asa de frango","peixe","linguiça","linguica","bacon","costela","picanha","bife","filé","file","salsicha","hambúrguer","hamburguer"],"Carnes e Aves"],
    [["leite","iogurte","queijo","manteiga","requeijão","requeijao","creme de leite","nata","margarina","presunto","mortadela","salame","peito de peru","ovo","ovos"],"Frios e Laticínios"],
    [["alface","tomate","cebola","alho","batata","cenoura","mandioca","aipim","cheiro verde","cheiro-verde","limão","limao","banana","maçã","maca","laranja","fruta","legume","verdura","melancia","abacate","brócolis","brocolis","mamão","mamao","manga","uva","melão","melao","abacaxi","abobrinha","beterraba","pepino","repolho","couve","berinjela","pera","pêra"],"Hortifruti"],
    [["pão de queijo","lasanha","pizza","sorvete","batata frita"],"Congelados"],
    [["café","cafe","chá","cha","achocolatado","nescau"],"Cafés e Chás"],
    [["cerveja","refrigerante","suco","água","agua","energético","energetico","água de coco","agua de coco"],"Bebidas"],
    [["vinho","cachaça","vodka","whisky","rum","gin"],"Bebidas Alcoólicas"],
    [["pão","pao","torrada","cereal","aveia","granola"],"Padaria e Matinais"],
  ];
  const cats = {};
  items.forEach(item=>{
    const n=normalizePlainText(item.name);
    let found=false;
    for (const [keys,cat] of map) {
      if (keys.some(k=>n.includes(normalizePlainText(k)))) {
        if (!cats[cat]) cats[cat]=[];
        const detail=[item.marca,item.tipo,item.embalagem||item.peso||item.volume].filter(Boolean).join(" ");
        cats[cat].push(normalizeListItem({name:item.name,detail,qty:item.qty,unit:item.unit,price:null,checked:false,notFound:false}));
        found=true;break;
      }
    }
    if(!found){
      if(!cats["Outros"])cats["Outros"]=[];
      const detail=[item.marca,item.tipo,item.embalagem||item.peso||item.volume].filter(Boolean).join(" ");
      cats["Outros"].push(normalizeListItem({name:item.name,detail,qty:item.qty,unit:item.unit,price:null,checked:false,notFound:false}));
    }
  });
  return sanitizeCategories(Object.entries(cats).map(([name,items])=>({name,items})));
}

// ── ESTILOS BASE ───────────────────────────────────────────────────────────
const inp = (extra={})=>({width:"100%",padding:"13px 16px",border:"2px solid #E5E7EB",borderRadius:18,fontSize:16,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",boxSizing:"border-box",...extra});
const lbl = {fontWeight:800,fontSize:12,color:"#374151",marginBottom:9,display:"block",textTransform:"uppercase",letterSpacing:"0.04em"};
const chip = (sel,bc="#6D28D9",bg="#F5F3FF",tc="#6D28D9")=>({flexShrink:0,padding:"9px 14px",borderRadius:180,border:`2px solid ${sel?bc:"#E5E7EB"}`,background:sel?bg:"white",fontWeight:700,fontSize:13,color:sel?tc:"#6B7280",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"});
const btnG = {width:"100%",padding:16,borderRadius:18,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8};
const btnGr = {padding:"13px 16px",borderRadius:18,background:"#FFFFFF",border:"2px solid #E5E7EB",color:"#4A5568",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit"};
const createCard = {background:"rgba(255,255,255,0.98)",borderRadius:24,padding:18,border:"1px solid #E5E7EB",boxShadow:"0 14px 30px rgba(17,24,39,0.07)",transition:"border-color .25s ease, box-shadow .25s ease, transform .25s ease"};
const createSecondaryBtn = {width:"100%",minHeight:52,padding:"13px 14px",borderRadius:18,background:"#FFFFFF",border:"1.5px solid #E5E7EB",color:"#374151",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 20px rgba(17,24,39,0.06)"};
const createPrimaryBtn = {width:"100%",minHeight:58,padding:"16px 18px",borderRadius:22,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontWeight:900,fontSize:17,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 16px 34px rgba(109,40,217,0.30)"};
const qBtn = {width:44,height:44,borderRadius:"50%",border:"2px solid #E5E7EB",background:"#FFFFFF",fontSize:22,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"};

function ModalSheet({onClose,children}){
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.46)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:"max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom))",overflowY:"auto",overscrollBehavior:"contain",touchAction:"manipulation"}}>
      <div style={{background:"#FFFFFF",borderRadius:24,padding:"20px",width:"100%",maxWidth:420,maxHeight:"calc(100dvh - 32px)",overflowY:"auto",WebkitOverflowScrolling:"touch",boxShadow:"0 24px 70px rgba(17,24,39,0.24)",border:"1px solid rgba(229,231,235,0.95)"}}>
        {children}
      </div>
    </div>
  );
}


// ── Leitura inteligente de lista por foto (impresso/manuscrito) ──────────
// Usa a função segura /api/anthropic com visão. É muito mais confiável para
// lista manuscrita do que OCR local puro.
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem"));
    reader.readAsDataURL(file);
  });
}

// ── PARSER PROFISSIONAL DE VOZ ───────────────────────────────────────────
// Normaliza a fala antes de salvar: impede medidas soltas como "5 kg" de virarem itens.
function decimalToBrazilianString(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return Number.isInteger(num) ? String(num) : String(num).replace(".", ",");
}

function normalizeCompoundWeightAndVolumePhrases(value) {
  const numberWords = [
    "zero","meio","meia","um","uma","dois","duas","três","tres","quatro","cinco","seis","sete","oito","nove","dez",
    "onze","doze","treze","quatorze","catorze","quinze","dezesseis","dezessete","dezoito","dezenove","vinte",
    "trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa","cem","cento","duzento","duzentos","duzentas",
    "trezento","trezentos","trezentas","quatrocento","quatrocentos","quatrocentas","quinhento","quinhentos","quinhentas","seiscento","seiscentos","seiscentas",
    "setecento","setecentos","setecentas","oitocento","oitocentos","oitocentas","novecento","novecentos","novecentas","mil"
  ].join("|");
  const qty = `(?:\\d+[,.]?\\d*|${numberWords})`;
  const toBR = (num) => decimalToBrazilianString(Math.round(Number(num) * 1000) / 1000);
  const parse = (v) => numberFromPortuguese(v);

  let text = String(value || "");

  // "1 quilo e 200 gramas de picanha" => "1,2 kg de picanha".
  text = text.replace(new RegExp(`\\b(${qty})\\s*(?:kg|quilo|quilos)\\s+e\\s+(${qty})\\s*(?:g|grama|gramas)\\b(?:\\s+de)?`, "gi"), (full, kgPart, gPart) => {
    const kg = parse(kgPart);
    const grams = parse(gPart);
    if (kg == null || grams == null) return full;
    return `${toBR(kg + grams / 1000)} kg de`;
  });

  // "2 quilos e cem de costela" => "2,1 kg de costela".
  text = text.replace(new RegExp(`\\b(${qty})\\s*(?:kg|quilo|quilos)\\s+e\\s+(${qty})\\s+de\\s+([^,.;]+)`, "gi"), (full, kgPart, gPart, product) => {
    const kg = parse(kgPart);
    const grams = parse(gPart);
    if (kg == null || grams == null || grams <= 0 || grams >= 1000) return full;
    return `${toBR(kg + grams / 1000)} kg de ${String(product || "").trim()}`;
  });

  // "oitocentos de beterraba" / "800 de carne" => "0,8 kg de beterraba/carne".
  text = text.replace(new RegExp(`\\b(${qty})\\s+de\\s+([^,.;]+)`, "gi"), (full, gPart, product) => {
    const grams = parse(gPart);
    const productText = String(product || "").trim();
    if (grams == null || grams < 100 || grams >= 1000 || !productText) return full;
    return `${toBR(grams / 1000)} kg de ${productText}`;
  });

  // "700 gramas de batata" => "0,7 kg de batata".
  text = text.replace(new RegExp(`\\b(${qty})\\s*(?:g|grama|gramas)\\b(?:\\s+de)?`, "gi"), (full, gPart) => {
    const grams = parse(gPart);
    if (grams == null || grams >= 1000) return full;
    return `${toBR(grams / 1000)} kg de`;
  });

  // "2 litros e 500 ml de refrigerante" => "2,5 L de refrigerante".
  text = text.replace(new RegExp(`\\b(${qty})\\s*(?:l|litro|litros)\\s+e\\s+(${qty})\\s*(?:ml|mililitro|mililitros)\\b(?:\\s+de)?`, "gi"), (full, lPart, mlPart) => {
    const liters = parse(lPart);
    const ml = parse(mlPart);
    if (liters == null || ml == null) return full;
    return `${toBR(liters + ml / 1000)} L de`;
  });

  text = text.replace(new RegExp(`\\b(${qty})\\s*(?:ml|mililitro|mililitros)\\b(?:\\s+de)?`, "gi"), (full, mlPart) => {
    const ml = parse(mlPart);
    if (ml == null || ml >= 1000) return full;
    return `${toBR(ml / 1000)} L de`;
  });

  return text.replace(/\bde\s+de\b/gi, "de").replace(/\s+/g, " ").trim();
}

function normalizeSpokenDecimalPhrases(value) {
  const qtyWord = "(?:zero|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|\\d+)";
  const decimalWord = "(?:zero|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|\\d+)";
  return normalizeCompoundWeightAndVolumePhrases(String(value || ""))
    .replace(/(\d+)\s*[,\.]\s*(\d+)/g, "$1,$2")
    .replace(new RegExp(`\\b(${qtyWord})\\s*(?:v[ií]rgula|virgula|ponto)\\s*(${decimalWord})\\b`, "gi"), (full, a, b) => {
      const left = numberFromPortuguese(a);
      const right = numberFromPortuguese(b);
      if ((!left && left !== 0) || (!right && right !== 0)) return full;
      return `${decimalToBrazilianString(left)},${String(right).replace(/^0+/, "") || "0"}`;
    })
    .replace(/\b(um|uma)\s+(?:quilo|kg)\s+e\s+mei[ao]\b/gi, "1,5 kg")
    .replace(/\b(dois|duas)\s+(?:quilos|kg)\s+e\s+mei[ao]\b/gi, "2,5 kg")
    .replace(/\b(tr[eê]s)\s+(?:quilos|kg)\s+e\s+mei[ao]\b/gi, "3,5 kg")
    .replace(/\b(um|uma)\s+(?:litro|l)\s+e\s+mei[ao]\b/gi, "1,5 L")
    .replace(/\b(dois|duas)\s+(?:litros|l)\s+e\s+mei[ao]\b/gi, "2,5 L")
    .replace(/\bmei[ao]\s+(?:quilo|kg)\b/gi, "0,5 kg")
    .replace(/\bmei[ao]\s+(?:litro|l)\b/gi, "0,5 L")
    .replace(/(\d+)\s*,\s*(\d+)/g, "$1,$2");
}

function dedupeMeasureText(value) {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  const seen = new Set();
  return raw
    .split(/\s+/)
    .filter((part) => {
      const key = part.toLowerCase();
      if (/^\d+(?:[,.]\d+)?(?:kg|g|l|ml)$/i.test(key)) {
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    })
    .join(" ")
    .trim();
}

function normalizeMeasureToken(value) {
  let raw = normalizeSpokenDecimalPhrases(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  raw = raw.replace(/(\d+)\s*,\s*(\d+)/g, "$1,$2");
  const qty = "(?:0[,\\.]5|1[,\\.]5|2[,\\.]5|\\d+[,\\.]?\\d*|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte)";
  const unit = "(?:kg|quilo|quilos|g|grama|gramas|l|litro|litros|ml|mililitro|mililitros)";
  const m = raw.match(new RegExp(`^(${qty})\\s*(${unit})$`, "i"));
  if (!m) return "";
  const n = numberFromPortuguese(m[1]);
  const u = normalizeUnitValue(m[2]);
  if (!n || !u) return "";
  return `${decimalToBrazilianString(n)}${u}`;
}

function isMeasureOnlyText(value) {
  return Boolean(normalizeMeasureToken(value));
}

function extractMeasureFromText(value) {
  const original = String(value || "").trim();
  if (!original) return { text:"", measure:"" };
  const qty = "(?:0[,\\.]5|1[,\\.]5|2[,\\.]5|\\d+[,\\.]?\\d*|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte)";
  const unit = "(?:kg|quilo|quilos|g|grama|gramas|l|litro|litros|ml|mililitro|mililitros)";
  const re = new RegExp(`(?:\\bde\\s+)?(${qty})\\s*(${unit})\\b`, "i");
  const m = original.match(re);
  if (!m) return { text: original, measure:"" };
  const measure = normalizeMeasureToken(`${m[1]} ${m[2]}`);
  const text = original.replace(m[0], " ").replace(/\s+/g," ").replace(/\b(de|do|da|com)\s*$/i, "").trim();
  return { text, measure };
}

function extractPackInfoFromText(value) {
  const original = String(value || "").trim();
  const re = /\bcom\s+(um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|\d+)\s+(unidades?|un|latas?|garrafas?|long\s+necks?)\b/i;
  const m = original.match(re);
  if (!m) return { text: original, pack:"" };
  const n = numberFromPortuguese(m[1]) || Number(m[1]) || 1;
  const u = normalizeUnitValue(m[2]);
  return {
    text: original.replace(m[0], " ").replace(/\s+/g," ").trim(),
    pack: `com ${decimalToBrazilianString(n)} ${formatUnitForQuantity(n, u)}`,
  };
}

function repairAndNormalizeVoiceItems(items) {
  const repaired = [];
  for (const raw of Array.isArray(items) ? items : []) {
    if (!raw) continue;
    let item = normalizeListItem(raw);
    let name = String(item.name || "").trim();
    let detail = String(item.detail || item.embalagem || "").trim();
    let embalagem = String(item.embalagem || detail || "").trim();

    // Corrige o bug: "5 unidades · Kg" ou "1 unidade · Kg" não é item, é medida do anterior.
    if (isQuantityOnlyItemName(name) || isMeasureOnlyText(name)) {
      const measure = normalizeMeasureToken(`${item.qty || ""} ${name}`) || normalizeMeasureToken(name);
      if (measure && repaired.length) {
        const prev = repaired[repaired.length - 1];
        prev.embalagem = [prev.embalagem, measure].filter(Boolean).join(" ").trim();
        prev.detail = prev.embalagem;
      }
      continue;
    }

    // Se veio como "Arroz 5kg", move 5kg para embalagem.
    const measureResult = extractMeasureFromText(name);
    if (measureResult.measure) {
      name = measureResult.text || name;
      embalagem = [embalagem, measureResult.measure].filter(Boolean).join(" ").trim();
    }

    const detailMeasure = normalizeMeasureToken(detail);
    if (detailMeasure) embalagem = [embalagem, detailMeasure].filter(Boolean).join(" ").trim();

    const packFromName = extractPackInfoFromText(name);
    if (packFromName.pack) {
      name = packFromName.text || name;
      embalagem = [embalagem, packFromName.pack].filter(Boolean).join(" ").trim();
    }
    const packFromDetail = extractPackInfoFromText(detail);
    if (packFromDetail.pack) embalagem = [embalagem, packFromDetail.pack].filter(Boolean).join(" ").trim();

    const plain = normalizePlainText(name);
    const nameFixes = {
      "carne moi":"carne moída",
      "manga tome":"manga tommy",
      "manga tomi":"manga tommy",
      "tomate elefante":"tomate",
      "molho":"molho de tomate",
    };
    if (nameFixes[plain]) name = nameFixes[plain];

    embalagem = dedupeMeasureText(embalagem);
    item = normalizeListItem({ ...item, name, embalagem: embalagem.trim(), detail: embalagem.trim() });
    repaired.push(item);
  }
  return repaired;
}

function parseSpokenShoppingItemsProfessional(text) {
  const qtyWords = "(?:0[,\\.]5|1[,\\.]5|2[,\\.]5|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzento|duzentos|duzentas|trezento|trezentos|trezentas|quatrocento|quatrocentos|quatrocentas|quinhento|quinhentos|quinhentas|seiscento|seiscentos|seiscentas|setecento|setecentos|setecentas|oitocento|oitocentos|oitocentas|novecento|novecentos|novecentas|\\d+[,\\.]?\\d*)";
  const unitWords = "(?:pacotes?|caixas?|fardos?|latas?|garrafas?|unidades?|un|quilos?|kg|gramas?|g|litros?|l|ml|mililitros?|d[uú]zias?|pares?|pe[çc]as?)";
  const productAnchorWords = "(?:arroz|feij[aã]o|macarr[aã]o|leite|detergente|carne|carne mo[ií]da|frango|cerveja|refrigerante|[oó]leo|azeite|a[çc][uú]car|sal|caf[eé]|p[aã]o|queijo|presunto|manteiga|margarina|iogurte|tomate|cebola|alho|batata|cenoura|banana|ma[çc][aã]|laranja|lim[aã]o|alface|manga|pera|p[eê]ra|beterraba|picanha|costela|peixe|salm[aã]o|lingui[çc]a|salsicha|sab[aã]o|amaciante|desinfetante|sabonete|shampoo|condicionador|desodorante|papel|bolacha|biscoito|chocolate|farinha|maionese|ketchup|mostarda|molho|atum|sardinha|milho|ervilha|aveia|pipoca|vinagre|ovos?|pizza|lasanha|sorvete|fralda|absorvente|copo|prato|garfo|faca|colher|guardanapo)";

  let raw = normalizeSpokenDecimalPhrases(text)
    .replace(/(\d+)\s*,\s*(\d+)/g, "$1§DECIMAL§$2")
    .replace(/(\d+)\s*\.\s*(\d+)/g, "$1§DECIMAL§$2")
    .replace(/\b(?:quero|preciso|comprar|coloca|coloque|adiciona|adicione|por favor)\b/gi, " ")
    .replace(/\b(?:mais|tamb[eé]m|a[ií]|depois)\b/gi, ",")
    .replace(new RegExp(`\\s+e\\s+(?=(${qtyWords})\\b)`, "gi"), ", ")
    .replace(/[.;\n]+/g, ",")
    .replace(/\s+/g, " ")
    .trim();

  raw = raw.replace(new RegExp(`\\s+(${qtyWords})\\s+(${unitWords})\\s+(?=[a-záéíóúãõç])`, "gi"), ", $1 $2 ");
  raw = raw.replace(new RegExp(`\\s+(${qtyWords})\\s+de\\s+(?=${productAnchorWords}\\b)`, "gi"), ", $1 de ");

  const chunks = raw
    .split(/\s*,\s*/)
    .map(v => v.replace(/§DECIMAL§/g, ",").trim())
    .filter(Boolean);

  const items = [];
  for (let c of chunks) {
    c = String(c || "")
      .replace(/^(?:e|de|do|da|dos|das|mais|tamb[eé]m|a[ií])\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!c) continue;

    let qty = 1, unit = "unidade", embalagem = "", marca = "", tipo = "";

    let m = c.match(new RegExp(`^(${qtyWords})\\s+de\\s+(.+)$`, "i"));
    if (m) {
      const grams = numberFromPortuguese(m[1]);
      if (Number.isFinite(grams) && grams >= 100 && grams < 1000) {
        qty = Number((grams / 1000).toFixed(2));
        unit = "kg";
        c = m[2].trim();
      }
    }

    if (unit === "unidade") {
      m = c.match(new RegExp(`^(${qtyWords})\\s+(${unitWords})(?:\\s+de)?\\s+(.+)$`, "i"));
      if (m) {
        qty = numberFromPortuguese(m[1]) || 1;
        unit = normalizeUnitValue(m[2]);
        c = m[3].trim();
      } else if ((m = c.match(new RegExp(`^(${qtyWords})\\s+(.+)$`, "i")))) {
        const parsedQty = numberFromPortuguese(m[1]);
        if (Number.isFinite(parsedQty) && parsedQty >= 100 && parsedQty < 1000) {
          qty = Number((parsedQty / 1000).toFixed(3));
          unit = "kg";
        } else {
          qty = parsedQty || 1;
        }
        c = m[2].trim();
      }
    }

    const pack = extractPackInfoFromText(c);
    c = pack.text;
    if (pack.pack) embalagem = pack.pack;

    const measure = extractMeasureFromText(c);
    c = measure.text || c;
    if (measure.measure) embalagem = [embalagem, measure.measure].filter(Boolean).join(" ");

    c = c
      .replace(/^(?:e|de|do|da|dos|das|mais|tamb[eé]m|a[ií])\s+/i, "")
      .replace(/\b(?:de|do|da|dos|das|com)\s*$/i, "")
      .replace(/\b(?:e\s+)?(?:cem|cento|duzento|duzentos|duzentas|trezento|trezentos|trezentas|quatrocento|quatrocentos|quatrocentas|quinhento|quinhentos|quinhentas|seiscento|seiscentos|seiscentas|setecento|setecentos|setecentas|oitocento|oitocentos|oitocentas|novecento|novecentos|novecentas)\s+de\s+/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (/\bheineken\b/i.test(c)) { marca = "Heineken"; c = c.replace(/\bheineken\b/ig, " "); }
    if (/\blong\s+neck\b/i.test(c)) { tipo = "Long neck"; c = c.replace(/\blong\s+neck\b/ig, " "); }

    const name = normalizeProductName(c.replace(/\s+/g," ").trim());
    if (name && !isQuantityOnlyItemName(name)) {
      items.push(normalizeListItem({ name, marca, tipo, embalagem, detail:embalagem, qty, unit, price:null, checked:false, notFound:false }));
    }
  }

  return repairAndNormalizeVoiceItems(items);
}

async function aiParseShoppingTextProfessional(text, type = "mercado") {
  const cleanText = normalizeSpokenDecimalPhrases(String(text || "")).trim();
  if (!cleanText) return [];

  // Entrada por voz: parser determinístico primeiro para preservar decimais.
  // Evita que IA/transcrição transforme 1,5 kg ou 2,5 kg em 5 kg.
  const localItems = parseSpokenShoppingItemsProfessional(cleanText);
  if (localItems.length) return localItems;

  const typeName = TYPE_NAMES[type] || "geral";
  const prompt = [
    "Você é um parser profissional de listas de compras ditadas em português do Brasil.",
    "Retorne APENAS JSON válido, sem markdown, no formato:",
    '{"items":[{"name":"Arroz","qty":1,"unit":"pacote","marca":"","tipo":"","peso":"5kg","volume":"","embalagem":"5kg"}]}',
    "Regras rígidas:",
    "- Cada produto citado deve virar um item. Não crie item para kg, ml, litros, unidades ou 'com 24 unidades'.",
    "- '1,5 kg de carne' => qty 1.5, unit 'kg', name 'Carne'. Nunca transforme 1,5 em 5.",
    "- '1 quilo e 200 gramas de picanha' => um único item: name 'Picanha', qty 1.2, unit 'kg'. Nunca gere '1 unidade de picanha' + '200g de picanha'.",
    "- '700 gramas de batata' => um único item: name 'Batata', qty 0.7, unit 'kg'.",
    "- '2 litros e 500 ml de refrigerante' => um único item: qty 2.5, unit 'L'.",
    "- '1 pacote arroz 5kg' => name 'Arroz', qty 1, unit 'pacote', embalagem '5kg'.",
    "- '2 fardos cerveja Heineken long neck com 24 unidades' => name 'Cerveja', qty 2, unit 'fardo', marca 'Heineken', tipo 'Long neck', embalagem 'com 24 unidades'.",
    "- Manga, pera, maçã, banana, tomate, batata, cenoura e similares são produtos de hortifruti na categorização.",
    "- name não deve conter quantidade, unidade, kg, g, L, ml, pacote, caixa ou fardo.",
    "- Não invente sugestões; use apenas itens citados.",
    `Tipo de lista: ${typeName}`,
    "TEXTO:", cleanText,
  ].join("\n");
  try {
    const parsed = await callAnthropicJSON({ prompt, model: ANTHROPIC_MODEL_ORGANIZE, maxTokens: 1600 });
    const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
    const cleaned = repairAndNormalizeVoiceItems(rawItems.map((item) => normalizeListItem({
      name: item?.name || item?.nome || "",
      marca: String(item?.marca || "").trim(),
      tipo: String(item?.tipo || "").trim(),
      embalagem: String(item?.embalagem || item?.peso || item?.volume || "").trim(),
      detail: String(item?.embalagem || item?.peso || item?.volume || "").trim(),
      qty: Number(String(item?.qty || item?.quantidade || 1).replace(",", ".")) || 1,
      unit: item?.unit || item?.unidade || "unidade",
      price:null, checked:false, notFound:false,
    }))).filter(item => item.name && !isQuantityOnlyItemName(item.name));
    if (cleaned.length) return cleaned;
  } catch (err) {
    console.warn("Parser IA falhou; usando parser local profissional.", err);
  }
  return parseSpokenShoppingItemsProfessional(cleanText);
}


function normalizeOcrText(text) {
  return String(text || "")
    .replace(/[|]/g, "I")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 1)
    .map((line) => line.replace(/^[\s•·\-–—_*]+/, "").replace(/^\d+[.)-]\s*/, "").trim())
    .filter((line) => line && !/^total\b|^subtotal\b|^data\b|^mercado\b/i.test(line))
    .join("\n");
}

function photoItemsToText(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const qty = item?.qty || item?.quantidade || 1;
      const unit = normalizeUnitValue(item?.unit || item?.unidade || "unidade");
      const name = normalizeProductName(item?.name || item?.nome || "");
      if (!name) return "";
      return `${qty} ${unit} ${name}`.trim();
    })
    .filter(Boolean)
    .join("\n");
}

async function readShoppingListFromImage(file) {
  const dataUrl = await fileToDataUrl(file);
  const [meta, base64] = dataUrl.split(",");
  const mediaType = (meta.match(/data:(.*?);base64/) || [])[1] || file.type || "image/jpeg";

  const prompt = [
    "Você é um leitor de listas de compras em português do Brasil.",
    "Leia a foto enviada, mesmo que a lista esteja manuscrita.",
    "Extraia apenas os itens de compra, ignorando linhas de caderno, cabeçalho, dias da semana, data e rabiscos.",
    "Corrija erros óbvios de leitura manuscrita quando o contexto indicar produto comum de mercado.",
    "Retorne APENAS JSON válido, sem markdown, neste formato:",
    '{"items":[{"name":"arroz","qty":2,"unit":"pacote"}]}',
    "Regras:",
    "- qty deve ser número;",
    "- unit deve ser unidade, pacote, kg, g, L, ml, caixa, lata, garrafa, fardo, dúzia, par ou peça;",
    "- se a linha disser '2 pacote de arroz', retorne qty 2, unit pacote, name arroz;",
    "- se a linha disser '2kg de carne', retorne qty 2, unit kg, name carne;",
    "- não invente itens que não estejam na imagem.",
  ].join("\n");

  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      model: ANTHROPIC_MODEL_VISION,
      maxTokens: 900,
      image: { mediaType, data: base64 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Erro na leitura por imagem (${res.status}) ${detail.slice(0, 180)}`);
  }

  const data = await res.json();
  const parsed = data?.json || extractJsonObject(data?.text || "");
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  return photoItemsToText(items);
}

const DELETED_LIST_KEYS_STORAGE = "tnl_deleted_list_keys";

function normalizeDeletedKeyPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDeletedListStorageKeys() {
  const keys = [DELETED_LIST_KEYS_STORAGE];
  const userId = getAppUserId();
  const userName = getAppUserName();
  const deviceId = getAppDeviceId();

  if (userId) keys.push(`${DELETED_LIST_KEYS_STORAGE}:user:${normalizeDeletedKeyPart(userId)}`);
  if (userName) keys.push(`${DELETED_LIST_KEYS_STORAGE}:name:${normalizeDeletedKeyPart(userName)}`);
  if (deviceId) keys.push(`${DELETED_LIST_KEYS_STORAGE}:device:${normalizeDeletedKeyPart(deviceId)}`);

  return Array.from(new Set(keys));
}

function readDeletedListKeysFrom(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey) || "[]";
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getDeletedListKeys() {
  const merged = new Set();
  getDeletedListStorageKeys().forEach(storageKey => {
    readDeletedListKeysFrom(storageKey).forEach(key => merged.add(key));
  });
  return merged;
}

function saveDeletedListKeys(keys) {
  const arr = Array.from(keys).filter(Boolean);
  for (const storageKey of getDeletedListStorageKeys()) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(arr));
    } catch {
      // Ignora bloqueios pontuais de armazenamento local.
    }
  }
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
  // Chaves por nome/título sem data causavam exclusão em lote quando havia listas com o mesmo nome.
  // Agora elas só entram com data de criação como complemento de segurança.
  if (createdPart && listOrId.user_id && listOrId.title) keys.push(`user:${String(listOrId.user_id)}:${normalizeDeletedKeyPart(listOrId.title)}:${createdPart}`);
  if (createdPart && listOrId.userId && listOrId.name) keys.push(`user:${String(listOrId.userId)}:${normalizeDeletedKeyPart(listOrId.name)}:${createdPart}`);
  if (createdPart && data?.userId && data?.name) keys.push(`user:${String(data.userId)}:${normalizeDeletedKeyPart(data.name)}:${createdPart}`);
  if (createdPart && listOrId.remetente && listOrId.title) keys.push(`owner:${normalizeDeletedKeyPart(listOrId.remetente)}:${normalizeDeletedKeyPart(listOrId.title)}:${createdPart}`);
  if (createdPart && listOrId.ownerName && listOrId.name) keys.push(`owner:${normalizeDeletedKeyPart(listOrId.ownerName)}:${normalizeDeletedKeyPart(listOrId.name)}:${createdPart}`);

  return Array.from(new Set(keys.filter(Boolean)));
}

function markListAsDeletedLocally(list) {
  const keys = getDeletedListKeys();
  getListPersistenceKeys(list).forEach(key => keys.add(key));
  saveDeletedListKeys(keys);
}

function wasListDeletedLocally(list) {
  const deleted = getDeletedListKeys();
  return getListPersistenceKeys(list).some(key => deleted.has(key));
}

function isSharedRecordHiddenForCurrentUser(record) {
  const data = record?.data && typeof record.data === "object" ? record.data : {};
  const deviceId = getAppDeviceId();
  const userId = getAppUserId();
  const userName = String(getAppUserName() || "").trim().toLowerCase();
  const hiddenDevices = Array.isArray(data.hiddenForDeviceIds) ? data.hiddenForDeviceIds : [];
  const hiddenUsers = Array.isArray(data.hiddenForUserIds) ? data.hiddenForUserIds : [];
  const hiddenNames = Array.isArray(data.hiddenForNames) ? data.hiddenForNames.map(v => String(v).trim().toLowerCase()) : [];

  return Boolean(
    data.isDeleted ||
    data.deletedAt ||
    data.status === "deleted" ||
    (deviceId && hiddenDevices.includes(deviceId)) ||
    (userId && hiddenUsers.includes(userId)) ||
    (userName && hiddenNames.includes(userName)) ||
    wasListDeletedLocally(record)
  );
}


function getListIdentityKey(list) {
  if (!list) return "";
  const data = list.data && typeof list.data === "object" ? list.data : null;
  const id = data?.id || list.id || "";
  // data.id/list.id é a identidade real da lista. sharedId/record.id muda quando o bug cria duplicatas no Supabase.
  if (id) return `id:${String(id)}`;
  const created = data?.createdAt || data?.created_at || list.createdAt || list.created_at || "";
  const owner = data?.userId || list.userId || list.user_id || data?.ownerName || data?.remetente || list.ownerName || list.remetente || "";
  const name = data?.name || list.name || list.title || "";
  return ["fallback", owner, name, created].map(v => String(v || "").trim().toLowerCase()).join(":");
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

function mergeUniqueLists(items) {
  const source = Array.isArray(items) ? items : [];
  const map = new Map();
  for (const list of source) {
    if (!list || wasListDeletedLocally(list)) continue;
    const key = getListIdentityKey(list) || `random:${Math.random()}`;
    const prev = map.get(key);
    if (!prev || getListComparableStamp(list) >= getListComparableStamp(prev)) {
      map.set(key, list);
    }
  }
  return Array.from(map.values()).sort((a,b)=>getListComparableStamp(b)-getListComparableStamp(a));
}
// ══════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════


// ── ETAPA 4.5: proteção final para conversão de gramas na lista falada ──
// Regra: 100g = 0,1kg; 200g = 0,2kg; 900g = 0,9kg.
// Também corrige casos residuais como 1,001kg quando a fala foi "1 quilo e 100 gramas".
function normalizeVoiceKgQuantityFinal(value) {
  const n = Number(String(value || "").replace(",", "."));
  if (!Number.isFinite(n)) return value;

  // Corrige escala incorreta: 1,001 -> 1,1 | 2,001 -> 2,1
  const integerPart = Math.trunc(n);
  const decimal = n - integerPart;

  if (integerPart >= 1 && decimal > 0 && decimal < 0.01) {
    const correctedDecimal = Math.round(decimal * 100000) / 1000;
    return Number((integerPart + correctedDecimal).toFixed(2));
  }

  if (n > 0 && n < 0.01) {
    return Number((n * 100).toFixed(2));
  }

  return Number(n.toFixed(2));
}

function gramsToKgFinal(grams) {
  const g = Number(String(grams || "").replace(/\D/g, ""));
  if (!Number.isFinite(g) || g <= 0) return 0;
  return Number((g / 1000).toFixed(2));
}



// ── ETAPA 6: Histórico de preços e estatísticas ───────────────────────────
// Mantém histórico local por usuário/dispositivo. Futuramente pode migrar para Supabase.
const PRICE_HISTORY_KEY = "tnl_price_history_v1";

function normalizePriceItemName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readPriceHistory() {
  try {
    const raw = localStorage.getItem(PRICE_HISTORY_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function savePriceHistory(history) {
  try {
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(Array.isArray(history) ? history.slice(-1000) : []));
  } catch {
    // ignora indisponibilidade local
  }
}

function addPriceHistoryEntry({ itemName, unitPrice, totalPrice, quantity, unit, listType, listName, listId, itemId, recordedAt }) {
  const cleanName = String(itemName || "").trim();
  const price = Number(unitPrice || totalPrice || 0);
  if (!cleanName || !Number.isFinite(price) || price <= 0) return null;

  const entry = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `price-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    itemName: cleanName,
    itemKey: normalizePriceItemName(cleanName),
    unitPrice: Number(price.toFixed(2)),
    totalPrice: Number(Number(totalPrice || price).toFixed(2)),
    quantity: Number(quantity || 1),
    unit: unit || "unidade",
    listType: listType || "geral",
    listName: listName || "",
    listId: listId || "",
    itemId: itemId || "",
    createdAt: recordedAt || new Date().toISOString(),
    monthKey: new Date().toISOString().slice(0, 7),
  };

  const history = readPriceHistory();
  history.push(entry);
  savePriceHistory(history);
  return entry;
}

function getPreviousMonthKey(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return d.toISOString().slice(0, 7);
}

function average(values) {
  const nums = values.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getPriceComparison(itemName, currentPrice) {
  const key = normalizePriceItemName(itemName);
  const current = Number(currentPrice || 0);
  if (!key || !Number.isFinite(current) || current <= 0) return null;

  const history = readPriceHistory().filter((h) => h.itemKey === key);
  if (!history.length) {
    return { status: "novo", label: "Sem histórico anterior", percent: 0, previousAverage: 0, currentPrice: current };
  }

  const previousMonth = getPreviousMonthKey();
  const prevMonthEntries = history.filter((h) => h.monthKey === previousMonth);
  const source = prevMonthEntries.length ? prevMonthEntries : history.slice(-10);
  const previousAverage = average(source.map((h) => h.unitPrice || h.totalPrice));
  if (!previousAverage) {
    return { status: "novo", label: "Sem histórico anterior", percent: 0, previousAverage: 0, currentPrice: current };
  }

  const percent = ((current - previousAverage) / previousAverage) * 100;
  const rounded = Number(percent.toFixed(1));

  if (rounded > 5) {
    return { status: "acima", label: `${rounded}% acima do histórico`, percent: rounded, previousAverage, currentPrice: current };
  }
  if (rounded < -5) {
    return { status: "abaixo", label: `${Math.abs(rounded)}% abaixo do histórico`, percent: rounded, previousAverage, currentPrice: current };
  }
  return { status: "estavel", label: "Preço estável", percent: rounded, previousAverage, currentPrice: current };
}




function getPreviousMonthItemComparison(itemName, currentPrice, currentRecordedAt = null, context = {}) {
  const key = normalizePriceItemName(itemName);
  const current = Number(currentPrice || 0);
  if (!key || !Number.isFinite(current) || current <= 0) return null;

  const currentTime = currentRecordedAt ? new Date(currentRecordedAt).getTime() : 0;
  const currentListId = context?.listId || "";
  const currentItemId = context?.itemId || "";

  const history = readPriceHistory()
    .filter((h) => h.itemKey === key)
    .filter((h) => {
      // Nunca comparar o item com o próprio registro da lista atual.
      if (currentListId && h.listId && h.listId === currentListId && currentItemId && h.itemId && h.itemId === currentItemId) return false;
      if (currentListId && h.listId && h.listId === currentListId && !currentItemId) return false;

      // Proteção adicional: se houver data do preço atual, ignora registros simultâneos/posteriores.
      if (currentTime) {
        const ht = new Date(h.createdAt || 0).getTime();
        if (Number.isFinite(ht) && ht >= currentTime - 250) return false;
      }

      return true;
    })
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  if (!history.length) {
    return {
      status: "novo",
      label: "Sem histórico anterior",
      diff: 0,
      percent: 0,
      previousPrice: 0,
      currentPrice: current,
      source: "none",
    };
  }

  const previousMonth = getPreviousMonthKey(new Date(currentRecordedAt || Date.now()));
  const previousMonthEntries = history
    .filter((h) => h.monthKey === previousMonth)
    .map((h) => Number(h.unitPrice || h.totalPrice || 0))
    .filter((n) => Number.isFinite(n) && n > 0);

  let previousPrice = 0;
  let sourceLabel = "última compra";

  if (previousMonthEntries.length) {
    previousPrice = average(previousMonthEntries);
    sourceLabel = "mês anterior";
  } else {
    const last = history.find((h) => Number(h.unitPrice || h.totalPrice || 0) > 0);
    previousPrice = Number(last?.unitPrice || last?.totalPrice || 0);
    sourceLabel = "última compra";
  }

  if (!previousPrice) {
    return {
      status: "novo",
      label: "Sem histórico anterior",
      diff: 0,
      percent: 0,
      previousPrice: 0,
      currentPrice: current,
      source: "none",
    };
  }

  const diff = Number((current - previousPrice).toFixed(2));
  const abs = Math.abs(diff);
  const percent = previousPrice ? Number(((diff / previousPrice) * 100).toFixed(1)) : 0;
  const absPercent = Math.abs(percent);
  const pctLabel = `${diff > 0 ? "+" : diff < 0 ? "-" : ""}${absPercent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

  if (abs < 0.01) {
    return {
      status: "estavel",
      label: `Mesmo preço da ${sourceLabel}`,
      diff: 0,
      percent: 0,
      previousPrice,
      currentPrice: current,
      source: sourceLabel,
    };
  }

  if (diff > 0) {
    return {
      status: "acima",
      label: `${diff.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} mais caro que a ${sourceLabel} (${pctLabel})`,
      diff,
      percent,
      previousPrice,
      currentPrice: current,
      source: sourceLabel,
    };
  }

  return {
    status: "abaixo",
    label: `${abs.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} mais barato que a ${sourceLabel} (${pctLabel})`,
    diff,
    percent,
    previousPrice,
    currentPrice: current,
    source: sourceLabel,
  };
}

function PriceMonthBadge({ itemName, price, compact = false, recordedAt = null, listId = "", itemId = "" }) {
  const comparison = getPreviousMonthItemComparison(itemName, price, recordedAt, { listId, itemId });
  if (!comparison) return null;

  const colors = {
    acima: { bg:"#FEE2E2", color:"#991B1B", icon:"↑" },
    abaixo: { bg:"#DCFCE7", color:"#166534", icon:"↓" },
    estavel: { bg:"#FEF3C7", color:"#92400E", icon:"→" },
    novo: { bg:"#EDE9FE", color:"#5B21B6", icon:"i" },
  };
  const c = colors[comparison.status] || colors.novo;
  const label = compact
    ? String(comparison.label || "")
        .replace(" que a última compra", "")
        .replace(" que o mês anterior", "")
        .replace("Mesmo preço da última compra", "Mesmo preço")
    : comparison.label;

  return (
    <div style={{
      marginTop:compact?5:8,
      padding:compact?"0":"8px 10px",
      borderRadius:compact?0:12,
      background:compact?"transparent":c.bg,
      color:c.color,
      fontSize:compact?11:12,
      fontWeight:compact?800:900,
      display:"inline-flex",
      alignItems:"center",
      gap:5,
      maxWidth:"100%",
      lineHeight:1.25,
      flexWrap:"wrap"
    }}>
      <span style={{fontWeight:900}}>{c.icon}</span>
      <span>{label}</span>
      {!compact && comparison.previousPrice ? (
        <span style={{opacity:.85}}>
          · mês anterior {comparison.previousPrice.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
        </span>
      ) : null}
    </div>
  );
}

function getItemPriceMemory(itemName) {
  const key = normalizePriceItemName(itemName);
  const history = readPriceHistory()
    .filter((h) => h.itemKey === key)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  if (!history.length) return null;
  const last = history[0];
  const avg = average(history.slice(0, 10).map((h) => h.unitPrice || h.totalPrice));
  return {
    lastPrice: Number(last.unitPrice || last.totalPrice || 0),
    averagePrice: Number((avg || 0).toFixed(2)),
    lastDate: last.createdAt,
    count: history.length,
  };
}

function PriceMemoryLine({ itemName }) {
  const memory = getItemPriceMemory(itemName);
  if (!memory) return null;
  return (
    <div style={{fontSize:11,color:"#6B7280",marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
      <span>Última: <strong>{memory.lastPrice.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></span>
      {memory.averagePrice ? <span>· Média: <strong>{memory.averagePrice.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></span> : null}
    </div>
  );
}



function getStatsComparableDate(value) {
  const t = value ? new Date(value).getTime() : 0;
  return Number.isFinite(t) && t > 0 ? t : 0;
}

function getStatsListOrderStamp(list, fallbackIndex = 0) {
  const candidates = [
    list?.statsSequence,
    list?.listSequence,
    list?.sequence,
    list?.finishedAt,
    list?.completedAt,
    list?.createdAt,
    list?.updatedAt,
    list?.lastLocalUpdateAt,
    list?.lastSyncedAt,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const t = getStatsComparableDate(value);
    if (t) return t;
  }
  return fallbackIndex + 1;
}

function getStatsListKey(list) {
  return String(list?.id || list?.sharedId || list?.name || "").trim();
}

function getStatsOrderedLists(sourceLists = []) {
  return (Array.isArray(sourceLists) ? sourceLists : [])
    .filter((list) => list && Array.isArray(list.categories))
    .map((list, index) => ({
      ...list,
      __statsOriginalIndex: index,
      __statsOrder: getStatsListOrderStamp(list, index),
    }))
    .sort((a, b) => {
      const ao = Number(a.__statsOrder || 0);
      const bo = Number(b.__statsOrder || 0);
      if (ao !== bo) return ao - bo;
      return Number(a.__statsOriginalIndex || 0) - Number(b.__statsOriginalIndex || 0);
    });
}

function getStatsListLabel(list, index = 0) {
  const name = String(list?.name || "Lista").trim() || "Lista";
  return `${index + 1}. ${name}`;
}

function getPriceStatsSummary(sourceLists = []) {
  const history = readPriceHistory();
  if (!history.length) {
    return {
      totalRecords: 0,
      averageTicket: 0,
      topIncreases: [],
      monthlyTotals: [],
      itemAnalysis: [],
      smartInsights: [],
      categoryTotals: [],
      priceSeries: [],
      budgetSeries: [],
      categorySeries: [],
      annualTotals: [],
    };
  }

  const orderedListsForStats = getStatsOrderedLists(sourceLists);
  const listOrderByKey = new Map();
  orderedListsForStats.forEach((list, index) => {
    const keys = [getStatsListKey(list), list?.id, list?.sharedId, list?.name].filter(Boolean).map(String);
    keys.forEach((key) => {
      if (key && !listOrderByKey.has(key)) {
        listOrderByKey.set(key, { order: index + 1, label: getStatsListLabel(list, index), stamp: list.__statsOrder });
      }
    });
  });

  const validHistory = history
    .map((h) => ({
      ...h,
      unitPrice: Number(h.unitPrice || h.totalPrice || 0),
      totalPrice: Number(h.totalPrice || h.unitPrice || 0),
      quantity: Number(h.quantity || 1),
      createdAt: h.createdAt || new Date().toISOString(),
      monthKey: h.monthKey || String(h.createdAt || new Date().toISOString()).slice(0, 7),
      statsListOrder: listOrderByKey.get(String(h.listId || ""))?.order || listOrderByKey.get(String(h.listName || ""))?.order || 0,
      statsListLabel: listOrderByKey.get(String(h.listId || ""))?.label || listOrderByKey.get(String(h.listName || ""))?.label || h.listName || "Lista",
    }))
    .filter((h) => h.itemKey && Number.isFinite(h.unitPrice) && h.unitPrice > 0);

  const byMonth = new Map();
  validHistory.forEach((h) => {
    const k = h.monthKey || String(h.createdAt || "").slice(0, 7);
    byMonth.set(k, (byMonth.get(k) || 0) + Number(h.totalPrice || 0));
  });

  const monthlyTotals = Array.from(byMonth.entries())
    .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const byItem = new Map();
  validHistory.forEach((h) => {
    if (!byItem.has(h.itemKey)) byItem.set(h.itemKey, []);
    byItem.get(h.itemKey).push(h);
  });

  const itemAnalysis = Array.from(byItem.values())
    .map((entries) => {
      const ordered = entries
        .slice()
        .sort((a, b) => {
          const ao = Number(a.statsListOrder || 0);
          const bo = Number(b.statsListOrder || 0);
          if (ao && bo && ao !== bo) return ao - bo;
          return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
        });
      const prices = ordered.map((h) => Number(h.unitPrice || h.totalPrice || 0)).filter((n) => Number.isFinite(n) && n > 0);
      if (!prices.length) return null;
      const first = prices[0];
      const last = prices[prices.length - 1];
      const avg = average(prices);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const diffFromAvg = last - avg;
      const diffPercent = avg ? Number(((diffFromAvg / avg) * 100).toFixed(1)) : 0;
      const trendPercent = first ? Number((((last - first) / first) * 100).toFixed(1)) : 0;
      const totalSpent = ordered.reduce((sum, h) => sum + Number(h.totalPrice || h.unitPrice || 0), 0);
      let status = "estavel";
      let insight = "Preço dentro do padrão histórico";
      if (prices.length === 1) {
        status = "novo";
        insight = "Ainda há apenas um registro deste item";
      } else if (diffPercent > 8) {
        status = "caro";
        insight = "Preço atual acima da média histórica";
      } else if (diffPercent < -8) {
        status = "barato";
        insight = "Preço atual abaixo da média histórica";
      }
      return {
        itemKey: ordered[ordered.length - 1].itemKey,
        itemName: ordered[ordered.length - 1].itemName,
        count: ordered.length,
        average: Number(avg.toFixed(2)),
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        first: Number(first.toFixed(2)),
        last: Number(last.toFixed(2)),
        diffFromAvg: Number(diffFromAvg.toFixed(2)),
        diffPercent,
        trendPercent,
        totalSpent: Number(totalSpent.toFixed(2)),
        status,
        insight,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count || b.totalSpent - a.totalSpent);

  const topIncreases = itemAnalysis
    .filter((it) => it.count >= 2)
    .map((it) => ({
      itemName: it.itemName,
      first: it.first,
      last: it.last,
      percent: it.trendPercent,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  const byCategory = new Map();
  validHistory.forEach((h) => {
    const category = inferPreferredCategoryForItem({ name: h.itemName }) || "Outros";
    byCategory.set(category, (byCategory.get(category) || 0) + Number(h.totalPrice || h.unitPrice || 0));
  });

  const categoryTotals = Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const priceSeries = Array.from(byItem.values())
    .map((entries) => {
      const ordered = entries
        .slice()
        .sort((a, b) => {
          const ao = Number(a.statsListOrder || 0);
          const bo = Number(b.statsListOrder || 0);
          if (ao && bo && ao !== bo) return ao - bo;
          return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
        });
      if (ordered.length < 2) return null;
      return {
        itemName: ordered[ordered.length - 1].itemName,
        points: ordered.map((h) => {
          const d = new Date(h.createdAt || Date.now());
          return {
            label: h.statsListLabel || h.listName || (Number.isFinite(d.getTime()) ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : (h.monthKey || "")),
            date: Number.isFinite(d.getTime()) ? d.toLocaleDateString("pt-BR") : (h.monthKey || ""),
            listName: h.statsListLabel || h.listName || "Lista",
            value: Number(h.unitPrice || h.totalPrice || 0),
          };
        }).filter((p) => Number.isFinite(p.value) && p.value > 0),
        totalSpent: ordered.reduce((sum, h) => sum + Number(h.totalPrice || h.unitPrice || 0), 0),
      };
    })
    .filter(Boolean)
    .map((series) => {
      const vals = (series.points || []).map((p) => Number(p.value || 0)).filter((n) => Number.isFinite(n));
      const variation = vals.length ? Math.max(...vals) - Math.min(...vals) : 0;
      return { ...series, variation: Number(variation.toFixed(2)) };
    })
    .sort((a, b) => Number(b.variation || 0) - Number(a.variation || 0) || b.totalSpent - a.totalSpent);

  const smartInsights = [];
  const expensive = itemAnalysis.filter((it) => it.status === "caro").sort((a,b)=>b.diffPercent-a.diffPercent).slice(0,3);
  const cheap = itemAnalysis.filter((it) => it.status === "barato").sort((a,b)=>a.diffPercent-b.diffPercent).slice(0,3);
  const heavy = itemAnalysis.slice().sort((a,b)=>b.totalSpent-a.totalSpent).slice(0,3);

  expensive.forEach((it) => smartInsights.push({
    type: "alerta",
    title: `${it.itemName} está acima da média`,
    text: `Último preço ${it.last.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}, média ${it.average.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}.`,
  }));
  cheap.forEach((it) => smartInsights.push({
    type: "oportunidade",
    title: `${it.itemName} está abaixo da média`,
    text: `Último preço ${it.last.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}, média ${it.average.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}.`,
  }));
  if (heavy.length) {
    smartInsights.push({
      type: "impacto",
      title: "Itens com maior impacto financeiro",
      text: heavy.map((it) => it.itemName).join(", "),
    });
  }


  const calcStatsItemTotal = (item) => {
    const explicit = Number(item?.lineTotal ?? item?.total ?? item?.totalPrice ?? item?.subtotal ?? 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const price = Number(item?.price ?? item?.unitPrice ?? 0);
    const qty = Number(item?.qty ?? item?.quantity ?? 1);
    if (!Number.isFinite(price) || price <= 0) return 0;
    return Number((price * (Number.isFinite(qty) && qty > 0 ? qty : 1)).toFixed(2));
  };

  const budgetSeries = orderedListsForStats
    .map((list, index) => {
      const spent = (list.categories || []).reduce((sum, cat) => {
        return sum + (Array.isArray(cat.items) ? cat.items : []).reduce((s, item) => s + calcStatsItemTotal(item), 0);
      }, 0);
      const dateRaw = list.finishedAt || list.updatedAt || list.lastSyncedAt || list.createdAt || "";
      const d = new Date(dateRaw || Date.now());
      const dateLabel = Number.isFinite(d.getTime()) ? d.toLocaleDateString("pt-BR") : "";
      return {
        label: getStatsListLabel(list, index),
        listName: list.name || "Lista",
        date: dateLabel,
        dateRaw: dateRaw || new Date().toISOString(),
        statsOrder: Number(list.__statsOrder || index + 1),
        budget: Number(list.budget || 0),
        spent: Number((Number(list.total || 0) > 0 ? Number(list.total || 0) : spent).toFixed(2)),
      };
    })
    .filter((row) => row.spent > 0 || row.budget > 0)
    .sort((a, b) => Number(a.statsOrder || 0) - Number(b.statsOrder || 0) || String(a.dateRaw || "").localeCompare(String(b.dateRaw || "")))
    .slice(-12);

  const categoryListMap = new Map();
  orderedListsForStats.forEach((list, listIndex) => {
    const listLabel = getStatsListLabel(list, listIndex);
    (list.categories || []).forEach((cat) => {
      const category = cat?.name || "Outros";
      const total = Array.isArray(cat?.items)
        ? cat.items.reduce((sum, item) => sum + calcStatsItemTotal(item), 0)
        : Number(cat?.total || 0);
      if (!categoryListMap.has(category)) categoryListMap.set(category, []);
      categoryListMap.get(category).push({
        label: listLabel,
        date: listLabel,
        listName: list?.name || listLabel,
        value: Number((Number.isFinite(total) ? total : 0).toFixed(2)),
        statsOrder: Number(list.__statsOrder || listIndex + 1),
      });
    });
  });

  const topCategories = Array.from(categoryListMap.entries())
    .map(([category, points]) => ({ category, total: points.reduce((sum, p) => sum + Number(p.value || 0), 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((c) => c.category);

  const categorySeries = topCategories.map((category) => {
    const pointMap = new Map((categoryListMap.get(category) || []).map((p) => [p.label, p]));
    const points = orderedListsForStats.map((list, idx) => {
      const label = getStatsListLabel(list, idx);
      return pointMap.get(label) || {
        label,
        date: label,
        listName: list?.name || label,
        value: 0,
        statsOrder: Number(list.__statsOrder || idx + 1),
      };
    });
    return { itemName: category, name: category, points };
  }).filter((s) => s.points.some((p) => p.value > 0));

  const annualTotals = monthlyTotals.map((m) => ({
    label: m.month,
    date: m.month,
    listName: "Total mensal",
    value: m.total,
  }));

  return {
    totalRecords: validHistory.length,
    averageTicket: Number(average(validHistory.map((h) => h.totalPrice)).toFixed(2)),
    topIncreases,
    monthlyTotals,
    itemAnalysis,
    smartInsights,
    categoryTotals,
    priceSeries,
    budgetSeries,
    categorySeries,
    annualTotals,
  };
}

function PriceInsightBadge({ itemName, price }) {
  const comparison = getPriceComparison(itemName, price);
  if (!comparison) return null;

  const colors = {
    acima: { bg:"#FEE2E2", color:"#991B1B", icon:"🔴" },
    abaixo: { bg:"#DCFCE7", color:"#166534", icon:"🟢" },
    estavel: { bg:"#FEF3C7", color:"#92400E", icon:"🟡" },
    novo: { bg:"#EDE9FE", color:"#5B21B6", icon:"ℹ️" },
  };
  const c = colors[comparison.status] || colors.novo;

  return (
    <div style={{
      marginTop:8,
      padding:"8px 10px",
      borderRadius:12,
      background:c.bg,
      color:c.color,
      fontSize:12,
      fontWeight:800,
      display:"inline-flex",
      alignItems:"center",
      gap:6
    }}>
      <span>{c.icon}</span>
      <span>{comparison.label}</span>
      {comparison.previousAverage ? (
        <span style={{opacity:.8}}>
          · média anterior {comparison.previousAverage.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
        </span>
      ) : null}
    </div>
  );
}



function PriceStatsEntryCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width:"100%",
        boxSizing:"border-box",
        border:"1px solid #E5E7EB",
        background:"#FFFFFF",
        borderRadius:18,
        padding:"14px 16px",
        margin:"18px 0 22px",
        boxShadow:"0 8px 18px rgba(17,24,39,0.05)",
        cursor:"pointer",
        fontFamily:"inherit",
        textAlign:"left",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        gap:12,
        clear:"both"
      }}
    >
      <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
        <div style={{
          width:40,
          height:40,
          borderRadius:14,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          background:"#F5F3FF",
          color:"#5B21B6",
          fontSize:21,
          flexShrink:0
        }}>📊</div>
        <div style={{minWidth:0}}>
          <div style={{
            fontWeight:900,
            color:"#4C1D95",
            fontSize:16,
            lineHeight:1.15,
            whiteSpace:"nowrap",
            overflow:"hidden",
            textOverflow:"ellipsis"
          }}>
            Estatísticas de preços
          </div>
          <div style={{
            fontSize:12,
            color:"#6B7280",
            marginTop:3,
            lineHeight:1.3,
            whiteSpace:"nowrap",
            overflow:"hidden",
            textOverflow:"ellipsis"
          }}>
            Ver análise de variação dos itens comprados
          </div>
        </div>
      </div>
      <div style={{
        width:30,
        height:30,
        borderRadius:12,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        background:"#F9FAFB",
        border:"1px solid #E5E7EB",
        color:"#6D28D9",
        fontWeight:900,
        flexShrink:0,
        fontSize:18
      }}>›</div>
    </button>
  );
}


function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}


function StatsExpandableSection({ id, title, subtitle, openSection, setOpenSection, children }) {
  const isOpen = openSection === id;
  return (
    <div style={{
      background:"#FFFFFF",
      border:"1px solid #E5E7EB",
      borderRadius:24,
      marginBottom:12,
      boxShadow:"0 12px 28px rgba(17,24,39,0.055)",
      overflow:"hidden"
    }}>
      <button
        onClick={() => setOpenSection(isOpen ? null : id)}
        style={{
          width:"100%",
          border:"none",
          background:isOpen ? "linear-gradient(135deg,#F5F3FF,#FFFFFF)" : "#FFFFFF",
          padding:"16px 16px",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          gap:12,
          cursor:"pointer",
          fontFamily:"inherit",
          textAlign:"left"
        }}
      >
        <div style={{minWidth:0}}>
          <div style={{fontSize:16,fontWeight:900,color:"#4C1D95",lineHeight:1.2}}>{title}</div>
          {subtitle ? <div style={{fontSize:12,color:"#6B7280",fontWeight:700,marginTop:4,lineHeight:1.35}}>{subtitle}</div> : null}
        </div>
        <div style={{
          width:32,height:32,borderRadius:12,
          display:"flex",alignItems:"center",justifyContent:"center",
          color:"#6D28D9",background:"#F5F3FF",border:"1px solid #DDD6FE",
          fontWeight:900,transform:isOpen ? "rotate(90deg)" : "rotate(0deg)",transition:"transform .2s"
        }}>›</div>
      </button>
      {isOpen && <div style={{padding:"0 16px 16px"}}>{children}</div>}
    </div>
  );
}

function StatsLineChart({ series = [], emptyText = "Sem dados suficientes.", valueLabel = "Valor" }) {
  const [tooltip, setTooltip] = useState(null);
  const cleanSeries = (Array.isArray(series) ? series : [])
    .map((s) => ({ ...s, points: (Array.isArray(s.points) ? s.points : []).filter((p) => Number.isFinite(Number(p.value))) }))
    .filter((s) => s.points.length);

  const allValues = cleanSeries.flatMap((s) => s.points.map((p) => Number(p.value || 0)));
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const spread = Math.max(max - min, 1);
  const width = 320;
  const height = 138;
  const pad = 18;
  const colors = ["#6D28D9", "#16A34A", "#DC2626", "#2563EB", "#F97316", "#0F766E"];

  if (!cleanSeries.length || cleanSeries.every((s) => s.points.length < 2)) {
    return <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45,padding:"8px 2px"}}>{emptyText}</div>;
  }

  const buildPoints = (points) => points.map((p, idx) => {
    const x = points.length <= 1 ? width / 2 : pad + (idx * (width - pad * 2)) / (points.length - 1);
    const y = height - pad - ((Number(p.value || 0) - min) * (height - pad * 2)) / spread;
    return { ...p, x, y, value:Number(p.value || 0) };
  });

  return (
    <div style={{position:"relative"}}>
      {tooltip && (
        <div style={{
          position:"absolute",
          left:`${Math.min(72, Math.max(8, (tooltip.x / width) * 100))}%`,
          top:8,
          transform:"translateX(-50%)",
          background:"rgba(17,24,39,0.75)",
          backdropFilter:"blur(6px)",
          color:"#FFFFFF",
          borderRadius:14,
          padding:"9px 11px",
          fontSize:12,
          fontWeight:800,
          lineHeight:1.35,
          zIndex:5,
          minWidth:148,
          boxShadow:"0 16px 34px rgba(17,24,39,0.24)"
        }}>
          <div style={{fontWeight:900}}>{tooltip.seriesName}</div>
          <div>{tooltip.date || tooltip.label || ""}</div>
          {tooltip.listName ? <div style={{opacity:.82}}>{tooltip.listName}</div> : null}
          <div style={{marginTop:3,color:"#C4B5FD"}}>{valueLabel}: {formatBRL(tooltip.value)}</div>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} style={{width:"100%",height:160,display:"block",overflow:"visible"}} onClick={(e)=>{ if(e.target.tagName === "svg") setTooltip(null); }}>
        <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="#E5E7EB" strokeWidth="2" />
        <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="#F3F4F6" strokeWidth="2" />
        {cleanSeries.map((s, si) => {
          const pts = buildPoints(s.points);
          const linePath = pts.map((p) => `${p.x},${p.y}`).join(" ");
          const color = s.color || colors[si % colors.length];
          return (
            <g key={`${s.itemName || s.name}-${si}`}>
              <polyline points={linePath} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, pi) => (
                <circle
                  key={pi}
                  cx={p.x}
                  cy={p.y}
                  r="7"
                  fill="#FFFFFF"
                  stroke={color}
                  strokeWidth="4"
                  style={{cursor:"pointer"}}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTooltip({
                      x:p.x,
                      y:p.y,
                      value:p.value,
                      label:p.label,
                      date:p.date,
                      listName:p.listName,
                      seriesName:s.itemName || s.name || "Série"
                    });
                  }}
                />
              ))}
            </g>
          );
        })}
      </svg>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:11,color:"#6B7280",fontWeight:800,marginTop:-2}}>
        {cleanSeries.map((s, si) => (
          <span key={si} style={{display:"inline-flex",alignItems:"center",gap:5}}>
            <span style={{width:9,height:9,borderRadius:999,background:s.color || colors[si % colors.length],display:"inline-block"}} />
            {s.itemName || s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatsDetailList({ rows = [], labelKey = "label", valueKey = "value" }) {
  if (!rows.length) return null;
  return (
    <div style={{display:"grid",gap:7,marginTop:12}}>
      {rows.slice(-8).map((row, idx) => (
        <div key={idx} style={{display:"flex",justifyContent:"space-between",gap:10,background:"#FAFAFA",border:"1px solid #F3F4F6",borderRadius:14,padding:"9px 10px",fontSize:12}}>
          <span style={{fontWeight:900,color:"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row[labelKey] || row.date || row.month || "Registro"}</span>
          <span style={{fontWeight:900,color:"#111827",whiteSpace:"nowrap"}}>{formatBRL(row[valueKey] || row.total || 0)}</span>
        </div>
      ))}
    </div>
  );
}



function AppHeader({ userName, onSwitchUser, onNotifications, unreadCount = 0 }) {
  if (!userName) return null;
  return (
    <div style={{
      position:"sticky",
      top:0,
      zIndex:120,
      width:"100%",
      maxWidth:"100%",
      background:"#FFFFFF",
      borderBottom:"1px solid #E5E7EB",
      paddingTop:"calc(10px + env(safe-area-inset-top, 0px))",
      paddingRight:"max(12px, env(safe-area-inset-right, 0px))",
      paddingBottom:10,
      paddingLeft:"max(12px, env(safe-area-inset-left, 0px))",
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      gap:8,
      boxSizing:"border-box",
      overflow:"hidden",
      flexWrap:"nowrap",
      boxShadow:"0 8px 22px rgba(17,24,39,0.04)"
    }}>
      <div style={{
        fontSize:14,
        fontWeight:900,
        color:"#111827",
        overflow:"hidden",
        textOverflow:"ellipsis",
        whiteSpace:"nowrap",
        paddingRight:6,
        minWidth:0,
        flex:"1 1 auto"
      }}>
        Olá, {userName}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,minWidth:0}}>
        <button onClick={onNotifications} aria-label="Notificações" style={{
          position:"relative",
          border:"1px solid #DDD6FE",
          background:"#F5F3FF",
          color:"#6D28D9",
          borderRadius:999,
          width:34,
          height:34,
          cursor:"pointer",
          fontSize:16,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          boxShadow:"0 8px 18px rgba(109,40,217,0.10)"
        }}>
          🔔
          {unreadCount > 0 && (
            <span style={{
              position:"absolute",
              top:-4,
              right:-4,
              minWidth:17,
              height:17,
              background:"#DC2626",
              color:"#FFF",
              borderRadius:"50%",
              fontSize:10,
              fontWeight:900,
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              border:"2px solid #FFFFFF"
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button onClick={onSwitchUser} style={{
          border:"1px solid #E5E7EB",
          background:"#FFF",
          color:"#6D28D9",
          borderRadius:999,
          padding:"7px 12px",
          fontSize:12,
          fontWeight:900,
          cursor:"pointer",
          fontFamily:"inherit",
          boxShadow:"0 8px 18px rgba(17,24,39,0.06)"
        }}>
          Sair
        </button>
      </div>
    </div>
  );
}

function NotificationsScreen({ notifications = [], onBack, onMarkAllRead }) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  useEffect(() => {
    onMarkAllRead?.();
  }, []);

  const typeMeta = (type) => {
    if (type === "shared-accepted") return { icon: "✅", color: "#047857", bg: "#ECFDF5" };
    if (type === "started") return { icon: "🛒", color: "#6D28D9", bg: "#F5F3FF" };
    if (type === "finished") return { icon: "🏁", color: "#B91C1C", bg: "#FEF2F2" };
    return { icon: "🔔", color: "#374151", bg: "#F9FAFB" };
  };

  const formatNotifTime = (value) => {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#FAF7FF 0%,#FFFFFF 52%,#F9FAFB 100%)",padding:"22px 18px 34px",boxSizing:"border-box",fontFamily:"inherit"}}>
      <div style={{maxWidth:520,width:"100%",margin:"0 auto"}}>
        <div style={{background:"linear-gradient(135deg,#5B21B6,#8B5CF6)",borderRadius:28,padding:"18px 16px",color:"#FFFFFF",boxShadow:"0 18px 44px rgba(109,40,217,0.22)",marginBottom:18}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <button onClick={onBack} style={{width:44,height:44,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.28)",background:"rgba(255,255,255,0.16)",color:"#FFFFFF",fontSize:24,cursor:"pointer",fontFamily:"inherit"}}>←</button>
            <div style={{textAlign:"center",flex:1,minWidth:0}}>
              <div style={{fontSize:24,fontWeight:900,lineHeight:1.1}}>Notificações</div>
              <div style={{fontSize:13,fontWeight:700,opacity:.86,marginTop:5}}>{unreadCount ? `${unreadCount} nova(s) notificação(ões)` : "Tudo em dia"}</div>
            </div>
            <div style={{width:44}} />
          </div>
        </div>

        {!notifications.length ? (
          <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:24,padding:26,textAlign:"center",boxShadow:"0 12px 28px rgba(17,24,39,0.06)"}}>
            <div style={{fontSize:42,marginBottom:8}}>🔔</div>
            <div style={{fontSize:19,fontWeight:900,color:"#111827",marginBottom:6}}>Nenhuma notificação</div>
            <div style={{fontSize:14,color:"#6B7280",lineHeight:1.45}}>As atualizações de listas compartilhadas aparecerão aqui.</div>
          </div>
        ) : (
          <div style={{display:"grid",gap:10}}>
            {notifications.map((n) => {
              const meta = typeMeta(n.type);
              return (
                <div key={n.id} style={{background:"#FFFFFF",border:n.read?"1px solid #E5E7EB":"1.5px solid #C4B5FD",borderRadius:20,padding:14,boxShadow:n.read?"0 8px 18px rgba(17,24,39,0.04)":"0 14px 30px rgba(109,40,217,0.10)",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:38,height:38,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:meta.bg,color:meta.color,fontSize:19,flexShrink:0}}>{meta.icon}</div>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:14,fontWeight:n.read?750:900,color:"#111827",lineHeight:1.35}}>{n.message}</div>
                    <div style={{fontSize:11,fontWeight:800,color:"#6B7280",marginTop:5}}>{formatNotifTime(n.createdAt)}</div>
                  </div>
                  {!n.read && <span style={{width:9,height:9,borderRadius:999,background:"#DC2626",marginTop:5,flexShrink:0}} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


function PriceStatsScreen({ onBack, lists = [] }) {
  const [openSection, setOpenSection] = useState("budget");
  const [productQuery, setProductQuery] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const stats = getPriceStatsSummary(lists);

  const budgetSpentSeries = {
    name:"Gasto real",
    color:"#6D28D9",
    points:(stats.budgetSeries || []).map((p) => ({
      label:p.label,
      date:p.date,
      listName:p.listName,
      value:p.spent
    }))
  };
  const budgetLimitSeries = {
    name:"Orçamento",
    color:"#16A34A",
    points:(stats.budgetSeries || []).filter((p)=>Number(p.budget || 0)>0).map((p) => ({
      label:p.label,
      date:p.date,
      listName:p.listName,
      value:p.budget
    }))
  };

  const normalizeStatsSearch = (value) => normalizeCacheKey(value || "");
  const filteredProductSeries = (stats.priceSeries || []).filter((item) => {
    const q = normalizeStatsSearch(productQuery);
    if (!q) return true;
    return normalizeStatsSearch(item.itemName || item.name).includes(q);
  });
  const productSeriesToShow = showAllProducts ? filteredProductSeries : filteredProductSeries.slice(0, 6);

  const budgetRows = stats.budgetSeries || [];
  const totalSpent = budgetRows.reduce((sum, row) => sum + Number(row.spent || 0), 0);
  const totalBudget = budgetRows.reduce((sum, row) => sum + Number(row.budget || 0), 0);
  const balance = totalBudget - totalSpent;
  const topCategory = (stats.categoryTotals || [])[0];
  const topProductVariation = (stats.priceSeries || [])[0];

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(180deg,#FAF7FF 0%,#FFFFFF 48%,#F9FAFB 100%)",
      padding:"22px 18px 34px",
      boxSizing:"border-box",
      fontFamily:"inherit"
    }}>
      <div style={{maxWidth:760,width:"100%",margin:"0 auto"}}>
        <div style={{
          background:"linear-gradient(135deg,#5B21B6,#8B5CF6)",
          borderRadius:28,
          padding:"20px 18px",
          color:"#FFFFFF",
          boxShadow:"0 18px 44px rgba(109,40,217,0.22)",
          marginBottom:18
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <button onClick={onBack} style={{
              width:44,height:44,borderRadius:"50%",
              border:"1px solid rgba(255,255,255,0.28)",
              background:"rgba(255,255,255,0.16)",
              color:"#FFFFFF",
              fontSize:24,
              cursor:"pointer",
              fontFamily:"inherit"
            }}>←</button>
            <div style={{textAlign:"center",flex:1,minWidth:0}}>
              <div style={{fontSize:24,fontWeight:900,lineHeight:1.1}}>Estatísticas de preços</div>
              <div style={{fontSize:13,fontWeight:700,opacity:.86,marginTop:5}}>Análise por lista, seção e produto</div>
            </div>
            <div style={{width:44}} />
          </div>
        </div>

        {!stats.totalRecords ? (
          <div style={{
            background:"#FFFFFF",
            border:"1px solid #E5E7EB",
            borderRadius:24,
            padding:24,
            textAlign:"center",
            boxShadow:"0 12px 28px rgba(17,24,39,0.06)"
          }}>
            <div style={{fontSize:42,marginBottom:8}}>📊</div>
            <div style={{fontSize:20,fontWeight:900,color:"#111827",marginBottom:6}}>Ainda não há dados suficientes</div>
            <div style={{fontSize:14,color:"#6B7280",lineHeight:1.45}}>
              As estatísticas aparecerão após você registrar preços nos itens comprados.
            </div>
          </div>
        ) : (
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginBottom:12}}>
              <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12,boxShadow:"0 8px 20px rgba(17,24,39,0.04)"}}>
                <div style={{fontSize:11,fontWeight:900,color:"#6B7280",textTransform:"uppercase"}}>Gasto analisado</div>
                <div style={{fontSize:19,fontWeight:950,color:"#111827",marginTop:4}}>{formatBRL(totalSpent)}</div>
              </div>
              <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12,boxShadow:"0 8px 20px rgba(17,24,39,0.04)"}}>
                <div style={{fontSize:11,fontWeight:900,color:"#6B7280",textTransform:"uppercase"}}>Saldo global</div>
                <div style={{fontSize:19,fontWeight:950,color:balance >= 0 ? "#166534" : "#991B1B",marginTop:4}}>{totalBudget ? formatBRL(balance) : "Sem orçamento"}</div>
              </div>
              <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12,boxShadow:"0 8px 20px rgba(17,24,39,0.04)"}}>
                <div style={{fontSize:11,fontWeight:900,color:"#6B7280",textTransform:"uppercase"}}>Seção de maior peso</div>
                <div style={{fontSize:15,fontWeight:950,color:"#111827",marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{topCategory ? `${topCategory.category} · ${formatBRL(topCategory.total)}` : "Sem seção"}</div>
              </div>
              <div style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12,boxShadow:"0 8px 20px rgba(17,24,39,0.04)"}}>
                <div style={{fontSize:11,fontWeight:900,color:"#6B7280",textTransform:"uppercase"}}>Maior variação</div>
                <div style={{fontSize:15,fontWeight:950,color:"#111827",marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{topProductVariation ? `${topProductVariation.itemName} · ${formatBRL(topProductVariation.variation || 0)}` : "Sem variação"}</div>
              </div>
            </div>

            {Array.isArray(stats.smartInsights) && stats.smartInsights.length ? (
              <div style={{background:"#FFFFFF",border:"1px solid #EDE9FE",borderRadius:22,padding:14,marginBottom:12,boxShadow:"0 12px 26px rgba(109,40,217,0.06)"}}>
                <div style={{fontWeight:950,color:"#4C1D95",fontSize:15,marginBottom:8}}>Insights rápidos</div>
                <div style={{display:"grid",gap:8}}>
                  {stats.smartInsights.slice(0,3).map((insight, idx) => (
                    <div key={idx} style={{background:"#F9FAFB",border:"1px solid #F3F4F6",borderRadius:14,padding:"9px 10px"}}>
                      <div style={{fontSize:13,fontWeight:950,color:"#111827"}}>{insight.title}</div>
                      <div style={{fontSize:12,fontWeight:700,color:"#6B7280",marginTop:3,lineHeight:1.35}}>{insight.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <StatsExpandableSection id="budget" title="Orçamento x gastos" subtitle="Compare o limite definido com o gasto real de cada lista, na sequência em que foram criadas/finalizadas." openSection={openSection} setOpenSection={setOpenSection}>
              <StatsLineChart series={[budgetSpentSeries, budgetLimitSeries].filter(s => s.points.length)} valueLabel="Valor" emptyText="Ainda não há listas com gasto e orçamento suficientes." />
              <div style={{display:"grid",gap:8,marginTop:12}}>
                {budgetRows.slice(-10).map((row, idx) => {
                  const rowBalance = Number(row.budget || 0) - Number(row.spent || 0);
                  const pct = row.budget > 0 ? Math.round((Number(row.spent || 0) / Number(row.budget || 1)) * 100) : 0;
                  return (
                    <div key={idx} style={{background:"#FAFAFA",border:"1px solid #F3F4F6",borderRadius:14,padding:"10px 11px",fontSize:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                        <strong style={{color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.label}</strong>
                        <span style={{color:"#6B7280",fontWeight:800,whiteSpace:"nowrap"}}>{row.date}</span>
                      </div>
                      <div style={{height:8,background:"#E5E7EB",borderRadius:999,overflow:"hidden",marginTop:8}}>
                        <div style={{height:"100%",width:`${Math.min(100, pct)}%`,background:pct > 100 ? "#DC2626" : "#6D28D9",borderRadius:999}} />
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:6,color:"#374151",fontWeight:800}}>
                        <span>Orçamento: {row.budget ? formatBRL(row.budget) : "não definido"}</span>
                        <span>Gasto: {formatBRL(row.spent)}</span>
                      </div>
                      {row.budget > 0 ? <div style={{marginTop:4,fontWeight:900,color:rowBalance >= 0 ? "#166534" : "#991B1B"}}>{rowBalance >= 0 ? "Economia: " : "Estouro: "}{formatBRL(Math.abs(rowBalance))}</div> : null}
                    </div>
                  );
                })}
              </div>
            </StatsExpandableSection>

            <StatsExpandableSection id="category" title="Gastos por seção" subtitle="Cada seção aparece como uma linha, acompanhando sua evolução lista a lista." openSection={openSection} setOpenSection={setOpenSection}>
              <StatsLineChart series={stats.categorySeries || []} valueLabel="Gasto" emptyText="Ainda não há dados suficientes por seção." />
              <StatsDetailList rows={(stats.categoryTotals || []).map(c => ({label:c.category, value:c.total}))} />
            </StatsExpandableSection>

            <StatsExpandableSection id="product" title="Evolução do preço por produto" subtitle="Pesquise um item ou veja todos os produtos com histórico de variação." openSection={openSection} setOpenSection={setOpenSection}>
              <input
                value={productQuery}
                onChange={(e)=>setProductQuery(e.target.value)}
                placeholder="Buscar produto..."
                style={{width:"100%",border:"1px solid #DDD6FE",borderRadius:16,padding:"12px 13px",fontSize:16,fontWeight:700,outline:"none",marginBottom:10,boxSizing:"border-box",fontFamily:"inherit"}}
              />
              {!filteredProductSeries.length ? (
                <div style={{fontSize:13,color:"#6B7280",fontWeight:700,padding:"8px 2px"}}>Nenhum produto encontrado para este filtro.</div>
              ) : productSeriesToShow.map((item, idx) => (
                <div key={`${item.itemName}-${idx}`} style={{background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:6}}>
                    <div style={{fontWeight:900,fontSize:14,color:"#111827",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.itemName}</div>
                    <div style={{fontSize:11,fontWeight:900,color:"#6D28D9",background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:999,padding:"4px 8px",whiteSpace:"nowrap"}}>var. {formatBRL(item.variation || 0)}</div>
                  </div>
                  <StatsLineChart series={[item]} valueLabel="Preço" emptyText="Dados insuficientes." />
                </div>
              ))}
              {filteredProductSeries.length > 6 ? (
                <button onClick={()=>setShowAllProducts(v=>!v)} style={{width:"100%",border:"1px solid #DDD6FE",background:"#F5F3FF",color:"#5B21B6",borderRadius:16,padding:"12px 14px",fontSize:14,fontWeight:950,fontFamily:"inherit",cursor:"pointer"}}>
                  {showAllProducts ? "Mostrar menos produtos" : `Ver todos os produtos (${filteredProductSeries.length})`}
                </button>
              ) : null}
            </StatsExpandableSection>

            <StatsExpandableSection id="year" title="Evolução mensal consolidada" subtitle="Linha mensal com o total das compras registradas." openSection={openSection} setOpenSection={setOpenSection}>
              <StatsLineChart series={[{name:"Total mensal", color:"#6D28D9", points:stats.annualTotals || []}]} valueLabel="Total" emptyText="Ainda não há evolução mensal registrada." />
              <StatsDetailList rows={(stats.annualTotals || []).map(m => ({label:m.label, value:m.value}))} />
            </StatsExpandableSection>
          </>
        )}
      </div>
    </div>
  );
}

function PriceStatsPanel() {
  const stats = getPriceStatsSummary();

  const panelStyle = {
    width: "100%",
    boxSizing: "border-box",
    margin: "14px 0 22px",
    padding: 16,
    borderRadius: 24,
    display: "block",
    clear: "both",
    background: "linear-gradient(135deg,#FFFFFF,#FAF7FF)",
    border: "1px solid #E9D5FF",
    boxShadow: "0 12px 28px rgba(109,40,217,0.08)",
    overflow: "hidden",
  };

  if (!stats.totalRecords) {
    return (
      <div style={panelStyle}>
        <div style={{fontWeight:900,color:"#4C1D95",fontSize:17,marginBottom:4}}>📊 Estatísticas de preços</div>
        <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45}}>
          As estatísticas aparecerão após o registro de preços nos itens comprados.
        </div>
      </div>
    );
  }

  const maxMonthly = Math.max(...stats.monthlyTotals.map(x => Number(x.total || 0)), 1);

  return (
    <div style={panelStyle}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12}}>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:900,color:"#4C1D95",fontSize:17,lineHeight:1.2}}>📊 Estatísticas de preços</div>
          <div style={{fontSize:12,color:"#6B7280",marginTop:4,lineHeight:1.35}}>
            Histórico local de {stats.totalRecords} preço(s). Médias e percentuais são leituras estatísticas.
          </div>
        </div>
        <div style={{
          flexShrink:0,
          textAlign:"right",
          background:"#F5F3FF",
          border:"1px solid #DDD6FE",
          borderRadius:16,
          padding:"8px 10px",
          minWidth:96
        }}>
          <div style={{fontSize:10,color:"#6B7280",fontWeight:900,textTransform:"uppercase",lineHeight:1.1}}>Média</div>
          <div style={{fontWeight:900,color:"#111827",fontSize:16,lineHeight:1.15}}>
            {stats.averageTicket.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
          </div>
        </div>
      </div>

      {stats.topIncreases.length ? (
        <div style={{marginTop:8}}>
          <div style={{fontSize:12,fontWeight:900,color:"#374151",marginBottom:6}}>Maiores variações</div>
          <div style={{display:"grid",gap:6}}>
            {stats.topIncreases.slice(0,3).map((it, idx) => (
              <div key={idx} style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:10,
                padding:"8px 10px",
                borderRadius:14,
                background:"#FFFFFF",
                border:"1px solid #F3F4F6",
                fontSize:12
              }}>
                <span style={{fontWeight:900,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.itemName}</span>
                <span style={{fontWeight:900,color:it.percent > 0 ? "#B91C1C" : "#166534",flexShrink:0}}>
                  {it.percent > 0 ? "+" : ""}{it.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {stats.monthlyTotals.length ? (
        <div style={{marginTop:12}}>
          <div style={{fontSize:12,fontWeight:900,color:"#374151",marginBottom:6}}>Evolução mensal</div>
          <div style={{display:"grid",gap:7}}>
            {stats.monthlyTotals.slice(-4).map((m) => {
              const width = Math.max(8, Math.round((Number(m.total || 0) / maxMonthly) * 100));
              return (
                <div key={m.month} style={{display:"grid",gridTemplateColumns:"58px 1fr 78px",gap:8,alignItems:"center",fontSize:11}}>
                  <span style={{fontWeight:900,color:"#4B5563"}}>{m.month}</span>
                  <div style={{height:9,background:"#F3F4F6",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${width}%`,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",borderRadius:999}} />
                  </div>
                  <span style={{fontWeight:900,color:"#111827",textAlign:"right"}}>
                    {m.total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}


// ── DESPENSA: fluxo integrado ao módulo Compras ───────────────────────────
const PANTRY_STORAGE_KEY = "tnl_pantry_lists";

function loadPantryLists() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PANTRY_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function countCategoryItems(categories) {
  return (Array.isArray(categories) ? categories : []).reduce((sum, cat) => sum + (Array.isArray(cat.items) ? cat.items.length : 0), 0);
}

function flattenCategoryItems(categories) {
  return (Array.isArray(categories) ? categories : []).flatMap(cat =>
    (Array.isArray(cat.items) ? cat.items : []).map(item => ({ ...item, category: cat.name }))
  );
}

function pantryItemKey(item) {
  return normalizePlainText([item?.name, item?.detail].filter(Boolean).join(" "))
    .replace(/\b(pct|pcte|pacote|pacotes|cx|caixa|caixas|unidade|unidades|kg|g|ml|l|litro|litros|quilo|quilos)\b/g, " ")
    .replace(/\b\d+[,.]?\d*\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchingPantryItem(item, pantryItems) {
  const key = pantryItemKey(item);
  if (!key) return null;
  return pantryItems.find(p => {
    const pk = pantryItemKey(p);
    return pk && (pk === key || pk.includes(key) || key.includes(pk));
  }) || null;
}

function comparePendingItemsWithPantry(pendingItems, pantryCategories) {
  const pantryItems = flattenCategoryItems(pantryCategories);
  const removed = [];
  const adjusted = [];
  const kept = [];

  const nextItems = (Array.isArray(pendingItems) ? pendingItems : []).flatMap(original => {
    const item = normalizeListItem(original);
    const match = findMatchingPantryItem(item, pantryItems);
    if (!match) {
      kept.push(item);
      return [item];
    }

    const sameUnit = normalizeUnitValue(item.unit) === normalizeUnitValue(match.unit);
    const itemQty = Number(item.qty || 1);
    const pantryQty = Number(match.qty || 1);
    const pantryNote = `Já tem na despensa: ${formatQtyUnit(match.qty, match.unit)}`;

    if (sameUnit && Number.isFinite(itemQty) && Number.isFinite(pantryQty)) {
      if (pantryQty >= itemQty) {
        removed.push({ item, pantry: match, reason: pantryNote });
        return [];
      }
      const newQty = Number((itemQty - pantryQty).toFixed(2));
      const changed = { ...item, qty: newQty, pantryCompared: true, pantryNote: `${pantryNote}. Comprar complemento: ${formatQtyUnit(newQty, item.unit)}` };
      adjusted.push({ before: item, after: changed, pantry: match });
      return [changed];
    }

    const marked = { ...item, pantryCompared: true, pantryNote };
    adjusted.push({ before: item, after: marked, pantry: match });
    return [marked];
  });

  return { items: nextItems, removed, adjusted, kept };
}

function formatPantryDate(value) {
  try {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR") + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function App(){

  useEffect(() => {
    ensureMobileViewport();
  }, []);

  const [screen,setScreen]=useState("home");
  
  const [showPriceStatsScreen, setShowPriceStatsScreen] = useState(false);
  const [showHistory,setShowHistory]=useState(false);
const [lists,setLists]=useState(()=>{
    try{
      const stored=JSON.parse(localStorage.getItem("tnl_lists")||"[]");
      return Array.isArray(stored)?mergeUniqueLists(stored):[];
    }catch{return[]}
  });
  const [currentList,setCurrentList]=useState(null);
  const [loading,setLoading]=useState(false);
  const [toast,setToast]=useState({show:false,msg:""});
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [showFinished,setShowFinished]=useState(false);
  const toastTimer=useRef(null);
  const searchRef=useRef(null);
  const listRef=useRef(null);

  // Create
  const [listName,setListName]=useState("");
  const [listType,setListType]=useState("mercado");
  const [budgetEnabled,setBudgetEnabled]=useState(false);
  const [budgetText,setBudgetText]=useState("");
  const [pendingItems,setPendingItems]=useState([]);
  const [pantryLists,setPantryLists]=useState(()=>loadPantryLists());
  const [pantryPendingItems,setPantryPendingItems]=useState([]);
  const [pantryInput,setPantryInput]=useState("");
  const [pantryReviewCategories,setPantryReviewCategories]=useState([]);
  const [pantryComparison,setPantryComparison]=useState(null);
  const [pantryCompared,setPantryCompared]=useState(false);
  const [pantryEditingId,setPantryEditingId]=useState(null);
  const [pantryReviewEdit,setPantryReviewEdit]=useState(null);
  const [showPantryComparisonDetails,setShowPantryComparisonDetails]=useState(false);
  const [currentInput,setCurrentInput]=useState("");
  const [editingListId,setEditingListId]=useState(null);

  // Product dialog
  const [itemDialog,setItemDialog]=useState(null);
  const [itemDialogMode,setItemDialogMode]=useState("pending");
  const [dlgMarca,setDlgMarca]=useState("");
  const [dlgTipo,setDlgTipo]=useState("");
  const [dlgPeso,setDlgPeso]=useState("");
  const [dlgVolume,setDlgVolume]=useState("");
  const [dlgQty,setDlgQty]=useState(1);
  const [dlgUnit,setDlgUnit]=useState("unidade");
  const [dlgConfig,setDlgConfig]=useState(null);
  const [editPendingIdx,setEditPendingIdx]=useState(null);
  const [listNameConfirmed,setListNameConfirmed]=useState(false);
  const [budgetConfirmed,setBudgetConfirmed]=useState(false);
  const [budgetSavedPulse,setBudgetSavedPulse]=useState(false);
  const [listNameSavedPulse,setListNameSavedPulse]=useState(false);
  const budgetSavedTimer=useRef(null);
  const listNameSavedTimer=useRef(null);
  const [showPasteModal,setShowPasteModal]=useState(false);
  const [pasteText,setPasteText]=useState("");
  const [pasteTarget,setPasteTarget]=useState("list");
  const [voiceTarget,setVoiceTarget]=useState("list");
  const voiceTargetRef=useRef("list");
  const [showPhotoModal,setShowPhotoModal]=useState(false);
  const [ocrLoading,setOcrLoading]=useState(false);
  const [ocrProgress,setOcrProgress]=useState(0);
  const [ocrText,setOcrText]=useState("");
  const [ocrFileName,setOcrFileName]=useState("");
  const [reuseModal,setReuseModal]=useState(null);
  const [listMenuId,setListMenuId]=useState(null);
  const [mNotFound,setMNotFound]=useState(false);
  const [voiceListening,setVoiceListening]=useState(false);
  const [voiceProcessing,setVoiceProcessing]=useState(false);
  const voiceMediaRecorderRef=useRef(null);
  const voiceAudioChunksRef=useRef([]);
  const voiceMediaStreamRef=useRef(null);
  const voiceAudioContextRef=useRef(null);
  const voiceAnalyserRef=useRef(null);
  const voiceSilenceTimerRef=useRef(null);
  const voiceVolumeMonitorRef=useRef(null);
  const voiceRecordingStartedAtRef=useRef(0);
  const voiceHasSoundRef=useRef(false);

  const triggerBudgetSavedPulse=useCallback(()=>{
    setBudgetSavedPulse(true);
    if(budgetSavedTimer.current) clearTimeout(budgetSavedTimer.current);
    budgetSavedTimer.current=setTimeout(()=>setBudgetSavedPulse(false),900);
  },[]);

  const triggerListNameSavedPulse=useCallback(()=>{
    setListNameSavedPulse(true);
    if(listNameSavedTimer.current) clearTimeout(listNameSavedTimer.current);
    listNameSavedTimer.current=setTimeout(()=>setListNameSavedPulse(false),900);
  },[]);

  // List screen
  const [search,setSearch]=useState("");
  const [collapsedCats,setCollapsedCats]=useState({});

  // Item modal
  const [itemModal,setItemModal]=useState(null);
  const [mQty,setMQty]=useState(1);
  const [mQtyText,setMQtyText]=useState("1");
  const [mPriceText,setMPriceText]=useState("");
  const [mPriceMode,setMPriceMode]=useState("total");
  const [mWeightText,setMWeightText]=useState("");

  // Extra modal
  const [extraModal,setExtraModal]=useState(false);
  const [exName,setExName]=useState("");
  const [exQty,setExQty]=useState(1);
  const [exUnit,setExUnit]=useState("unidade");
  const [exPrice,setExPrice]=useState("");

  const [shareModal,setShareModal]=useState(false);
  const [shareTargetList,setShareTargetList]=useState(null);
  const [senderName,setSenderName]=useState(()=>getAppUserName()||"");
  const [userNameModal,setUserNameModal]=useState(()=>!getAppUserName());
  const [userNameInput,setUserNameInput]=useState(()=>getAppUserName()||"");
  const [userPinInput,setUserPinInput]=useState("");
  const [userPinConfirmInput,setUserPinConfirmInput]=useState("");
  const [isFirstAccessMode,setIsFirstAccessMode]=useState(false);
  const [authCheckingName,setAuthCheckingName]=useState(false);
  const [authCheckedName,setAuthCheckedName]=useState("");
  const [isRecoverPinMode,setIsRecoverPinMode]=useState(false);
  const [sharedLandingRecord,setSharedLandingRecord]=useState(null);
  const [sharedPreviewExpanded,setSharedPreviewExpanded]=useState(false);
  const [sharedSyncing,setSharedSyncing]=useState(false);
  const [sharedUpdateNotice,setSharedUpdateNotice]=useState(null);
  const autoSyncNoticeRef=useRef(0);
  const [checkPopup,setCheckPopup]=useState(null);
  const [showSuggestions,setShowSuggestions]=useState(false);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [installAvailable,setInstallAvailable]=useState(false);
  const [notifications,setNotifications]=useState(()=>loadStoredNotifications());
  const [showNotificationsScreen,setShowNotificationsScreen]=useState(false);

  const showToast=useCallback((msg,duration=1000)=>{
    clearTimeout(toastTimer.current);
    setToast({show:true,msg});
    toastTimer.current=setTimeout(()=>setToast({show:false,msg:""}),duration);
  },[]);


  const addNotification = useCallback((type, message, meta = {}) => {
    const id = meta.id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const notification = {
      id,
      type,
      message,
      meta,
      read: false,
      createdAt: meta.createdAt || new Date().toISOString(),
    };
    setNotifications((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.some((n) => n.id === id)) return current;
      const next = [notification, ...current].slice(0, 80);
      saveStoredNotifications(next);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, read: true }));
      saveStoredNotifications(next);
      return next;
    });
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const syncNotificationsFromLists = useCallback((sourceLists = []) => {
    const currentName = String(getAppUserName() || "").trim().toLowerCase();
    if (!currentName) return;
    const events = [];
    (Array.isArray(sourceLists) ? sourceLists : []).forEach((list) => {
      (Array.isArray(list?.sharedEvents) ? list.sharedEvents : []).forEach((event) => {
        const target = String(event?.targetName || "").trim().toLowerCase();
        const actor = String(event?.actorName || "").trim().toLowerCase();
        if (target && target !== currentName) return;
        // Quem executou a ação não recebe notificação da própria ação.
        // A notificação fica direcionada ao remetente/dono da lista.
        if (actor && actor === currentName) return;
        const notification = eventToNotification(event);
        if (notification) events.push(notification);
      });
    });
    if (!events.length) return;
    setNotifications((prev) => {
      const map = new Map((Array.isArray(prev) ? prev : []).map((n) => [n.id, n]));
      events.forEach((n) => {
        if (!map.has(n.id)) map.set(n.id, n);
      });
      const next = Array.from(map.values()).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,80);
      saveStoredNotifications(next);
      return next;
    });
  }, []);


  const handleSwitchUser = useCallback(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("tnl_") || key.startsWith("ta-na-lista:")) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    setLists([]);
    setCurrentList(null);
    setSenderName("");
    setUserNameInput("");
    setUserPinInput("");
    setUserPinConfirmInput("");
    clearPinSession();
    setUserNameModal(true);
    setScreen("home");
    setShowPriceStatsScreen(false);
    setShowHistory(false);
    setShowNotificationsScreen(false);
    setNotifications([]);
    showToast("Usuário desconectado. Informe o nome para entrar novamente.", 2200);
  }, [showToast]);



  const savePantryLists = useCallback((next) => {
    const safe = Array.isArray(next) ? next : [];
    setPantryLists(safe);
    try { localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(safe)); } catch {}
  }, []);

  const activePantry = pantryLists.find(p => p.status === "ativa") || null;

  useEffect(() => {
    syncNotificationsFromLists(lists);
  }, [lists, syncNotificationsFromLists]);


  const resetPantryFlow = useCallback(() => {
    setPantryPendingItems([]);
    setPantryInput("");
    setPantryReviewCategories([]);
    setPantryEditingId(null);
    setPantryReviewEdit(null);
  }, []);

  const openPantryCreator = useCallback(() => {
    setPantryPendingItems([]);
    setPantryInput("");
    setPantryReviewCategories([]);
    setPantryEditingId(null);
    setPantryReviewEdit(null);
    setScreen("pantry_create");
  }, []);

  const getManualDialogUnits = useCallback(() => {
    const base = ["unidade", "pacote", "kg", "L", "caixa", "fardo"];
    const fromConfig = Array.isArray(dlgConfig?.unidades) ? dlgConfig.unidades.map(normalizeUnitValue) : [];
    return Array.from(new Set([...base, ...fromConfig])).filter(Boolean).slice(0, 8);
  }, [dlgConfig]);

  const isDecimalManualUnit = useCallback((unit) => ["kg", "g", "L", "ml"].includes(normalizeUnitValue(unit)), []);

  const getManualQtyStep = useCallback((unit = dlgUnit) => isDecimalManualUnit(unit) ? 0.5 : 1, [dlgUnit, isDecimalManualUnit]);

  const formatManualQty = useCallback((qty) => {
    // Mantém a digitação natural de números decimais.
    // Ex.: permite o usuário digitar "1," antes de completar "1,5".
    if (typeof qty === "string") {
      return qty.replace(".", ",");
    }
    const n = Number(qty || 0);
    if (!Number.isFinite(n)) return "1";
    return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))).replace(".", ",");
  }, []);

  const setManualQtyFromText = useCallback((value) => {
    let raw = String(value || "")
      .replace(/[^0-9,.]/g, "")
      .replace(/\./g, ",");

    // Permite somente uma vírgula decimal.
    const firstComma = raw.indexOf(",");
    if (firstComma >= 0) {
      raw = raw.slice(0, firstComma + 1) + raw.slice(firstComma + 1).replace(/,/g, "");
    }

    // Durante a digitação, preserva estados intermediários válidos: "", "1,".
    if (raw === "" || /^\d+,?$/.test(raw)) {
      setDlgQty(raw);
      return;
    }

    if (/^\d+,\d{0,2}$/.test(raw)) {
      setDlgQty(raw);
      return;
    }

    const number = Number(raw.replace(",", "."));
    if (!Number.isFinite(number) || number <= 0) {
      setDlgQty("");
      return;
    }
    setDlgQty(Number(number.toFixed(2)));
  }, []);

  const changeManualQty = useCallback((direction) => {
    const step = getManualQtyStep();
    setDlgQty((current) => {
      const base = Number(String(current || step).replace(",", "."));
      const safeBase = Number.isFinite(base) && base > 0 ? base : step;
      const next = Math.max(step, safeBase + direction * step);
      return Number(next.toFixed(2));
    });
  }, [getManualQtyStep]);

  const handleManualUnitChange = useCallback((unit) => {
    const cleanUnit = normalizeUnitValue(unit);
    setDlgUnit(cleanUnit);
    if (isDecimalManualUnit(cleanUnit)) {
      setDlgPeso("");
      setDlgVolume("");
      setDlgQty((current) => {
        const n = Number(String(current || 1).replace(",", "."));
        return Number.isFinite(n) && n > 0 ? n : 1;
      });
    } else {
      setDlgQty((current) => {
        const n = Number(String(current || 1).replace(",", "."));
        return Math.max(1, Math.round(Number.isFinite(n) ? n : 1));
      });
    }
  }, [isDecimalManualUnit]);

  const getManualSizeOptions = useCallback(() => {
    if (!dlgConfig || isDecimalManualUnit(dlgUnit)) return [];
    const sizes = [...(Array.isArray(dlgConfig.pesos) ? dlgConfig.pesos : []), ...(Array.isArray(dlgConfig.volumes) ? dlgConfig.volumes : [])]
      .filter(Boolean);
    return Array.from(new Set(sizes)).slice(0, 10);
  }, [dlgConfig, dlgUnit, isDecimalManualUnit]);

  const setManualSize = useCallback((size) => {
    const value = String(size || "").trim();
    if (/\b(ml|l)\b/i.test(value)) {
      setDlgVolume(value);
      setDlgPeso("");
    } else {
      setDlgPeso(value);
      setDlgVolume("");
    }
  }, []);

  const buildManualPreview = useCallback(() => {
    const qty = Number(String(dlgQty || 1).replace(",", "."));
    const unit = normalizeUnitValue(dlgUnit || "unidade");
    const name = normalizeProductName(itemDialog?.name || "");
    const size = isDecimalManualUnit(unit) ? "" : String(dlgPeso || dlgVolume || "").trim();
    return `${formatQtyUnit(Number.isFinite(qty) && qty > 0 ? qty : 1, unit)} · ${[name, size].filter(Boolean).join(" ")}`;
  }, [dlgQty, dlgUnit, itemDialog, dlgPeso, dlgVolume, isDecimalManualUnit]);

  const normalizeListOwnershipFlags=(list)=>{
    if(!list)return list;
    const currentName=getAppUserName();
    const owner=list.ownerName || list.remetente || currentName;
    const from=list.importedFrom || list.sharedOwner || list.remetente || list.ownerName || "";
    const ownerIsCurrent=normalizeAuthName(owner) && normalizeAuthName(owner)===normalizeAuthName(currentName);
    const fromIsCurrent=normalizeAuthName(from) && normalizeAuthName(from)===normalizeAuthName(currentName);
    if(ownerIsCurrent || fromIsCurrent){
      return {
        ...list,
        imported:false,
        importedFrom:null,
        sharedOwner:null,
        // sharedId pode existir apenas para sincronização na nuvem.
        // O selo Compartilhada fica reservado ao envio explícito da lista.
        isShared:list.sharedAt ? list.isShared === true : false,
      };
    }
    return list;
  };

  const saveLists=(nl)=>{
    const safe=mergeUniqueLists((Array.isArray(nl)?nl:[]).map(normalizeListOwnershipFlags));
    setLists(safe);
    localStorage.setItem("tnl_lists",JSON.stringify(safe));
  };

  const restoreUserListsFromCloud=useCallback(async(userId,userName,{silent=false}={})=>{
    if(!userId && !userName)return;
    try{
      const records=await getSharedListsForUser(userId, userName || getAppUserName());
      if(!records.length)return;
      setLists(prev=>{
        const current=Array.isArray(prev)?prev:[];
        const known=new Set(current.map(l=>l.sharedId||l.id));
        const restored=[];
        for(const record of records){
          if(isSharedRecordHiddenForCurrentUser(record))continue;
          const local=sharedRecordToLocalList(record);
          if(wasListDeletedLocally(local) || isSharedRecordHiddenForCurrentUser({ ...record, data: local }))continue;
          const key=local.sharedId||local.id;
          if(key && !known.has(key)){
            restored.push(local);
            known.add(key);
          }
        }
        if(!restored.length)return current;
        const merged=mergeUniqueLists([...restored,...current]);
        try{localStorage.setItem("tnl_lists",JSON.stringify(merged));}catch{}
        if(!silent)showToast(`${restored.length} lista(s) recuperada(s)`);
        return merged;
      });
    }catch(err){
      console.warn("Nao foi possivel recuperar listas do usuario:",err);
    }
  },[showToast]);



  const persistListRecordToCloud=useCallback(async(list,{silent=true}={})=>{
    if(!list || !hasSupabaseConfig())return list;
    try{
      const ownerName=saveAppUserName(list.ownerName || list.remetente || senderName || getAppUserName() || userNameInput || "Usuário do Tá na Lista");
      const userId=await registerAppUser(ownerName,{force:true});
      const base={
        ...list,
        userId:userId || list.userId || getAppUserId() || null,
        ownerName,
        remetente:ownerName,
        lastSyncedAt:new Date().toISOString(),
        cloudPersisted:true,
      };

      if(base.sharedId){
        const record=await updateSharedListRecord(base.sharedId,base);
        return markListCloudSynced({
          ...base,
          userId:record?.user_id || base.userId || null,
          ownerName:record?.remetente || ownerName,
          remetente:record?.remetente || ownerName,
        },record?.data || base);
      }

      const record=await createSharedListRecord(base);
      if(!record?.id)return base;
      return markListCloudSynced({
        ...base,
        sharedId:record.id,
        userId:record.user_id || base.userId || null,
        ownerName:record.remetente || ownerName,
        remetente:record.remetente || ownerName,
      },record?.data || base);
    }catch(err){
      console.warn("Nao foi possivel salvar lista na nuvem:",err);
      if(!silent)showToast("⚠️ Lista salva neste aparelho, mas ainda não sincronizada na nuvem.",4200);
      return list;
    }
  },[senderName,userNameInput,showToast]);

  const persistLocalListsToCloud=useCallback(async()=>{
    const currentName=getAppUserName();
    if(!currentName || !hasSupabaseConfig())return;
    const localLists=Array.isArray(lists)?lists:[];
    const toPersist=localLists.filter(l=>l && !l.sharedId && !wasListDeletedLocally(l));
    if(!toPersist.length)return;

    let changed=false;
    const updated=[];
    for(const list of localLists){
      if(list && !list.sharedId && !wasListDeletedLocally(list)){
        const persisted=await persistListRecordToCloud(list,{silent:true});
        updated.push(persisted);
        if(persisted?.sharedId)changed=true;
      }else{
        updated.push(list);
      }
    }
    if(changed){
      saveLists(updated);
      showToast("☁️ Listas locais sincronizadas com sua conta",2200);
    }
  },[lists,persistListRecordToCloud,showToast]);
  useEffect(()=>{
    const existingName=getAppUserName();
    if(existingName && isPinSessionVerified(existingName)){
      setSenderName(prev=>prev||existingName);
      setUserNameInput(existingName);
      registerAppUser(existingName).then(async userId=>{
        if(userId){
          await restoreUserListsFromCloud(userId,existingName,{silent:true});
          // Não migrar automaticamente listas antigas sem sharedId a cada login.
          // Essa rotina era a origem da duplicação contínua no Supabase/localStorage.
          // Listas novas já são persistidas no organizeList().
        }
      });
    }else{
      if(existingName){
        setUserNameInput(existingName);
        setUserNameModal(true);
      }else{
        setUserNameModal(true);
      }
    }
  },[restoreUserListsFromCloud,persistLocalListsToCloud]);

  useEffect(()=>{
    if(!userNameModal || !hasSupabaseConfig())return;
    const clean=String(userNameInput||"").trim();
    setUserPinConfirmInput("");
    setAuthCheckedName("");
    setIsFirstAccessMode(false);
    setIsRecoverPinMode(false);
    if(clean.length<2){
      setAuthCheckingName(false);
      return;
    }

    let cancelled=false;
    setAuthCheckingName(true);
    const timer=setTimeout(async()=>{
      try{
        const profile=await findUserAuthProfile(clean);
        if(cancelled)return;
        setAuthCheckedName(clean);
        setIsFirstAccessMode(!profile?.data?.pinHash);
      }catch{
        if(!cancelled){
          setAuthCheckedName(clean);
          setIsFirstAccessMode(false);
        }
      }finally{
        if(!cancelled)setAuthCheckingName(false);
      }
    },420);

    return()=>{
      cancelled=true;
      clearTimeout(timer);
    };
  },[userNameInput,userNameModal]);

  const confirmAppUserName=async()=>{
    const clean=String(userNameInput||"").trim();
    if(!clean){showToast("Informe seu nome para continuar.");return;}
    if(!hasSupabaseConfig()){
      showToast("Configuração do Supabase não encontrada. Não é possível validar o PIN.",4200);
      return;
    }

    try{
      setLoading(true);
      const pinResult=await verifyOrCreateUserPin(clean,userPinInput,userPinConfirmInput);
      if(!pinResult.ok){
        showToast(pinResult.message,3600);
        return;
      }

      const savedName=saveAppUserName(clean);
      markPinSessionVerified(savedName);
      setSenderName(savedName);
      setUserNameModal(false);
      setUserPinInput("");
      setUserPinConfirmInput("");
      setIsFirstAccessMode(false);
      setIsRecoverPinMode(false);
      setAuthCheckingName(false);
      setAuthCheckedName(savedName);

      const userId=await registerAppUser(savedName,{force:true});
      if(userId)await restoreUserListsFromCloud(userId,savedName);

      showToast(pinResult.mode==="created"?"Usuário cadastrado com PIN!":"Usuário reconhecido!",2400);
    }catch(err){
      showToast(err?.message || "Não foi possível validar seu acesso.",5200);
    }finally{
      setLoading(false);
    }
  };

  const recoverAppUserPin=async()=>{
    const clean=String(userNameInput||"").trim();
    if(!clean){showToast("Informe seu nome para recuperar o acesso.");return;}
    if(!hasSupabaseConfig()){
      showToast("Configuração do Supabase não encontrada. Não é possível redefinir o PIN.",4200);
      return;
    }

    try{
      setLoading(true);
      const result=await resetUserAuthPin(clean,userPinInput,userPinConfirmInput);
      if(!result.ok){
        showToast(result.message,5200);
        return;
      }

      const savedName=saveAppUserName(clean);
      markPinSessionVerified(savedName);
      setSenderName(savedName);
      setUserNameModal(false);
      setUserPinInput("");
      setUserPinConfirmInput("");
      setIsFirstAccessMode(false);
      setIsRecoverPinMode(false);
      setAuthCheckingName(false);
      setAuthCheckedName(savedName);

      const userId=await registerAppUser(savedName,{force:true});
      if(userId)await restoreUserListsFromCloud(userId,savedName);

      showToast("PIN redefinido com sucesso!",2600);
    }catch(err){
      showToast(err?.message || "Não foi possível redefinir o PIN.",5600);
    }finally{
      setLoading(false);
    }
  };

  const submitAuthForm=()=>{
    if(isRecoverPinMode) return recoverAppUserPin();
    return confirmAppUserName();
  };

  const scrollToListTop=useCallback(()=>{
    window.scrollTo({top:0,behavior:"smooth"});
    if(listRef.current)listRef.current.scrollTo({top:0,behavior:"smooth"});
    setTimeout(()=>searchRef.current?.focus?.(),180);
  },[]);

  const returnToSearch=useCallback((delay=120)=>{
    setSearch("");
    setTimeout(()=>{
      scrollToListTop();
      setTimeout(()=>searchRef.current?.focus?.(),160);
    },delay);
  },[scrollToListTop]);

  const getPublicAppUrl=()=>{
    const origin=window.location?.origin;
    if(origin && origin!=="null") return origin;
    const href=String(window.location?.href || "").split("#")[0].split("?")[0];
    return href.replace(/\/l\/.*$/,"/").replace(/\/lista\/.*$/,"/").replace(/\/index\.html$/,"/").replace(/\/$/,"");
  };

  const openWhatsAppDirect=(text)=>{
    const encoded=encodeURIComponent(text);
    const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"");
    const url=isMobile
      ? `whatsapp://send?text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;

    // Abre o WhatsApp na própria janela para evitar aba intermediária, about:blank
    // e o aviso do WhatsApp Web sobre uso em outra janela.
    showToast("Abrindo WhatsApp para envio...", 1800);
    setTimeout(()=>{
      window.location.href=url;
    },250);
    return true;
  };

  const shareAppWhatsApp=()=>{
    const appUrl=getPublicAppUrl();
    const text=`Conheça o Tá na Lista! Um app simples para organizar compras, compartilhar listas e controlar o orçamento. Acesse aqui:\n${appUrl}`;
    openWhatsAppDirect(text);
  };

  useEffect(()=>{
    const handler=(event)=>{
      event.preventDefault();
      setInstallPrompt(event);
      setInstallAvailable(true);
    };
    window.addEventListener("beforeinstallprompt",handler);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);

  const installApp=async()=>{
    if(!installPrompt){
      showToast("Para adicionar à Tela de Início, toque no menu do navegador e escolha Adicionar à Tela de Início.",6500);
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice.catch(()=>null);
    setInstallPrompt(null);
    setInstallAvailable(false);
  };

  const makeShareUrl=(sharedId)=>{
    const encoded=encodeURIComponent(sharedId);
    const origin=window.location?.origin;
    if(origin && origin!=="null") return `${origin}/?lista=${encoded}`;
    const href=String(window.location?.href || "").split("?")[0].split("#")[0]
      .replace(/\/l\/.*$/,"/")
      .replace(/\/lista\/.*$/,"/")
      .replace(/\/index\.html$/,"/")
      .replace(/\/+$/,"/");
    return `${href}?lista=${encoded}`;
  };

  const extractSharedIdFromUrl=()=>{
    try{
      const url=new URL(window.location.href);
      const byQuery=url.searchParams.get("lista");
      if(byQuery)return byQuery;
      const m=url.pathname.match(/\/(?:l|lista)\/([^/]+)/);
      return m?decodeURIComponent(m[1]):null;
    }catch{return null;}
  };

  const encodeListForUrl=(list)=>{
    const json=JSON.stringify(list||{});
    const bytes=new TextEncoder().encode(json);
    let binary="";
    bytes.forEach(b=>{binary+=String.fromCharCode(b);});
    return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
  };

  const decodeListFromUrl=(value)=>{
    const normalized=String(value||"").replace(/-/g,"+").replace(/_/g,"/");
    const padded=normalized+"=".repeat((4-normalized.length%4)%4);
    const binary=atob(padded);
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };

  const makeEmbeddedShareUrl=(list)=>{
    const origin=(window.location?.origin&&window.location.origin!=="null")?window.location.origin:String(window.location?.href||"").split("?")[0].split("#")[0];
    return `${origin}/?listaData=${encodeURIComponent(encodeListForUrl(list))}`;
  };

  const extractEmbeddedListFromUrl=()=>{
    try{
      const url=new URL(window.location.href);
      const data=url.searchParams.get("listaData");
      return data?decodeListFromUrl(data):null;
    }catch{return null;}
  };

  const buildShareText=(list,link)=>{
    const{fullTotal,notFoundItems}=getProgress(list);
    const lines=[];
    lines.push("🛒 *"+(list?.name||"Lista de compras")+"* — Tá na Lista");
    if(list?.budget>0)lines.push("💰 Orçamento: "+fmtR(list.budget));
    lines.push("");
    (list?.categories||[]).forEach(cat=>{
      const theme=getCatTheme(cat.name);
      const sub=getCatSubtotal(cat);
      lines.push(theme.icon+" *"+cat.name+"*"+(sub>0?" — "+fmtR(sub):""));
      (cat.items||[]).forEach(i=>{
        const status=i.notFound?"❌":i.checked?"✅":"⬜";
        const detail=i.detail?" ("+i.detail+")":"";
        const qty=i.qty>1?" "+i.qty+"×":"";
        const price=i.price!=null?" — "+fmtR(getItemLineTotal(i)):"";
        lines.push(status+" "+i.name+detail+qty+price);
      });
      lines.push("");
    });
    lines.push("💰 *Total: "+fmtR(fullTotal)+"*");
    if(notFoundItems>0)lines.push("❌ "+notFoundItems+" item"+(notFoundItems>1?"s":"")+" não encontrado"+(notFoundItems>1?"s":""));
    if(link){
      lines.push("");
      lines.push("📲 Abrir esta lista no app Tá na Lista:");
      lines.push(link);
      lines.push("");
      lines.push("Se ainda não usa o app, abra o link e toque em ‘Adicionar à Tela de Início’.");
    }
    return lines.join("\n");
  };

  const buildShareInviteText=(list,link)=>{
    const {totalItems,checkedItems,fullTotal}=getProgress(list);
    const lines=[];
    lines.push("🛒 Tá na Lista");
    lines.push("");
    lines.push("Você recebeu uma lista de compras:");
    lines.push("*"+(list?.name||"Lista de compras")+"*");
    lines.push("");
    lines.push("📌 Itens: "+checkedItems+"/"+totalItems);
    if(list?.budget>0)lines.push("💰 Orçamento: "+fmtR(list.budget));
    if(fullTotal>0)lines.push("🧾 Compras registradas: "+fmtR(fullTotal));
    lines.push("");
    lines.push("Abra a lista no app:");
    lines.push(link);
    lines.push("");
    lines.push("Se ainda não usa o Tá na Lista, abra o link e toque em ‘Adicionar à Tela de Início’. ");
    return lines.join("\n");
  };

  const openShareWindow=(url,preparedWindow=null)=>{
    if(preparedWindow&&!preparedWindow.closed){
      preparedWindow.location.href=url;
      preparedWindow.focus?.();
      return;
    }
    const opened=window.open(url,"_blank","noopener,noreferrer");
    if(!opened){
      window.location.href=url;
    }
  };

  const publishSharedList=async(list)=>{
    if(!list)throw new Error("Lista não encontrada.");
    if(list.sharedId){
      syncSharedListToCloud(list,{silent:true});
      return{sharedId:list.sharedId,link:makeShareUrl(list.sharedId),list,mode:"supabase"};
    }

    const record=await createSharedListRecord(list);
    if(!record?.id)throw new Error("Não foi possível gerar o link curto da lista no Supabase.");

    const updated={...list,sharedId:record.id,userId:record.user_id || list.userId || getAppUserId() || null,ownerName:record.remetente || list.ownerName || getAppUserName(),sharedAt:new Date().toISOString(),isShared:true};
    setCurrentList(prev=>prev&&prev.id===list.id?updated:prev);
    saveLists(lists.map(l=>l.id===list.id?updated:l));
    return{sharedId:record.id,link:makeShareUrl(record.id),list:updated,mode:"supabase"};
  };

  const importSharedRecordToApp=useCallback((record, embeddedFallback=null)=>{
    const sharedId=record?.id || extractSharedIdFromUrl();
    const baseData=record?.data || embeddedFallback;
    if(!baseData)throw new Error("Lista compartilhada não encontrada.");

    const received={
      ...baseData,
      id:baseData.id||("shared-"+(sharedId||Date.now())),
      sharedId:sharedId||baseData.sharedId,
      userId: baseData.userId || record?.user_id || null,
      isShared:true,
      imported:true,
      importedFrom:record?.remetente || baseData.remetente || "Não informado",
      remetente:record?.remetente || baseData.remetente || "Não informado",
      sharedOwner:record?.remetente || baseData.remetente || "Não informado",
      sharedMode:"manual-sync",
      isShared:true,
      receivedAt:new Date().toISOString(),
      importedAt:new Date().toISOString(),
      lastSyncedAt:new Date().toISOString(),
    };

    const existing=JSON.parse(localStorage.getItem("tnl_lists")||"[]");
    if(wasListDeletedLocally(received)){
      setSharedLandingRecord(null);
      showToast("🗑 Esta lista já foi excluída neste aparelho",2200);
      return;
    }
    const already=existing.some(l=>((sharedId&&l.sharedId===sharedId)||l.id===received.id));
    if(!already){
      const nl=[received,...existing];
      setLists(nl);
      localStorage.setItem("tnl_lists",JSON.stringify(nl));
    }
    setCurrentList(received);
    setScreen("list");
    setSearch("");
    setCollapsedCats({});
    setSharedLandingRecord(null);
    try { window.history.replaceState({}, document.title, window.location.origin + "/"); } catch {}
    const actorName = getAppUserName() || "Usuário";
    if (received.sharedId) {
      appendSharedListEvent(received.sharedId, {
        type: "shared-accepted",
        actorName,
        targetName: record?.remetente || baseData.remetente || baseData.ownerName || "",
        listName: received.name || "Lista",
        listId: received.id,
        message: `${actorName} aceitou a lista "${received.name || "compartilhada"}".`,
      });
    }
    showToast("📲 Lista recebida aberta no Tá na Lista");
  },[showToast, addNotification]);

  const loadSharedListFromUrl=useCallback(async()=>{
    const embedded=extractEmbeddedListFromUrl();
    const sharedId=extractSharedIdFromUrl();
    if(!sharedId&&!embedded)return;
    setLoading(true);
    try{
      if(embedded){
        importSharedRecordToApp(null, embedded);
        return;
      }
      const record=await getSharedListRecord(sharedId);
      if(!record?.data)throw new Error("Lista compartilhada não encontrada.");
      setSharedPreviewExpanded(false);
      setSharedLandingRecord(record);
      if(!getAppUserName()){
        setUserNameModal(true);
      }
      // Mantém o link em formato de query string para evitar 404 em hospedagens SPA/Vercel sem rewrite.
      try { window.history.replaceState({}, document.title, window.location.origin + "/?lista=" + encodeURIComponent(sharedId)); } catch {}
    }catch(err){
      showToast("⚠️ Não foi possível abrir a lista: "+(err?.message||"erro"),5200);
    }finally{
      setLoading(false);
    }
  },[showToast,importSharedRecordToApp]);

  useEffect(()=>{loadSharedListFromUrl();},[loadSharedListFromUrl]);

  // ── Dialog de produto ─────────────────────────────────────────────────
  // ── Classificação por IA em tempo real ──────────────────────────────
  const [dlgLoading, setDlgLoading] = useState(false);

  const openProductDialog = async (name, existing=null, options={}) => {
    const mode = options?.mode || "pending";
    if (existing) {
      const cfg = getProductConfig(name);
      setDlgConfig(cfg);
      setDlgMarca("");
      setDlgTipo("");
      setDlgPeso(existing.peso||"");
      setDlgVolume(existing.volume||"");
      setDlgQty(existing.qty||1);
      setDlgUnit(existing.unit||cfg.unidades?.[0]||"unidade");
      setItemDialogMode(mode);
      setItemDialog({name});
      return;
    }
    // Novo item manual: abre diálogo simples e rápido, sem marca/tipo.
    const cfg = getProductConfig(name);
    setDlgLoading(false);
    setDlgConfig(cfg);
    setDlgMarca(""); setDlgTipo("");
    const preferredUnit = Array.isArray(cfg.unidades) && cfg.unidades.includes("pacote") ? "pacote" : (cfg.unidades?.[0] || "unidade");
    setDlgUnit(normalizeUnitValue(preferredUnit));
    setDlgQty(1);
    setDlgPeso(cfg.pesos?.[0] || "");
    setDlgVolume(!cfg.pesos?.length ? (cfg.volumes?.[0] || "") : "");
    setItemDialogMode(mode);
    setItemDialog({name});
  };

  const handleAddItem = async () => {
    const name = currentInput.trim();
    if (!name) return;
    await openProductDialog(name);
  };

  const confirmDialog = () => {
    const editedName = String(itemDialog?.name || "").trim();
    if (!editedName) { showToast("⚠️ Informe o nome do item"); return; }
    const unit = normalizeUnitValue(dlgUnit || "unidade");
    const qtyNumber = Number(String(dlgQty || 1).replace(",", "."));
    const decimalUnit = ["kg", "g", "L", "ml"].includes(unit);
    const embalagem = decimalUnit ? "" : (dlgPeso || dlgVolume || "");
    const newItem = normalizeListItem({
      name: editedName,
      marca: "",
      tipo: "",
      embalagem,
      peso: !decimalUnit && /(g|kg)/i.test(embalagem) ? embalagem : "",
      volume: !decimalUnit && /(ml|l)/i.test(embalagem) ? embalagem : "",
      qty: Number.isFinite(qtyNumber) && qtyNumber > 0 ? qtyNumber : 1,
      unit,
      price: null,
      checked: false,
      notFound: false
    });
    try {
      const memory = loadUserItemMemory();
      const key = normalizePlainText(newItem.name);
      if (key) {
        memory[key] = { name: newItem.name, unit: newItem.unit, detail: newItem.detail || newItem.embalagem || "", updatedAt: new Date().toISOString() };
        localStorage.setItem("tnl_item_memory", JSON.stringify(memory));
      }
    } catch {}
    if (itemDialogMode === "pantryReview") {
      if (pantryReviewEdit) {
        setPantryReviewCategories(prev => prev.map((cat,ci) => ci === pantryReviewEdit.catIndex ? {
          ...cat,
          items: (cat.items || []).map((it,ii) => ii === pantryReviewEdit.itemIndex ? newItem : it)
        } : cat));
      }
      setPantryReviewEdit(null);
      setItemDialog(null);
      setItemDialogMode("pending");
      showToast("✏️ Item da despensa atualizado");
      return;
    }
    if (itemDialogMode === "pantry") {
      if (editPendingIdx != null) {
        setPantryPendingItems(prev=>prev.map((it,i)=>i===editPendingIdx?newItem:it));
        setEditPendingIdx(null);
      } else {
        setPantryPendingItems(prev=>[...prev,newItem]);
      }
      setItemDialog(null);
      setItemDialogMode("pending");
      setPantryInput("");
      showToast("✅ Item adicionado à despensa");
      return;
    }
    if (itemDialogMode === "extra" && currentList) {
      const l = JSON.parse(JSON.stringify(currentList));
      let cat = l.categories.find(c => normalizePlainText(c.name) === normalizePlainText("Itens Extras"));
      if (!cat) {
        cat = { name: "Itens Extras", items: [] };
        l.categories.push(cat);
      }
      cat.items.push({ ...newItem, extra: true, checked: false, notFound: false });
      l.categories = sanitizeCategories(l.categories);
      updateList(l);
      setItemDialog(null);
      setItemDialogMode("pending");
      setCurrentInput("");
      setExName(""); setExQty(1); setExUnit("unidade"); setExPrice("");
      showToast("⭐ Item extra adicionado em seção própria!");
      return;
    }
    if (editPendingIdx != null) {
      setPendingItems(prev=>prev.map((it,i)=>i===editPendingIdx?newItem:it));
      setEditPendingIdx(null);
    } else {
      setPendingItems(prev=>[...prev,newItem]);
    }
    setItemDialog(null);
    setItemDialogMode("pending");
    setCurrentInput("");
    showToast(editPendingIdx!=null?"✏️ Atualizado":"✅ "+buildManualPreview()+" adicionado");
  };

  const editPendingItem=(idx)=>{
    setEditPendingIdx(idx);
    openProductDialog(pendingItems[idx].name,pendingItems[idx]);
  };

  const handleAddPantryItem = async () => {
    const name = pantryInput.trim();
    if (!name) return;
    await openProductDialog(name, null, { mode: "pantry" });
  };

  const editPantryPendingItem = (idx) => {
    setEditPendingIdx(idx);
    openProductDialog(pantryPendingItems[idx].name, pantryPendingItems[idx], { mode: "pantry" });
  };

  const editPantryReviewItem = (catIndex, itemIndex) => {
    const item = pantryReviewCategories?.[catIndex]?.items?.[itemIndex];
    if (!item) return;
    setPantryReviewEdit({ catIndex, itemIndex });
    openProductDialog(item.name, item, { mode: "pantryReview" });
  };

  const removePantryReviewItem = (catIndex, itemIndex) => {
    setPantryReviewCategories(prev => prev
      .map((cat,ci) => ci === catIndex ? { ...cat, items: (cat.items || []).filter((_,ii) => ii !== itemIndex) } : cat)
      .filter(cat => (cat.items || []).length > 0)
    );
    showToast("🗑️ Item removido da despensa");
  };

  const organizePantry = async () => {
    if (pantryPendingItems.length === 0) { showToast("⚠️ Adicione itens à despensa"); return; }
    setLoading(true);
    try {
      let categories;
      const itemsWithMemory = applyUserMemoryToItems(pantryPendingItems);
      try { categories = await aiOrganize(itemsWithMemory, "mercado"); }
      catch { categories = demoOrganize(itemsWithMemory); }
      categories = enforceKnownCategoryRules(categories);
      setPantryReviewCategories(categories);
      setScreen("pantry_review");
    } finally { setLoading(false); }
  };

  const savePantryFromReview = () => {
    if (!pantryReviewCategories.length) { showToast("⚠️ Organize a despensa antes de salvar"); return; }
    const now = new Date().toISOString();
    if (pantryEditingId) {
      const updated = pantryLists.map(p => p.id === pantryEditingId ? {
        ...p,
        categories: pantryReviewCategories,
        itemCount: countCategoryItems(pantryReviewCategories),
        updatedAt: now,
      } : p);
      savePantryLists(updated);
      resetPantryFlow();
      setPantryCompared(false);
      setPantryComparison(null);
      setShowPantryComparisonDetails(false);
      setScreen("create");
      showToast("✅ Despensa atualizada");
      return;
    }
    const newPantry = {
      id: `pantry-${Date.now()}`,
      createdAt: now,
      status: "ativa",
      categories: pantryReviewCategories,
      itemCount: countCategoryItems(pantryReviewCategories),
    };
    const updated = [newPantry, ...pantryLists.map(p => p.status === "ativa" ? { ...p, status: "concluida", replacedAt: now } : p)];
    savePantryLists(updated);
    resetPantryFlow();
    setPantryCompared(false);
    setPantryComparison(null);
    setShowPantryComparisonDetails(false);
    setScreen("create");
    showToast("✅ Despensa salva e ativa");
  };

  const compareWithActivePantry = () => {
    if (!activePantry) { showToast("⚠️ Nenhuma despensa ativa"); return; }
    if (pendingItems.length === 0) { showToast("⚠️ Faça sua pré-lista antes de comparar"); return; }
    const result = comparePendingItemsWithPantry(pendingItems, activePantry.categories);
    setPendingItems(result.items);
    setPantryComparison(result);
    setPantryCompared(true);
    setShowPantryComparisonDetails(false);
    setScreen("pantry_compare_result");
  };

  const markActivePantryAsCompleted = useCallback((sourceList=null) => {
    const active = pantryLists.find(p => p.status === "ativa");
    if (!active) return;
    const now = new Date().toISOString();
    savePantryLists(pantryLists.map(p => p.id === active.id ? {
      ...p,
      status: "concluida",
      concludedAt: now,
      usedByListId: sourceList?.id || p.usedByListId || null,
      usedByListName: sourceList?.name || p.usedByListName || null,
    } : p));
  }, [pantryLists, savePantryLists]);


  const preserveEditedListStatus=(oldList,newCategories)=>{
    if(!oldList)return newCategories;
    const oldByName=new Map();
    (oldList.categories||[]).forEach(cat=>{
      (cat.items||[]).forEach(item=>{
        const key=normalizePlainText(item.name);
        if(key&&!oldByName.has(key))oldByName.set(key,item);
      });
    });
    return (newCategories||[]).map(cat=>({
      ...cat,
      items:(cat.items||[]).map(item=>{
        const old=oldByName.get(normalizePlainText(item.name));
        if(!old)return item;
        return {
          ...item,
          checked:Boolean(old.checked),
          notFound:Boolean(old.notFound),
          price:old.price ?? item.price ?? null,
          priceMode:old.priceMode || item.priceMode,
          purchaseWeightKg:old.purchaseWeightKg,
          originalQty:old.originalQty ?? item.originalQty ?? item.qty,
          qtyAdjusted:Boolean(old.qtyAdjusted),
        };
      })
    }));
  };

  // ── Organizar ─────────────────────────────────────────────────────────
  const organizeList=async()=>{
    if(pendingItems.length===0){showToast("⚠️ Adicione pelo menos um item");return;}
    setLoading(true);
    try{
      let categories;
      const itemsWithMemory=applyUserMemoryToItems(pendingItems);
      try{categories=await aiOrganize(itemsWithMemory,listType);}
      catch{categories=demoOrganize(itemsWithMemory);showToast("⚠️ IA indisponível — organização básica");}
      categories=enforceKnownCategoryRules(categories);
      saveUserItemMemoryFromCategories(categories);
      const now=new Date().toISOString();
      const editingOriginal=editingListId?lists.find(l=>l.id===editingListId):null;
      if(editingOriginal){
        categories=preserveEditedListStatus(editingOriginal,categories);
      }
      let newList=editingOriginal
        ? {...editingOriginal,name:listName.trim()||editingOriginal.name||"Minha lista",type:listType,budget:parseBRL(budgetText)||0,categories,lastEditedAt:now,lastSyncedAt:now,total:0,isShared:editingOriginal.isShared===true}
        : {id:Date.now().toString(),name:listName.trim()||"Minha lista",type:listType,budget:parseBRL(budgetText)||0,categories,createdAt:now,lastSyncedAt:now,total:0,isShared:false};

      // Toda lista criada pelo usuário passa a ser salva também na nuvem.
      // Assim ela aparece no computador e no celular com o mesmo nome de usuário.
      newList=await persistListRecordToCloud(newList,{silent:false});

      const nl=editingOriginal
        ? lists.map(l=>l.id===editingOriginal.id?newList:l)
        : [newList,...lists];
      saveLists(nl);
      setPendingItems([]);setListName("");setBudgetText("");setBudgetEnabled(false);setListType("mercado");setCurrentInput("");setListNameConfirmed(false);setBudgetConfirmed(false);setEditingListId(null);
      setSearch("");setCollapsedCats({});
      if(editingOriginal){
        setCurrentList(null);
        setScreen("home");
      }else{
        setCurrentList(newList);
        setScreen("list");
      }
      showToast(editingOriginal?"✅ Alterações salvas. Voltando para o início.":"✅ Lista organizada!");
    }finally{setLoading(false);}
  };

  // ── Reutilizar lista ─────────────────────────────────────────────────
  const reuseList=(list)=>{
    setListName(list.name+" (copia)");
    setListType(list.type);
    setBudgetText(list.budget>0?fmtBRL(list.budget):"");
    setBudgetEnabled(list.budget>0);
    setBudgetConfirmed(false);
    setListNameConfirmed(false);
    const items=list.categories.flatMap(c=>c.items.map(i=>normalizeListItem({name:i.name,marca:"",tipo:i.detail||"",embalagem:"",peso:"",volume:"",qty:i.qty,unit:i.unit,price:null,checked:false,notFound:false})));
    setPendingItems(items);
    setScreen("create");
    setReuseModal(null);
  };

  // ── Importar texto colado / foto ───────────────────────────────────────
  const normalizePastedShoppingLines=(text)=>{
    const raw=String(text||"")
      .replace(/\r/g,"\n")
      .replace(/[\u2022\u25CF\u25E6\u2043]/g,"\n• ")
      .replace(/[✅☑️✔️]/g,"\n")
      .replace(/[🛒📌📍]/g," ");

    const firstPass=raw
      .split(/\n+/)
      .map(line=>line.trim())
      .filter(Boolean);

    const expanded=[];
    for(const originalLine of firstPass){
      let line=originalLine
        .replace(/^[-–—*•]+\s*/,"")
        .replace(/^\d{1,3}[.)-]\s*/,"")
        .replace(/^\[[ xX]?\]\s*/,"")
        .trim();

      if(!line)continue;
      if(/^(lista|compras?|mercado|supermercado|orçamento|total|observa[cç][aã]o)/i.test(line) && line.length<35)continue;
      if(/^https?:\/\//i.test(line))continue;

      // Se o WhatsApp colou vários itens na mesma linha, separa antes de cada nova quantidade/unidade.
      const inlineParts=line
        .replace(/\s+(?=\d+[,.]?\d*\s*(?:kg|g|l|lt|litro|litros|ml|un|und|unidade|unidades|pct|pacote|pacotes|cx|caixa|caixas|lata|latas|garrafa|garrafas|fardo|fardos)\b)/gi,"\n")
        .split(/\n+/)
        .map(p=>p.trim())
        .filter(Boolean);

      const parts=inlineParts.length>1 ? inlineParts : [line];
      for(const part of parts){
        // Só divide por ponto e vírgula ou barra vertical. Vírgula é preservada para não quebrar decimais nem nomes.
        const semiParts=part.split(/\s*[;|]\s*/).map(p=>p.trim()).filter(Boolean);
        expanded.push(...semiParts);
      }
    }

    return expanded
      .map(line=>line.replace(/\s{2,}/g," ").trim())
      .filter(line=>line.length>1);
  };

  const parseListTextToItems=(text)=>{
    const lines=normalizePastedShoppingLines(text);
    return lines.map(line=>{
      let clean=line.trim();
      let qty=1,unit="unidade";

      const qPatterns=[
        /^(\d+[,.]?\d*)\s*[xX]\s+(.+)$/,
        /^(\d+[,.]?\d*)\s*(kg|g|l|lt|litro|litros|ml|un|und|unidade|unidades|pct|pacote|pacotes|cx|caixa|caixas|lata|latas|garrafa|garrafas|fardo|fardos)\b\s*(.+)$/i,
        /^(.+?)\s+[-–—]?\s*(\d+[,.]?\d*)\s*(kg|g|l|lt|litro|litros|ml|un|und|unidade|unidades|pct|pacote|pacotes|cx|caixa|caixas|lata|latas|garrafa|garrafas|fardo|fardos)\b$/i,
        /^(\d+[,.]?\d*)\s+(.+)$/,
      ];

      for(const p of qPatterns){
        const m=clean.match(p);
        if(!m)continue;

        if(p===qPatterns[2]){
          const n=parseFloat(m[2].replace(",","."));
          if(!isNaN(n)&&n>0&&n<10000){
            clean=m[1].trim();
            qty=n;
            unit=normalizeUnitValue(m[3]);
            break;
          }
        }else{
          const n=parseFloat(m[1].replace(",","."));
          if(!isNaN(n)&&n>0&&n<10000){
            qty=n;
            if(m.length===4){unit=normalizeUnitValue(m[2]);clean=m[3].trim();}
            else{clean=m[2].trim();}
            break;
          }
        }
      }

      clean=clean
        .replace(/^[-–—*•]+\s*/,"")
        .replace(/^\d{1,3}[.)-]\s*/,"")
        .replace(/\s{2,}/g," ")
        .trim();

      return normalizeListItem({name:clean,marca:"",tipo:"",embalagem:"",peso:"",volume:"",qty,unit,price:null,checked:false,notFound:false});
    }).filter(i=>i.name.length>0);
  };

  const importTextAsPendingItems=(text,{closePaste=false,closePhoto=false}={})=>{
    const items=parseListTextToItems(text);
    const normalizedItems=applyUserMemoryToItems(items).map(normalizeListItem);
    if(!normalizedItems.length){showToast("⚠️ Nenhum item encontrado");return;}
    setPendingItems(prev=>[...prev,...normalizedItems]);
    if(closePaste){setPasteText("");setShowPasteModal(false);}
    if(closePhoto){setOcrText("");setOcrFileName("");setOcrProgress(0);setShowPhotoModal(false);}
    showToast("✅ "+items.length+" itens importados!");
  };

  const importTextAsPendingItemsWithAI=async(text,{closePaste=false,source="texto"}={})=>{
    const clean=String(text||"").trim();
    if(!clean){showToast("⚠️ Nenhum item informado");return;}
    setVoiceProcessing(source==="voz");
    setLoading(true);
    try{
      let items=[];
      if(source==="voz"){
        try{
          items=await aiParseShoppingTextProfessional(clean,listType);
        }catch(err){
          console.warn("IA indisponível para interpretar voz; usando parser local profissional.",err);
          items=parseSpokenShoppingItemsProfessional(clean);
          showToast("⚠️ IA indisponível — parser local aplicado",3200);
        }
      }else{
        try{
          items=await aiParseShoppingTextProfessional(clean,listType);
        }catch(err){
          console.warn("IA indisponível para interpretar texto; usando importação simples.",err);
          items=parseListTextToItems(clean);
          showToast("⚠️ IA indisponível — importação simples aplicada",3200);
        }
      }
      items=repairAndNormalizeVoiceItems(items).map(normalizeListItem);
      items=applyUserMemoryToItems(items).map(normalizeListItem);
      if(!items.length){showToast("⚠️ Nenhum item encontrado");return;}
      const target = source === "voz" ? voiceTargetRef.current : pasteTarget;
      if (target === "pantry") setPantryPendingItems(prev=>[...prev,...items]);
      else setPendingItems(prev=>[...prev,...items]);
      if(closePaste){setPasteText("");setShowPasteModal(false);setPasteTarget("list");}
      showToast(source==="voz" ? `🎤 ${items.length} item(ns) adicionados por voz` : `✅ ${items.length} item(ns) interpretados pela IA`,2800);
    }finally{
      setVoiceProcessing(false);
      setLoading(false);
    }
  };

  const parsePastedText=()=>{
    const clean=String(pasteText||"").trim();
    if(!clean){showToast("⚠️ Nenhum item informado");return;}

    // Para listas coladas do WhatsApp, o parser local é mais seguro: preserva as quebras de linha e evita a IA juntar vários itens.
    const localItems=parseListTextToItems(clean);
    const hasListShape=/\n|;|\||^[\s•\-*\d.)]+/m.test(clean);
    if(hasListShape && localItems.length>=2){
      const normalizedItems=applyUserMemoryToItems(localItems).map(normalizeListItem);
      if (pasteTarget === "pantry") setPantryPendingItems(prev=>[...prev,...normalizedItems]);
      else setPendingItems(prev=>[...prev,...normalizedItems]);
      setPasteText("");
      setShowPasteModal(false);
      setPasteTarget("list");
      showToast(`✅ ${normalizedItems.length} item(ns) importados da lista colada`,2800);
      return;
    }

    importTextAsPendingItemsWithAI(clean,{closePaste:true,source:"texto"});
  };

  const stopVoiceSilenceTimer=()=>{
    if(voiceSilenceTimerRef.current){
      clearTimeout(voiceSilenceTimerRef.current);
      voiceSilenceTimerRef.current=null;
    }
  };

  const stopVoiceVolumeMonitor=()=>{
    if(voiceVolumeMonitorRef.current){
      cancelAnimationFrame(voiceVolumeMonitorRef.current);
      voiceVolumeMonitorRef.current=null;
    }
  };

  const releaseVoiceResources=()=>{
    stopVoiceSilenceTimer();
    stopVoiceVolumeMonitor();
    try{voiceMediaStreamRef.current?.getTracks?.().forEach(track=>track.stop());}catch{}
    try{voiceAudioContextRef.current?.close?.();}catch{}
    voiceMediaStreamRef.current=null;
    voiceAudioContextRef.current=null;
    voiceAnalyserRef.current=null;
  };

  const getPreferredVoiceMimeType=()=>{
    if(typeof MediaRecorder==="undefined")return "";
    const candidates=[
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
      "audio/wav"
    ];
    return candidates.find(type=>MediaRecorder.isTypeSupported?.(type))||"";
  };

  const getVoiceFileExtension=(mimeType)=>{
    const type=String(mimeType||"").toLowerCase();
    if(type.includes("mp4"))return "m4a";
    if(type.includes("aac"))return "aac";
    if(type.includes("wav"))return "wav";
    return "webm";
  };

  const finalizeRecordedVoice=async(blob)=>{
    releaseVoiceResources();
    setVoiceListening(false);
    if(!blob || blob.size<1200){
      showToast("⚠️ Nenhum áudio útil foi capturado. Tente falar mais próximo ao microfone.",4200);
      return;
    }

    const mimeType=blob.type||"audio/webm";
    const ext=getVoiceFileExtension(mimeType);
    const file=new File([blob],`lista-voz-${Date.now()}.${ext}`,{type:mimeType});

    setVoiceProcessing(true);
    setLoading(true);
    try{
      showToast("🎧 Transcrevendo sua fala...",2200);
      const transcript=await transcribeVoiceAudio(file);
      if(!transcript){
        showToast("⚠️ Não consegui identificar fala no áudio.",3600);
        return;
      }
      setPasteText(transcript);
      await importTextAsPendingItemsWithAI(transcript,{source:"voz"});
    }catch(err){
      console.error("Erro na transcrição por áudio:",err);
      showToast("⚠️ Não foi possível transcrever o áudio. Verifique o arquivo /api/transcribe e a chave OPENAI_API_KEY no Vercel.",6500);
    }finally{
      setVoiceProcessing(false);
      setLoading(false);
    }
  };

  const stopVoiceRecording=()=>{
    stopVoiceSilenceTimer();
    stopVoiceVolumeMonitor();
    const recorder=voiceMediaRecorderRef.current;
    if(recorder && recorder.state!=="inactive"){
      try{recorder.stop();}catch(err){console.warn("Erro ao parar gravação de voz:",err);releaseVoiceResources();setVoiceListening(false);}
    }else{
      releaseVoiceResources();
      setVoiceListening(false);
    }
  };

  const scheduleVoiceAutoStop=()=>{
    stopVoiceSilenceTimer();
    voiceSilenceTimerRef.current=setTimeout(()=>{
      if(voiceListening || voiceMediaRecorderRef.current){
        showToast("⏹️ Pausa detectada. Organizando o que foi falado...",2400);
        stopVoiceRecording();
      }
    },5200);
  };

  const startVoiceSilenceDetection=(stream)=>{
    try{
      const AudioContextClass=window.AudioContext||window.webkitAudioContext;
      if(!AudioContextClass){
        scheduleVoiceAutoStop();
        return;
      }
      const audioContext=new AudioContextClass();
      const source=audioContext.createMediaStreamSource(stream);
      const analyser=audioContext.createAnalyser();
      analyser.fftSize=2048;
      analyser.smoothingTimeConstant=0.82;
      source.connect(analyser);
      voiceAudioContextRef.current=audioContext;
      voiceAnalyserRef.current=analyser;

      const data=new Uint8Array(analyser.fftSize);
      const monitor=()=>{
        const recorder=voiceMediaRecorderRef.current;
        if(!recorder || recorder.state==="inactive")return;
        analyser.getByteTimeDomainData(data);
        let sum=0;
        for(let i=0;i<data.length;i++){
          const value=(data[i]-128)/128;
          sum+=value*value;
        }
        const rms=Math.sqrt(sum/data.length);
        const elapsed=Date.now()-(voiceRecordingStartedAtRef.current||Date.now());
        if(rms>0.018){
          voiceHasSoundRef.current=true;
          scheduleVoiceAutoStop();
        }else if(elapsed<2200 && !voiceHasSoundRef.current){
          scheduleVoiceAutoStop();
        }
        voiceVolumeMonitorRef.current=requestAnimationFrame(monitor);
      };
      scheduleVoiceAutoStop();
      monitor();
    }catch(err){
      console.warn("Monitoramento de silêncio indisponível:",err);
      scheduleVoiceAutoStop();
    }
  };

  const startVoiceInput=async()=>{
    if(voiceProcessing)return;

    if(voiceListening){
      stopVoiceRecording();
      return;
    }

    if(typeof navigator==="undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined"){
      showToast("⚠️ Gravação de áudio indisponível neste navegador. Atualize o iOS/Safari ou tente pelo Chrome.",5600);
      return;
    }

    try{
      voiceAudioChunksRef.current=[];
      voiceHasSoundRef.current=false;
      voiceRecordingStartedAtRef.current=Date.now();

      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      voiceMediaStreamRef.current=stream;
      const mimeType=getPreferredVoiceMimeType();
      const recorder=mimeType ? new MediaRecorder(stream,{mimeType}) : new MediaRecorder(stream);
      voiceMediaRecorderRef.current=recorder;

      recorder.ondataavailable=(event)=>{
        if(event.data && event.data.size>0)voiceAudioChunksRef.current.push(event.data);
      };

      recorder.onerror=(event)=>{
        console.warn("Erro no MediaRecorder:",event);
        showToast("⚠️ Houve erro ao gravar a fala.",3600);
        releaseVoiceResources();
        setVoiceListening(false);
      };

      recorder.onstop=()=>{
        const chunks=voiceAudioChunksRef.current||[];
        const type=recorder.mimeType||mimeType||"audio/webm";
        const blob=new Blob(chunks,{type});
        voiceAudioChunksRef.current=[];
        voiceMediaRecorderRef.current=null;
        finalizeRecordedVoice(blob);
      };

      recorder.start(500);
      setVoiceListening(true);
      showToast("🎤 Gravando. Fale vários itens em sequência; eu paro após alguns segundos de silêncio.",4200);
      startVoiceSilenceDetection(stream);
    }catch(err){
      console.error("Erro ao iniciar gravação de voz:",err);
      releaseVoiceResources();
      setVoiceListening(false);
      showToast("⚠️ Permita o uso do microfone para ditar a lista.",5200);
    }
  };

  const handlePhotoListFile=async(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    setOcrFileName(file.name||"foto da lista");
    setOcrText("");
    setOcrProgress(12);
    setOcrLoading(true);
    try{
      setOcrProgress(35);
      const text=normalizeOcrText(await readShoppingListFromImage(file));
      setOcrProgress(100);
      setOcrText(text);
      if(text)showToast("✅ Lista lida pela IA. Revise antes de importar.",3600);
      else showToast("⚠️ Não consegui identificar itens na foto. Tente enquadrar melhor a lista.",4200);
    }catch(err){
      console.error("Erro na leitura por foto:",err);
      showToast("⚠️ Não foi possível ler a foto pela IA. Tente outra imagem mais nítida.",4600);
    }finally{
      setOcrLoading(false);
      e.target.value="";
    }
  };

  // ── Progress e cálculo proporcional de preços ─────────────────────────
  const numberFromText=(value)=>{
    const n=Number(String(value||"").replace(/\./g,"").replace(",","."));
    return Number.isFinite(n)?n:null;
  };

  const normalizeUnitForCalc=(unit)=>String(unit||"unidade").trim().toLowerCase();

  const normalizeCalcNumber=(value, fallback=0)=>{
    if(value==null || value==="")return fallback;
    if(typeof value==="number")return Number.isFinite(value)?value:fallback;
    const clean=String(value).replace(/[^0-9,.-]/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");
    const n=Number(clean);
    return Number.isFinite(n)?n:fallback;
  };

  const normalizePriceMode=(mode)=>{
    const m=String(mode||"").trim();
    if(["total","perKg","perLiter","package","unit"].includes(m))return m;
    return "";
  };

  const inferDefaultPriceMode=(item)=>{
    const u=normalizeUnitForCalc(item?.unit);
    const name=normalizePlainText(item?.name||"");
    if(["kg","quilo","quilos","g","grama","gramas"].includes(u))return "perKg";
    if(["l","lt","litro","litros","ml","mililitro","mililitros"].includes(u))return "perLiter";
    if(/abacate|abobrinha|alcatra|alho|banana|batata|berinjela|beterraba|brocolis|carne|cebola|cenoura|chuchu|contrafile|costela|couve|file|frango|laranja|limao|maca|mamao|mandioca|manga|melancia|mel[aã]o|mortadela|paleta|patinho|peixe|pepino|picanha|presunto|queijo|repolho|salmao|tomate|uva/.test(name))return "perKg";
    return "unit";
  };

  const qtyToKg=(item)=>{
    const q=normalizeCalcNumber(item?.qty,0);
    const u=normalizeUnitForCalc(item?.unit);
    if(["kg","quilo","quilos"].includes(u))return q;
    if(["g","grama","gramas"].includes(u))return q/1000;
    const stored=normalizeCalcNumber(item?.purchaseWeightKg,0);
    return stored>0?stored:null;
  };

  const qtyToLiter=(item)=>{
    const q=normalizeCalcNumber(item?.qty,0);
    const u=normalizeUnitForCalc(item?.unit);
    if(["l","lt","litro","litros"].includes(u))return q;
    if(["ml","mililitro","mililitros"].includes(u))return q/1000;
    const stored=normalizeCalcNumber(item?.purchaseVolumeL,0);
    return stored>0?stored:null;
  };

  const getItemLineTotal=(item)=>{
    if(!item || item.price==null)return 0;
    const price=normalizeCalcNumber(item.price,0);
    if(price<=0)return 0;
    const mode=normalizePriceMode(item.priceMode) || inferDefaultPriceMode(item);
    if(mode==="total")return Number(price.toFixed(2));
    if(mode==="perKg"){
      const kg=qtyToKg(item);
      return Number(((kg!=null?price*kg:price)).toFixed(2));
    }
    if(mode==="perLiter"){
      const liters=qtyToLiter(item);
      return Number(((liters!=null?price*liters:price)).toFixed(2));
    }
    const qty=Math.max(1,normalizeCalcNumber(item.qty,1));
    return Number((price*qty).toFixed(2));
  };


  const rebuildLocalPriceHistoryFromLists=useCallback((sourceLists=lists)=>{
    try{
      const current=readPriceHistory();
      const byKey=new Map();
      for(const h of current){
        const key=[h.listId||"",h.itemId||"",h.itemKey||normalizePriceItemName(h.itemName),h.createdAt||"",Number(h.unitPrice||h.totalPrice||0)].join("|");
        byKey.set(key,h);
      }
      (Array.isArray(sourceLists)?sourceLists:[]).forEach(list=>{
        (Array.isArray(list?.categories)?list.categories:[]).forEach(cat=>{
          (Array.isArray(cat?.items)?cat.items:[]).forEach(item=>{
            const price=Number(item?.price||0);
            if(!item?.name || !Number.isFinite(price) || price<=0)return;
            const recordedAt=item.priceRecordedAt || item.updatedAt || list.updatedAt || list.lastSyncedAt || list.createdAt || new Date().toISOString();
            const itemKey=normalizePriceItemName(item.name);
            const listId=list.id || list.sharedId || "";
            const itemId=item.id || item.name || "";
            const key=[listId,itemId,itemKey,recordedAt,Number(price.toFixed(2))].join("|");
            if(byKey.has(key))return;
            const entry={
              id: typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():`price-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              itemName:String(item.name).trim(),
              itemKey,
              unitPrice:Number(price.toFixed(2)),
              totalPrice:Number(getItemLineTotal(item).toFixed(2)),
              quantity:Number(item.qty||1),
              unit:item.unit||"unidade",
              listType:list.type||"geral",
              listName:list.name||"",
              listId,
              itemId,
              createdAt:recordedAt,
              monthKey:new Date(recordedAt).toISOString().slice(0,7),
            };
            byKey.set(key,entry);
          });
        });
      });
      savePriceHistory(Array.from(byKey.values()).sort((a,b)=>String(a.createdAt||"").localeCompare(String(b.createdAt||""))));
    }catch(err){
      console.warn("Nao foi possivel reconstruir historico de precos",err);
    }
  },[lists,getItemLineTotal]);

  useEffect(()=>{
    rebuildLocalPriceHistoryFromLists(lists);
  },[lists,rebuildLocalPriceHistoryFromLists]);

  const getPriceDescription=(item)=>{
    if(!item || item.price==null)return "";
    const mode=item.priceMode||"unit";
    if(mode==="total")return "Preço total informado";
    if(mode==="perKg")return `Preço por kg: ${fmtR(item.price)}`;
    if(mode==="perLiter")return `Preço por litro: ${fmtR(item.price)}`;
    if(mode==="package")return `Preço por pacote: ${fmtR(item.price)}`;
    return `Preço unitário: ${fmtR(item.price)}`;
  };

  const getCompactUnitPriceLabel=(item)=>{
    if(!item || item.price==null)return "";
    const mode=item.priceMode || inferDefaultPriceMode(item);
    const unit=String(item.unit||"unidade").trim();
    if(mode==="perKg")return `${fmtR(item.price)}/kg`;
    if(mode==="perLiter")return `${fmtR(item.price)}/L`;
    if(mode==="package")return `${fmtR(item.price)}/pacote`;
    if(mode==="unit")return `${fmtR(item.price)}/${unit || "un"}`;
    return `Total informado`;
  };

  const getProgress=(list)=>{
    if(!list)return{totalItems:0,checkedItems:0,fullTotal:0,notFoundItems:0};
    let t=0,c=0,s=0,nf=0;
    list.categories.forEach(cat=>cat.items.forEach(i=>{t++;if(i.checked)c++;if(i.notFound)nf++;if(!i.notFound)s+=getItemLineTotal(i);}));
    return{totalItems:t,checkedItems:c,fullTotal:s,notFoundItems:nf};
  };

  const getBudgetResultSummary=(list)=>{
    if(!list)return null;
    const{totalItems,fullTotal}=getProgress(list);
    const listBudget=Number(list.budget||0);
    const finished=totalItems>0&&list.categories.every(c=>c.items.every(i=>i.checked||i.notFound));
    if(!finished||listBudget<=0)return null;
    const diff=listBudget-fullTotal;
    const saved=diff>=0;
    return{
      saved,
      diff:Math.abs(diff),
      text:saved?`Economizou ${fmtR(diff)}`:`Ultrapassou ${fmtR(Math.abs(diff))}`,
      bg:saved?"#ECFDF5":"#FEF2F2",
      color:saved?"#047857":"#B91C1C",
      border:saved?"#A7F3D0":"#FECACA",
      icon:saved?"✅":"⚠️"
    };
  };

  const formatListDate=(value)=>{
    try{
      const d=value?new Date(value):new Date();
      if(Number.isNaN(d.getTime()))return "Sem data";
      return d.toLocaleDateString("pt-BR");
    }catch{return "Sem data";}
  };

  const getListCardStats=(list)=>{
    const progress=getProgress(list);
    const listBudget=Number(list?.budget||0);
    const balance=listBudget-progress.fullTotal;
    return{
      ...progress,
      budget:listBudget,
      balance,
      balanceText:listBudget>0
        ? (balance>=0?`Economia atual: ${fmtR(balance)}`:`Estourou: ${fmtR(Math.abs(balance))}`)
        : "Sem orçamento definido",
      balanceColor:listBudget<=0?"#6B7280":balance>=0?"#047857":"#B91C1C",
      balanceBg:listBudget<=0?"#F9FAFB":balance>=0?"#ECFDF5":"#FEF2F2",
      balanceBorder:listBudget<=0?"#E5E7EB":balance>=0?"#A7F3D0":"#FECACA",
    };
  };

  const isListFinished=(list)=>{
    const total=(list?.categories||[]).reduce((s,c)=>s+(c.items||[]).length,0);
    return total>0 && (list?.categories||[]).every(c=>(c.items||[]).every(i=>i.checked||i.notFound));
  };

  const isRealSharedList=(list)=>Boolean(list?.sharedId && (list?.isShared === true || list?.imported === true));

  const isReadOnlyFinishedList=(list)=>Boolean(isListFinished(list) || list?.finishedAt);

  const blockFinishedListEdit=()=>{
    showToast("🔒 Lista finalizada. Faça uma cópia para usar ou editar.");
    returnToSearch();
    return true;
  };

  const openListForEdit=(list)=>{
    if(!list)return;
    if(isListFinished(list)){
      showToast("🔒 Lista finalizada. Faça uma cópia para editar.");
      setListMenuId(null);
      return;
    }

    const items=(list.categories||[]).flatMap(cat=>(cat.items||[]).map(item=>normalizeListItem({
      name:item.name,
      marca:item.marca||"",
      tipo:item.tipo||item.detail||"",
      embalagem:item.embalagem||item.detail||"",
      peso:item.peso||"",
      volume:item.volume||"",
      qty:item.qty||1,
      unit:item.unit||"unidade",
      price:null,
      checked:false,
      notFound:false,
      extra:Boolean(item.extra || cat.name==="Itens Extras")
    })));

    setEditingListId(list.id);
    setCurrentList(list);
    setListName(list.name||"Minha lista");
    setListType(list.type||"mercado");
    setBudgetText(Number(list.budget||0)>0?fmtBRL(Number(list.budget||0)):"");
    setBudgetEnabled(Number(list.budget||0)>0);
    setBudgetConfirmed(Boolean(Number(list.budget||0)>0));
    setListNameConfirmed(Boolean(list.name));
    setPendingItems(items);
    setCurrentInput("");
    setEditPendingIdx(null);
    setScreen("create");
    setSearch("");
    setCollapsedCats({});
    setListMenuId(null);
    showToast("✏️ Lista aberta para edição");
  };

  const duplicateList=(list)=>{
    if(!list)return;
    const copy={
      ...JSON.parse(JSON.stringify(list)),
      id:Date.now().toString(),
      name:(list.name||"Lista")+" (cópia)",
      sharedId:null,
      sharedAt:null,
      imported:false,
      importedFrom:null,
      restoredFromCloud:false,
      createdAt:new Date().toISOString(),
      total:0,
      categories:(list.categories||[]).map(cat=>({
        ...cat,
        items:(cat.items||[]).map(item=>({...item,checked:false,notFound:false,price:null}))
      }))
    };
    saveLists([copy,...lists]);
    setListMenuId(null);
    showToast("📄 Cópia criada");
  };

  const stopListSharing=async(list)=>{
    if(!list?.sharedId)return;
    const updated={...list,sharedId:null,sharedAt:null,isShared:false,sharedMode:null,restoredFromCloud:false};
    saveLists(lists.map(l=>l.id===list.id?updated:l));
    if(currentList?.id===list.id)setCurrentList(updated);
    setListMenuId(null);
    showToast("🔒 Compartilhamento encerrado neste aparelho");
    if(!list.imported){
      await deleteSharedListRecord(list.sharedId).catch(()=>false);
    }
  };

  const closeFinishedModal=()=>{
    markActivePantryAsCompleted(currentList);
    setShowFinished(false);
  };


  useEffect(()=>{
    if(!showFinished)return;
    const timer=setTimeout(()=>{
      markActivePantryAsCompleted(currentList);
      setShowFinished(false);
    },5000);
    return()=>clearTimeout(timer);
  },[showFinished,currentList]);

  const syncSharedListToCloud=useCallback(async(list,{silent=true,force=false}={})=>{
    const sharedId=list?.sharedId;
    if(!sharedId)return null;
    try{
      if(!silent)setSharedSyncing(true);

      // Proteção simples contra sobrescrita: antes de salvar, verifica se há
      // uma versão remota mais recente que a última versão vista neste aparelho.
      if(!force){
        const remote=await getSharedListRecord(sharedId).catch(()=>null);
        const remoteData=remote?.data;
        if(remoteData){
          const remoteStamp=getListSyncStamp(remoteData);
          const localKnownStamp=getListSyncStamp({lastSyncedAt:list?.lastCloudSeenAt || list?.lastSyncedAt});
          const remoteSignature=sharedListSignature(remoteData);
          const localSignature=sharedListSignature(list);
          const knownSignature=list?.lastRemoteSignature || "";
          const remoteChanged=remoteSignature && remoteSignature!==knownSignature && remoteSignature!==localSignature;
          if(remoteChanged && remoteStamp>=localKnownStamp){
            setSharedUpdateNotice({type:"conflict",msg:"Há uma versão mais recente. Toque em Atualizar antes de continuar."});
            if(!silent)showToast("⚠️ Existe uma versão mais recente desta lista. Toque em Atualizar antes de salvar.",6200);
            return null;
          }
        }
      }

      const remoteBeforeSave=await getSharedListRecord(sharedId).catch(()=>null);
      const remoteDataBeforeSave=remoteBeforeSave?.data && typeof remoteBeforeSave.data === "object" ? remoteBeforeSave.data : {};
      const remoteEvents=Array.isArray(remoteDataBeforeSave.sharedEvents) ? remoteDataBeforeSave.sharedEvents : [];
      const localEvents=Array.isArray(list?.sharedEvents) ? list.sharedEvents : [];
      const eventMap=new Map();
      [...remoteEvents, ...localEvents].forEach((evt)=>{ if(evt?.id) eventMap.set(evt.id, evt); });
      const mergedEvents=Array.from(eventMap.values()).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).slice(0,80);
      const payload={...remoteDataBeforeSave,...list,sharedEvents:mergedEvents,lastSyncedAt:new Date().toISOString(),lastSyncSource:getAppDeviceId()};
      const record=await updateSharedListRecord(sharedId,payload);
      const synced=markListCloudSynced(payload,record?.data||payload);
      setCurrentList(cur=>cur?.id===synced.id?{...cur,...synced}:cur);
      setLists(prev=>{
        const next=(Array.isArray(prev)?prev:[]).map(l=>l.id===synced.id || (sharedId&&l.sharedId===sharedId)?{...l,...synced}:l);
        try{localStorage.setItem("tnl_lists",JSON.stringify(next));}catch{}
        return next;
      });
      setSharedUpdateNotice({type:"ok",msg:"Lista sincronizada agora"});
      if(!silent)showToast("🔄 Lista compartilhada sincronizada");
      return record;
    }catch(err){
      console.warn("Falha ao sincronizar lista compartilhada",err);
      if(!silent)showToast("⚠️ Não foi possível sincronizar. Verifique a conexão e as permissões do Supabase.",5200);
      return null;
    }finally{
      if(!silent)setSharedSyncing(false);
    }
  },[showToast]);

  const refreshSharedListFromCloud=useCallback(async()=>{
    const sharedId=currentList?.sharedId;
    if(!sharedId)return;
    setSharedSyncing(true);
    try{
      const record=await getSharedListRecord(sharedId);
      if(!record?.data)throw new Error("Lista compartilhada não encontrada.");
      const currentUserName = getAppUserName();
      const remoteOwner = record?.remetente || record?.data?.remetente || record?.data?.ownerName || currentList.remetente || currentList.ownerName || currentUserName || "Não informado";
      const remoteOwnerIsCurrentUser = normalizeAuthName(remoteOwner) && normalizeAuthName(remoteOwner) === normalizeAuthName(currentUserName);
      const isReceivedFromAnotherUser = Boolean(currentList.imported === true || currentList.receivedAt || currentList.importedAt) && !remoteOwnerIsCurrentUser;
      const refreshed=markListCloudSynced({
        ...record.data,
        id:currentList.id,
        sharedId,
        // Não transformar lista própria sincronizada na nuvem em lista compartilhada.
        isShared: currentList.isShared === true || record?.data?.isShared === true,
        imported: isReceivedFromAnotherUser,
        importedFrom: isReceivedFromAnotherUser ? remoteOwner : null,
        remetente: remoteOwner,
        ownerName: record?.data?.ownerName || remoteOwner,
        sharedOwner: isReceivedFromAnotherUser ? remoteOwner : null,
        pulledAt:new Date().toISOString(),
      },record.data);
      setCurrentList(refreshed);
      const existing=JSON.parse(localStorage.getItem("tnl_lists")||"[]");
      const hasLocal=existing.some(l=>l.id===currentList.id || (sharedId&&l.sharedId===sharedId));
      const nl=hasLocal
        ? existing.map(l=>(l.id===currentList.id || (sharedId&&l.sharedId===sharedId))?refreshed:l)
        : [refreshed,...existing];
      setLists(nl);
      localStorage.setItem("tnl_lists",JSON.stringify(nl));
      setSharedUpdateNotice({type:"ok",msg:"Atualizada agora"});
      showToast("🔄 Lista atualizada");
    }catch(err){
      console.warn("Falha ao atualizar lista compartilhada",err);
      showToast("⚠️ Não foi possível atualizar a lista compartilhada",5200);
    }finally{
      setSharedSyncing(false);
    }
  },[currentList,showToast]);



  useEffect(()=>{
    // Atualização automática deve ocorrer somente para lista realmente compartilhada/recebida.
    // Lista própria salva na nuvem não pode ser recarregada automaticamente ao abrir o histórico,
    // pois uma cópia remota antiga pode desmarcar itens já finalizados.
    if(screen!=="list" || !currentList?.sharedId || !isRealSharedList(currentList))return;
    const lastPull=getListSyncStamp({lastSyncedAt:currentList.lastCloudSeenAt || currentList.pulledAt});
    if(lastPull && Date.now()-lastPull<45000)return;
    const now=Date.now();
    if(now-(autoSyncNoticeRef.current||0)<45000)return;
    autoSyncNoticeRef.current=now;
    refreshSharedListFromCloud().catch(()=>null);
  },[screen,currentList?.id,currentList?.sharedId,currentList?.isShared,currentList?.imported]);

  // Etapa 4: sincronização manual.
  // A lista compartilhada é atualizada pelo botão “Atualizar”, evitando
  // conflito e notificações excessivas durante a compra.

  const getCatSubtotal=(cat)=>cat.items.reduce((s,i)=>s+(i.notFound?0:getItemLineTotal(i)),0);

  const updateList=(ul)=>{
    const{fullTotal}=getProgress(ul);ul.total=fullTotal;
    const updated={...ul,total:fullTotal,lastLocalUpdateAt:new Date().toISOString(),dirtySinceLastSync:Boolean(ul.sharedId)};
    setCurrentList(updated);
    saveLists(lists.map(l=>l.id===updated.id?updated:l));
    // Mantém a nuvem atualizada também para listas próprias, mas sem tratá-las como compartilhadas
    // e sem gerar notificações. Isso evita que listas finalizadas voltem do histórico com itens desmarcados.
    if(updated.sharedId){
      syncSharedListToCloud(updated,{silent:true,force:!isRealSharedList(updated)});
    }
  };

  const toggleCheck=(ci,ii)=>{
    if(isReadOnlyFinishedList(currentList))return blockFinishedListEdit();
    const item=currentList.categories[ci].items[ii];
    if(item.notFound){
      showToast("⚠️ Item em falta. Volte para pendente antes de marcar como adquirido.");
      returnToSearch();
      return;
    }
    if(item.checked){
      const l=JSON.parse(JSON.stringify(currentList));
      l.categories[ci].items[ii].checked=false;
      l.categories[ci].items[ii].price=null;
      updateList(l);
      returnToSearch();
      return;
    }
    setCheckPopup({ci,ii});
  };
  const toggleNotFound=(ci,ii)=>{
    if(isReadOnlyFinishedList(currentList))return blockFinishedListEdit();
    const l=JSON.parse(JSON.stringify(currentList));
    const item=l.categories[ci].items[ii];
    item.notFound=!item.notFound;
    if(item.notFound){ item.checked=false; item.price=null; }
    updateList(l); returnToSearch();
    showToast(item.notFound?"❌ Item marcado em falta":"↩️ Item voltou para pendente");
  };

  const openItemModal=(ci,ii)=>{
    if(isReadOnlyFinishedList(currentList))return blockFinishedListEdit();
    const item=currentList.categories[ci].items[ii];
    if(item?.notFound){
      showToast("⚠️ Item em falta. Use o botão de falta para voltar a pendente.");
      return;
    }
    const defaultMode=item.priceMode || inferDefaultPriceMode(item);
    setItemModal({ci,ii});
    setMQty(item.qty||1);
    setMQtyText(formatQtyDisplay(item.qty||1));
    setMPriceMode(defaultMode);
    setMPriceText(item.price!=null?fmtBRL(item.price):"");
    setMWeightText(item.purchaseWeightKg?String(item.purchaseWeightKg).replace(".",","):"");
    setMNotFound(false);
  };

  const confirmItem=()=>{
    if(isReadOnlyFinishedList(currentList)){ setItemModal(null); return blockFinishedListEdit(); }
    const l=JSON.parse(JSON.stringify(currentList));
    const item=l.categories[itemModal.ci].items[itemModal.ii];
    const confirmedQty=numberFromText(mQtyText) || Number(mQty||1) || 1;
    const previousQty=Number(item.qty||1);
    if(item.originalQty==null)item.originalQty=previousQty;
    item.qty=confirmedQty;
    item.qtyAdjusted=Number(item.qty||0)!==Number(item.originalQty||0);
    item.notFound=mNotFound;
    if(mNotFound){
      item.checked=false;item.price=null;
    } else {
      const p=parseBRL(mPriceText);
      if(p!=null&&p>=0){
        item.price=p;
        item.priceRecordedAt=new Date().toISOString();
        item.priceMode=normalizePriceMode(mPriceMode) || normalizePriceMode(item.priceMode) || inferDefaultPriceMode(item);
        if(item.priceMode==="perKg"){
          const kg=numberFromText(mWeightText);
          if(kg&&kg>0)item.purchaseWeightKg=kg;
          else delete item.purchaseWeightKg;
        } else {
          delete item.purchaseWeightKg;
        }
      }
      item.checked=true;
      try {
        const totalForHistory = getItemLineTotal(item);
        addPriceHistoryEntry({
          itemName: item.name,
          unitPrice: Number(item.price || 0),
          totalPrice: Number(totalForHistory || item.price || 0),
          quantity: Number(item.qty || 1),
          unit: item.unit || "unidade",
          listType: currentList?.type || listType,
          listName: currentList?.name || listName,
          listId: currentList?.id || "",
          itemId: item.id || item.name || "",
          recordedAt: item.priceRecordedAt || new Date().toISOString()
        });
      } catch {}
    }
    const listHasItems = l.categories.reduce((s,c)=>s+c.items.length,0)>0;
    const allDone = listHasItems && l.categories.every(c=>c.items.every(i=>i.checked||i.notFound));
    const actorName = getAppUserName() || "Usuário";
    const isReallyShared = l.isShared === true && Boolean(l.sharedId);

    if (!mNotFound && !l.startedAt) {
      l.startedAt = new Date().toISOString();
      if (isReallyShared) {
        const startedEvent = buildSharedListEvent(l.sharedId, l, {
          type:"started",
          actorName,
          targetName:l.ownerName || l.remetente || l.sharedOwner || "",
          message:`${actorName} iniciou as aquisições da lista "${l.name || "compartilhada"}".`,
        });
        Object.assign(l, addLocalSharedEventToList(l, startedEvent));
        appendSharedListEvent(l.sharedId, startedEvent);
      }
    }

    if (allDone && !l.finishedAt) {
      l.finishedAt = new Date().toISOString();
      if (isReallyShared) {
        const finishedEvent = buildSharedListEvent(l.sharedId, l, {
          type:"finished",
          actorName,
          targetName:l.ownerName || l.remetente || l.sharedOwner || "",
          message:`${actorName} finalizou a lista "${l.name || "compartilhada"}".`,
        });
        Object.assign(l, addLocalSharedEventToList(l, finishedEvent));
        appendSharedListEvent(l.sharedId, finishedEvent);
      }
    }

    updateList(l);
    showToast(mNotFound?"❌ Nao encontrado":"✅ "+item.name);
    setItemModal(null);
    returnToSearch();
    if(allDone)setTimeout(()=>setShowFinished(true),400);
  };

  const removeItem=()=>{
    if(isReadOnlyFinishedList(currentList)){ setItemModal(null); return blockFinishedListEdit(); }
    const l=JSON.parse(JSON.stringify(currentList));
    l.categories[itemModal.ci].items.splice(itemModal.ii,1);
    if(l.categories[itemModal.ci].items.length===0)l.categories.splice(itemModal.ci,1);
    updateList(l);setItemModal(null);showToast("🗑 Removido");
  };

  const quickAdjust=(ci,ii,delta)=>{
    if(isReadOnlyFinishedList(currentList))return blockFinishedListEdit();
    const l=JSON.parse(JSON.stringify(currentList));
    const item=l.categories[ci].items[ii];
    const newQty=Math.max(0.5,Math.round(((Number(item.qty)||1)+delta)*10)/10);
    if(item.originalQty==null)item.originalQty=Number(item.qty||1);
    item.qty=newQty;
    item.qtyAdjusted=Number(item.qty||0)!==Number(item.originalQty||0);
    updateList(l);
    returnToSearch();
    showToast(delta>0?"+" +delta+" "+item.name:delta+" "+item.name);
  };

  const getSuggestions=()=>{
    if(!currentList||budgetDiff===null||budgetDiff>=0)return[];
    const overBy=Math.abs(budgetDiff);
    const superfluous=["Bebidas Alcoólicas","Cervejas","Vinhos","Destilados","Snacks","Doces","Chocolates","Itens Extras"];
    const candidates=[];

    currentList.categories.forEach((cat,ci)=>{
      const isSuper=superfluous.some(s=>cat.name.includes(s));
      cat.items.forEach((item,ii)=>{
        if(!item.checked||item.price==null)return;
        const total=getItemLineTotal(item);
        if((item.qty||1)>1){
          candidates.push({ci,ii,name:item.name,qty:item.qty,price:item.price,tipo:"reduzir",catName:cat.name,economy:item.price,priority:isSuper?1:2});
        }
        candidates.push({ci,ii,name:item.name,qty:item.qty||1,price:item.price,tipo:"remover",catName:cat.name,economy:total,priority:isSuper||cat.name==="Itens Extras"?0:3});
      });
    });

    candidates.sort((a,b)=>a.priority-b.priority||b.economy-a.economy);
    const selected=[];
    let acc=0;
    const usedRemove=new Set();
    for(const item of candidates){
      const key=item.ci+":"+item.ii;
      if(item.tipo==="reduzir"&&usedRemove.has(key))continue;
      selected.push(item);
      acc+=item.economy;
      if(item.tipo==="remover")usedRemove.add(key);
      if(acc>=overBy)break;
    }
    return selected;
  };

  const addExtra=()=>{
    if(isReadOnlyFinishedList(currentList)){ setExtraModal(false); return blockFinishedListEdit(); }
    if(!exName.trim()){showToast("⚠️ Digite o nome");return;}
    const l=JSON.parse(JSON.stringify(currentList));
    let cat=l.categories.find(c=>c.name==="Itens Extras");
    if(!cat){cat={name:"Itens Extras",items:[]};l.categories.push(cat);}
    cat.items.push({name:exName.trim(),detail:"",qty:exQty,originalQty:exQty,unit:exUnit,price:parseBRL(exPrice),priceMode:parseBRL(exPrice)!=null?"total":undefined,checked:false,notFound:false,extra:true});
    l.categories = sanitizeCategories(l.categories);
    updateList(l);setExtraModal(false);
    setExName("");setExQty(1);setExUnit("unidade");setExPrice("");
    showToast("⭐ Item extra adicionado!");
  };

  const deleteList=async(id)=>{
    const target=lists.find(l=>l.id===id || l.sharedId===id);
    if(!target){setConfirmDelete(null);return;}

    // Marca a lista como excluída neste aparelho antes de recarregar do Supabase.
    // Isso impede que listas apagadas reapareçam em "Listas Recentes" após fechar o app ou reiniciar o celular.
    markListAsDeletedLocally(target);

    const targetKeys=new Set(getListPersistenceKeys(target));
    const sameList=(l)=>(
      (target.id && l.id===target.id) ||
      (target.sharedId && l.sharedId===target.sharedId) ||
      getListPersistenceKeys(l).some(key=>targetKeys.has(key))
    );
    const nl=lists.filter(l=>!sameList(l));
    saveLists(nl);
    setConfirmDelete(null);
    setListMenuId(null);

    if(currentList && sameList(currentList)){
      setCurrentList(null);
      setScreen("home");
    }

    showToast("🗑 Lista excluída");

    // Se a lista foi criada pelo próprio usuário e possui registro no Supabase, tenta excluir também no servidor.
    // Se for lista recebida, ou se o DELETE for bloqueado por RLS, oculta a lista para este usuário/dispositivo.
    if(target.sharedId){
      let removedFromCloud=false;
      let persistedDeletion=false;

      // Primeiro grava uma marca de exclusão no próprio registro remoto.
      // Assim, mesmo que o usuário limpe o histórico/cache ou troque de aba/dispositivo,
      // a lista não volta a ser restaurada no login seguinte.
      persistedDeletion=await softDeleteSharedListRecord(target.sharedId,target);

      // Depois tenta o DELETE físico. Se o Supabase/RLS bloquear, a marca remota acima
      // continua sendo a fonte de verdade para não recarregar a lista excluída.
      if(!target.imported){
        removedFromCloud=await deleteSharedListRecord(target.sharedId);
      }

      if(!removedFromCloud && !persistedDeletion){
        await hideSharedListRecordForCurrentUser(target.sharedId);
        showToast("🗑 Lista removida da sua conta",1800);
      }
    }
  };

  const getSenderName=()=>{
    const clean=saveAppUserName(senderName || getAppUserName());
    if(clean){
      registerAppUser(clean);
      return clean;
    }
    return "Usuário do Tá na Lista";
  };

  const withSender=(list)=>{
    if(!list)return null;
    const name=getSenderName();
    return {...list,remetente:name,ownerName:name};
  };

  // ── Compartilhamento da lista ─────────────────────────────────────────────
  const shareWhatsApp=async(listArg=null)=>{
    const list=withSender(listArg||shareTargetList||currentList);
    if(!list)return;
    try{
      showToast("🔗 Gerando link da lista...");
      const{link,list:published}=await publishSharedList(list);
      const text=buildShareInviteText(published,link);
      openWhatsAppDirect(text);
      showToast("✅ WhatsApp aberto para envio da lista.",3200);
    }catch(err){
      console.error("Erro ao compartilhar no WhatsApp:",err);
      showToast("⚠️ Não foi possível gerar o link curto. Verifique as variáveis do Supabase e as permissões da tabela.",7500);
    }
  };

  const shareTelegram=async(listArg=null)=>{
    const list=withSender(listArg||shareTargetList||currentList);
    if(!list)return;
    const preparedWindow=window.open("about:blank","_blank");
    try{
      showToast("🔗 Gerando link da lista...");
      const{link,list:published}=await publishSharedList(list);
      const text=buildShareInviteText(published,link);
      const url="https://telegram.me/share/url?url="+encodeURIComponent(link)+"&text="+encodeURIComponent(text);
      openShareWindow(url,preparedWindow);
    }catch(err){
      if(preparedWindow&&!preparedWindow.closed)preparedWindow.close();
      showToast("⚠️ Não foi possível enviar pelo Telegram: "+(err?.message||"verifique o Supabase"),6500);
    }
  };

  const shareOtherApps=async(listArg=null)=>{
    const list=withSender(listArg||shareTargetList||currentList);
    if(!list)return;
    try{
      showToast("🔗 Gerando link da lista...");
      const{link,list:published}=await publishSharedList(list);
      const text=buildShareInviteText(published,link);
      if(navigator.share){
        await navigator.share({title:"Tá na Lista — "+published.name,text,url:link}).catch(()=>null);
      }else if(navigator.clipboard){
        await navigator.clipboard.writeText(text);
        showToast("📋 Link da lista copiado!");
      }
    }catch(err){
      showToast("⚠️ Erro ao gerar link: "+(err?.message||"verifique o Supabase"),6500);
    }
  };

  const{totalItems,checkedItems,fullTotal}=getProgress(currentList);
  const budget=currentList?.budget||0;
  const budgetDiff=budget>0?budget-fullTotal:null;
  const rawBudgetPct=budget>0?(fullTotal/budget)*100:0;
  const pct=budget>0?Math.min(100,rawBudgetPct):totalItems>0?(checkedItems/totalItems)*100:0;
  const budgetPctLabel=budget>0?Math.round(rawBudgetPct):Math.round(pct);
  const progressColor=budget>0?(rawBudgetPct<=75?"#34D399":rawBudgetPct<=100?"#FBBF24":"#F87171"):(pct<50?"#34D399":pct<80?"#FBBF24":"#F87171");

  // ── Preview do item no diálogo ────────────────────────────────────────
  const dlgPreview=itemDialog?[dlgQty+" "+dlgUnit,dlgTipo,itemDialog.name,dlgPeso||dlgVolume].filter(Boolean).join(" · "):"";

  // ─────────────────────────────────────────────────────────────────────
  if(showNotificationsScreen) return <NotificationsScreen notifications={notifications} onBack={()=>setShowNotificationsScreen(false)} onMarkAllRead={markAllNotificationsRead} />;
  if(showPriceStatsScreen) return <PriceStatsScreen lists={lists} onBack={()=>setShowPriceStatsScreen(false)} />;

  // Login leve e isolado: evita renderizar toda a tela principal por baixo do modal.
  // Isso deixa o campo clicável imediatamente no smartphone e elimina a sensação de tela bloqueada.
  if(userNameModal) return (
    <div style={{width:"100%",maxWidth:430,minWidth:0,margin:"0 auto",minHeight:"100dvh",background:"linear-gradient(180deg,#EEF2FF 0%,#FFFFFF 58%,#F8FAFC 100%)",fontFamily:"Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",position:"relative",overflowX:"clip",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",padding:"max(18px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-left)) max(18px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-right))",touchAction:"manipulation",WebkitTapHighlightColor:"transparent",isolation:"isolate"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 10%,rgba(139,92,246,0.16),transparent 34%),radial-gradient(circle at 92% 0%,rgba(34,197,94,0.12),transparent 28%)",pointerEvents:"none"}} />
      <div style={{width:"100%",maxWidth:390,background:"#FFFFFF",borderRadius:28,padding:22,boxShadow:"0 24px 70px rgba(17,24,39,0.14)",border:"1px solid rgba(229,231,235,0.95)",position:"relative",zIndex:1,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><AppLogo size={58} radius={18} /></div>
          <div style={{fontWeight:900,fontSize:20,color:"#111827",marginBottom:6}}>{sharedLandingRecord?"Identifique-se para acessar a lista":"Bem-vindo ao Tá na Lista"}</div>
          <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45}}>{sharedLandingRecord?"Informe seu nome e PIN para abrir a lista recebida com segurança.":"Informe seu nome e PIN para acessar suas listas com segurança."}</div>
        </div>
        <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>Como podemos te chamar?</label>
          <input value={userNameInput} onChange={e=>setUserNameInput(e.target.value)} placeholder="Ex: Cadu" autoFocus
            style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"13px 13px",fontSize:16,fontWeight:800,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",touchAction:"manipulation"}}
            onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
          />
        </div>
        <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>{isRecoverPinMode?"Novo PIN":"PIN de acesso"}</label>
          <input value={userPinInput} onChange={e=>setUserPinInput(normalizePin(e.target.value))} placeholder="4 a 6 dígitos" inputMode="numeric" type="password" autoComplete="current-password"
            style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"13px 13px",fontSize:16,fontWeight:900,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",letterSpacing:"2px",touchAction:"manipulation"}}
            onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
          />
          <div style={{fontSize:11,color:"#6B7280",fontWeight:700,marginTop:7,lineHeight:1.35}}>
            {authCheckingName?"Verificando cadastro...":isRecoverPinMode?"Informe e confirme seu novo PIN para recuperar o acesso neste aparelho.":isFirstAccessMode?"Primeiro acesso identificado. Confirme o PIN abaixo para criar seu acesso.":"Acesso rápido: informe seu PIN e toque em Entrar."}
          </div>
        </div>
        {(isFirstAccessMode||isRecoverPinMode)&&(<div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>{isRecoverPinMode?"Confirmar novo PIN":"Confirmar PIN"}</label>
          <input value={userPinConfirmInput} onChange={e=>setUserPinConfirmInput(normalizePin(e.target.value))} placeholder="Repita o PIN" inputMode="numeric" type="password" autoComplete="new-password"
            style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"13px 13px",fontSize:16,fontWeight:900,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",letterSpacing:"2px",touchAction:"manipulation"}}
            onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
          />
        </div>)}
        <button onClick={submitAuthForm} disabled={loading||authCheckingName}
          style={{width:"100%",padding:16,borderRadius:20,background:(loading||authCheckingName)?"#A78BFA":"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontWeight:900,fontSize:15,cursor:(loading||authCheckingName)?"wait":"pointer",fontFamily:"inherit",touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}>
          {loading?(isRecoverPinMode?"Redefinindo...":"Validando..."):authCheckingName?"Verificando...":isRecoverPinMode?"Redefinir PIN":isFirstAccessMode?"Criar acesso":"Entrar"}
        </button>
        {!isFirstAccessMode&&(<button onClick={()=>{setIsRecoverPinMode(v=>!v);setUserPinInput("");setUserPinConfirmInput("");}} disabled={loading||authCheckingName}
          style={{width:"100%",padding:12,borderRadius:16,background:"transparent",border:"none",color:"#6D28D9",fontWeight:900,fontSize:13,cursor:(loading||authCheckingName)?"wait":"pointer",fontFamily:"inherit",marginTop:8,touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}>
          {isRecoverPinMode?"Voltar para entrar com PIN":"Esqueci meu PIN"}
        </button>)}
      </div>
      <div style={{position:"fixed",bottom:100,left:16,right:16,margin:"0 auto",maxWidth:460,transform:`translateY(${toast.show?0:16}px)`,background:"#111827",color:"white",padding:"14px 18px",borderRadius:18,fontSize:14,fontWeight:600,zIndex:600,opacity:toast.show?1:0,transition:"all 0.3s",whiteSpace:"normal",lineHeight:1.35,textAlign:"center",boxShadow:"0 18px 42px rgba(17,24,39,0.18)",pointerEvents:"none"}}>
        {toast.msg}
      </div>
    </div>
  );

  const visibleLists = mergeUniqueLists(Array.isArray(lists) ? lists : []);

  const recentLists = visibleLists.slice(0,1);
  const historyLists = visibleLists.slice(1);

  return(
    <div style={{width:"100%",maxWidth:430,minWidth:0,margin:"0 auto",minHeight:"100vh",background:"linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 34%,#FFFFFF 100%)",fontFamily:"Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",position:"relative",overflowX:"clip",boxSizing:"border-box",isolation:"isolate"}}>
      <AppHeader
        userName={getAppUserName()}
        onSwitchUser={handleSwitchUser}
        onNotifications={()=>setShowNotificationsScreen(true)}
        unreadCount={unreadNotificationsCount}
      />


      {/* LOADING */}
      {loading&&(
        <div style={{position:"fixed",inset:0,background:"rgba(249,250,251,0.96)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:"50%",border:"4px solid #B3F0D6",borderTopColor:"#6D28D9",animation:"spin 0.8s linear infinite"}}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{fontWeight:700,fontSize:15,color:"#4A5568"}}>✨ Organizando com IA...</div>
        </div>
      )}

      <style>{`@keyframes tnlPulseBack{0%,100%{transform:scale(1);box-shadow:0 12px 28px rgba(17,24,39,0.24)}50%{transform:scale(1.10);box-shadow:0 18px 40px rgba(255,255,255,0.32),0 12px 28px rgba(17,24,39,0.24)}}`}</style>

      {/* TOAST */}
      <div style={{position:"fixed",bottom:100,left:16,right:16,margin:"0 auto",maxWidth:460,transform:`translateY(${toast.show?0:16}px)`,background:"#111827",color:"white",padding:"14px 18px",borderRadius:18,fontSize:14,fontWeight:600,zIndex:600,opacity:toast.show?1:0,transition:"all 0.3s",whiteSpace:"normal",lineHeight:1.35,textAlign:"center",boxShadow:"0 18px 42px rgba(17,24,39,0.18)",pointerEvents:"none"}}>
        {toast.msg}
      </div>

      {/* LISTA COMPARTILHADA RECEBIDA */}
      {sharedLandingRecord&&(()=>{
        const sharedData=sharedLandingRecord.data||{};
        const sharedItems=(sharedData.categories||[]).flatMap(c=>(c.items||[]).map(i=>({cat:c.name,item:i})));
        const visibleItems=sharedPreviewExpanded?sharedItems:sharedItems.slice(0,6);
        const sharedBudget=Number(sharedData.budget||sharedLandingRecord.budget||0);
        return(
        <div style={{position:"fixed",inset:0,background:"linear-gradient(180deg,#F5F3FF 0%,#FFFFFF 42%,#F8FAFC 100%)",zIndex:520,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{width:"100%",maxWidth:390,background:"#FFFFFF",borderRadius:28,padding:24,boxShadow:"0 28px 70px rgba(17,24,39,0.18)",border:"1px solid #E9D5FF"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:18}}><AppLogo size={86} radius={26} /></div>
            <h2 style={{margin:"0 0 8px",fontSize:24,lineHeight:1.15,textAlign:"center",color:"#111827",fontWeight:900}}>Você recebeu uma lista</h2>
            <p style={{margin:"0 0 18px",fontSize:14,color:"#6B7280",textAlign:"center",lineHeight:1.45}}>
              Enviada por <strong style={{color:"#4C1D95"}}>{sharedLandingRecord.remetente||sharedData.remetente||"Usuário do Tá na Lista"}</strong>
            </p>
            <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:20,padding:16,marginBottom:18}}>
              <div style={{fontWeight:900,fontSize:17,color:"#111827",marginBottom:6}}>{sharedData.name||sharedLandingRecord.title||"Lista de compras"}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:12,fontWeight:800,color:"#6B7280"}}>
                <span>📌 {sharedItems.length} itens</span>
                {sharedBudget>0&&<span>💰 Orçamento: {fmtR(sharedBudget)}</span>}
              </div>
              <div style={{marginTop:12,maxHeight:sharedPreviewExpanded?260:158,overflow:"auto",display:"flex",flexDirection:"column",gap:8,paddingRight:4}}>
                {visibleItems.map((row,idx)=>(
                  <div key={idx} style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:13,color:"#374151"}}>
                    <span style={{fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.item.name}</span>
                    <span style={{color:"#6B7280",whiteSpace:"nowrap"}}>{formatQtyUnit(row.item.qty||1,row.item.unit||"unidade")}</span>
                  </div>
                ))}
              </div>
              {sharedItems.length>6&&(
                <button onClick={()=>setSharedPreviewExpanded(v=>!v)} style={{width:"100%",marginTop:12,border:"none",background:"transparent",color:"#6D28D9",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>
                  {sharedPreviewExpanded?"Mostrar menos":"Ver lista completa"}
                </button>
              )}
            </div>
            <button onClick={()=>importSharedRecordToApp(sharedLandingRecord)} style={{width:"100%",border:"none",borderRadius:18,padding:"15px 16px",background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",color:"white",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 14px 28px rgba(109,40,217,0.24)"}}>
              Adicionar à minha lista
            </button>
            <button onClick={()=>importSharedRecordToApp(sharedLandingRecord)} style={{width:"100%",marginTop:10,border:"2px solid #E5E7EB",borderRadius:18,padding:"13px 16px",background:"#FFFFFF",color:"#374151",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
              Continuar sem instalar
            </button>
            <button onClick={installApp} style={{width:"100%",marginTop:10,border:"none",borderRadius:18,padding:"13px 16px",background:"#ECFDF5",color:"#047857",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
              📲 Instalar / adicionar à tela inicial
            </button>
          </div>
        </div>
        );
      })()}

      {/* LISTA FINALIZADA */}
      {showFinished&&(
        <div style={{position:"fixed",inset:0,background:"rgba(17,24,39,0.56)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"#FFFFFF",borderRadius:24,padding:32,textAlign:"center",maxWidth:360,width:"100%"}}>
            <div style={{width:86,height:86,borderRadius:"50%",margin:"0 auto 14px",background:"linear-gradient(135deg,#EEF2FF,#ECFDF5)",border:"2px solid #D1FAE5",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",boxShadow:"0 14px 32px rgba(16,185,129,0.16)"}}>
              <AppLogo size={58} radius={18} shadow={false} />
              <span style={{position:"absolute",right:8,bottom:8,width:30,height:30,borderRadius:"50%",background:"#10B981",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,border:"3px solid white"}}>✓</span>
            </div>
            <div style={{fontWeight:900,fontSize:22,color:"#111827",marginBottom:8}}>Lista finalizada!</div>
            <div style={{fontSize:14,color:"#6B7280",marginBottom:12}}>Todos os itens foram marcados.</div>
            <div style={{fontWeight:800,fontSize:22,color:"#6D28D9",marginBottom:16}}>{fmtR(fullTotal)}</div>
            {budget>0&&(
              <div style={{fontSize:13,fontWeight:700,marginBottom:20,color:fullTotal>budget?"#E53935":"#43A047"}}>
                {fullTotal>budget?`⚠️ Acima do orçamento em ${fmtR(fullTotal-budget)}`:`✅ Dentro do orçamento! Economizou ${fmtR(budget-fullTotal)}`}
              </div>
            )}
            <div style={{fontSize:13,color:"#6B7280",fontWeight:800,lineHeight:1.45,background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:16,padding:"12px 14px"}}>
              Esta mensagem fechará automaticamente. Use a seta em destaque no topo da lista para voltar à tela inicial.
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          HOME
      ════════════════════════════════════ */}
      {listMenuId&&screen==="home"&&<div onClick={()=>setListMenuId(null)} style={{position:"fixed",inset:0,zIndex:298}}/>}
      {screen==="home"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100dvh",width:"100%",maxWidth:"100%",overflowX:"hidden",boxSizing:"border-box",background:"linear-gradient(180deg,#FAFAFF 0%,#FFFFFF 44%,#F8FAFC 100%)",position:"relative"}}>
          <div style={{background:"linear-gradient(180deg,#FFFFFF 0%,#F5F3FF 100%)",paddingTop:24,paddingRight:"max(16px, env(safe-area-inset-right, 0px))",paddingBottom:28,paddingLeft:"max(16px, env(safe-area-inset-left, 0px))",position:"relative",overflow:"hidden",borderBottom:"1px solid #E9D5FF",boxShadow:"0 14px 38px rgba(109,40,217,0.10)"}}>
            <div style={{position:"absolute",top:-70,right:-70,width:250,height:250,background:"rgba(109,40,217,0.08)",borderRadius:"50%"}}/>
            <div style={{position:"absolute",bottom:-44,left:-44,width:180,height:180,background:"rgba(139,92,246,0.09)",borderRadius:"50%"}}/>
            <div style={{position:"relative",maxWidth:520,width:"100%",margin:"0 auto",display:"flex",flexDirection:"column",gap:16,alignItems:"center"}}>
              <div style={{textAlign:"center",background:"rgba(255,255,255,0.58)",border:"1px solid rgba(221,214,254,0.72)",borderRadius:28,padding:"18px 18px 16px",width:"100%",boxShadow:"0 18px 42px rgba(109,40,217,0.08)",backdropFilter:"blur(8px)"}}>
                <BrandWordmark />
                <div style={{color:"#6B7280",fontSize:13,lineHeight:1.45,fontStyle:"italic",fontWeight:700,marginTop:14}}>Organize, compartilhe e controle o orçamento</div>
              </div>
            </div>
          </div>
          <div style={{paddingTop:20,paddingRight:"max(14px, env(safe-area-inset-right, 0px))",paddingBottom:"calc(100px + env(safe-area-inset-bottom, 0px))",paddingLeft:"max(14px, env(safe-area-inset-left, 0px))",flex:1,maxWidth:720,width:"100%",margin:"0 auto",boxSizing:"border-box",overflowX:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontWeight:900,fontSize:12,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.9px"}}>Módulos</div>
              <div style={{fontSize:12,color:"#8B5CF6",fontWeight:800}}>6 áreas integradas</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginBottom:30}}>
              {[
                {iconType:"compras",name:"Compras",desc:"Lista inteligente",active:true},
                {iconType:"festa",name:"Festa",desc:"Churrasco e eventos",active:false},
                {iconType:"conta",name:"Conta",desc:"Dividir despesas",active:false},
                {iconType:"saude",name:"Saúde",desc:"Receitas e remédios",active:false},
                {iconType:"eventos",name:"Eventos",desc:"Convites e QR Code",active:false},
                {iconType:"condominio",name:"Condomínio",desc:"Gestão e aprovações",active:false},
              ].map(m=>(
                <div key={m.name} onClick={()=>{if(m.active){setEditingListId(null);setPendingItems([]);setCurrentInput("");setScreen("create");}}}
                  style={{background:m.active?"#FFFFFF":"rgba(255,255,255,0.86)",borderRadius:24,padding:"18px 14px",cursor:m.active?"pointer":"default",boxShadow:m.active?"0 18px 38px rgba(109,40,217,0.14)":"0 10px 26px rgba(17,24,39,0.06)",border:m.active?"1.5px solid #C4B5FD":"1px solid #E9D5FF",position:"relative",overflow:"hidden",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:154,transition:"transform .2s ease, box-shadow .2s ease"}}>
                  {!m.active&&<div style={{position:"absolute",top:10,right:10,background:"#F5F3FF",color:"#6D28D9",fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:180,textTransform:"uppercase",border:"1px solid #DDD6FE"}}>Em breve</div>}
                  {m.active&&<div style={{position:"absolute",top:10,right:10,background:"#ECFDF5",color:"#047857",fontSize:9,fontWeight:900,padding:"3px 8px",borderRadius:180,textTransform:"uppercase",border:"1px solid #A7F3D0"}}>Ativo</div>}
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",marginBottom:12,filter:m.active?"none":"saturate(0.92)",opacity:m.active?1:0.88}}><ModuleIcon type={m.iconType} size={68} active={m.active} /></div>
                  <div style={{fontWeight:900,fontSize:15,color:"#111827",textAlign:"center",width:"100%"}}>{m.name}</div>
                  <div style={{fontSize:12,color:"#6B7280",marginTop:4,lineHeight:1.35,textAlign:"center",width:"100%",fontWeight:600}}>{m.desc}</div>
                </div>
              ))}
            </div>

            <PriceStatsEntryCard onClick={()=>{rebuildLocalPriceHistoryFromLists(lists);setShowPriceStatsScreen(true);}} />

            <div style={{
              display:"flex",
              alignItems:"center",
              justifyContent:"space-between",
              gap:12,
              margin:"6px 0 14px",
              width:"100%",
              boxSizing:"border-box",
              clear:"both"
            }}>
              <div style={{fontWeight:900,fontSize:12,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.9px"}}>
                Listas recentes
              </div>
              {visibleLists.length>0&&(
                <div style={{fontSize:12,color:"#6B7280",fontWeight:800,flexShrink:0}}>
                  {visibleLists.length} {visibleLists.length===1?"lista salva":"listas salvas"}
                </div>
              )}
            </div>
            {visibleLists.length===0?(
              <div style={{textAlign:"center",padding:"28px 20px",color:"#6B7280",background:"#FFFFFF",border:"1px dashed #D1D5DB",borderRadius:24,boxShadow:"0 12px 28px rgba(17,24,39,0.04)"}}>
                <p style={{fontSize:15,lineHeight:1.6,fontWeight:900,margin:"0 0 6px",color:"#111827"}}>Nenhuma lista ainda</p>
                <p style={{fontSize:13,lineHeight:1.5,fontWeight:600,margin:0}}>Entre em Compras para criar sua primeira lista.</p>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {recentLists.map(list=>{
                  const icons={mercado:"🛒",festa:"🎉",construcao:"🏗️",eletrico:"⚡",escolar:"🏫",farmacia:"💊",condominio:"🏢",outros:"📦"};
                  const originMeta=getListOriginMeta(list);
                  const shared=list.isShared === true;
                  const finished=isListFinished(list);
                  return(
                    <div key={list.id} style={{background:"rgba(255,255,255,0.98)",borderRadius:20,boxShadow:"0 10px 24px rgba(17,24,39,0.07)",border:"1px solid #E5E7EB",overflow:"visible",position:"relative",width:"100%",maxWidth:"100%",boxSizing:"border-box"}}>
                      <div onClick={()=>{setCurrentList(list);setScreen("list");setSearch("");setCollapsedCats({});}}
                        style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",cursor:"pointer",width:"100%",maxWidth:"100%",boxSizing:"border-box"}}>
                        <div style={{width:40,height:40,borderRadius:15,background:"linear-gradient(135deg,#F5F3FF,#EEF2FF)",border:"1px solid #DDD6FE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{icons[list.type]||"📦"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{textAlign:"center",minWidth:0}}>
                            <div style={{fontWeight:900,fontSize:15,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{list.name||"Lista sem nome"}</div>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexWrap:"wrap",marginTop:5}}>
                              <span style={{fontSize:11,fontWeight:900,color:finished?"#B91C1C":"#047857",background:finished?"#FEE2E2":"#ECFDF5",border:"1px solid "+(finished?"#FCA5A5":"#A7F3D0"),borderRadius:999,padding:"4px 9px",whiteSpace:"nowrap"}}>{finished?"Finalizada":"Em aberto"}</span>
                              {shared&&<span style={{fontSize:10,fontWeight:900,color:"#6D28D9",background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:999,padding:"4px 9px",whiteSpace:"nowrap"}}>Compartilhada</span>}
                            </div>
                          </div>
                          <div style={{fontSize:11,color:"#6B7280",marginTop:5,fontWeight:700,textAlign:"center"}}>{formatListDate(list.createdAt)}</div>
                          {/* Card compacto: removidas as métricas de orçamento, gasto e resultado para reduzir altura e evitar estouro de enquadramento no mobile. */}
                          {originMeta&&<div style={{display:"flex",justifyContent:"center",marginTop:6}}>
                            <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:999,background:originMeta.type==="received"?"#EEF2FF":"#ECFDF5",border:"1px solid "+(originMeta.type==="received"?"#C4B5FD":"#A7F3D0"),color:originMeta.type==="received"?"#4C1D95":"#047857",fontSize:11,fontWeight:900}}><span>{originMeta.icon}</span><span>{originMeta.text}</span></span>
                          </div>}
                        </div>
                        <div style={{position:"relative",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>setListMenuId(listMenuId===list.id?null:list.id)}
                            style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:12,padding:"6px 10px",cursor:"pointer",fontWeight:900,fontSize:17,color:"#4B5563",fontFamily:"inherit",lineHeight:1}}>⋯</button>
                          {listMenuId===list.id&&(
                            <div style={{position:"absolute",right:0,top:42,background:"#FFFFFF",borderRadius:20,boxShadow:"0 18px 42px rgba(17,24,39,0.16)",border:"1px solid #E5E7EB",zIndex:500,minWidth:230,overflow:"hidden"}}>
                              {!finished&&<button onClick={()=>openListForEdit(list)} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#111827",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>✏️ Editar lista</button>}
                              <button onClick={()=>{setCurrentList(list);setShareTargetList(list);setShareModal(true);setListMenuId(null);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#25D366",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}><WhatsAppIcon size={18} /> Enviar lista</button>
                              <button onClick={()=>duplicateList(list)} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#111827",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>📄 Fazer cópia</button>
                              {shared&&<button onClick={()=>stopListSharing(list)} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#6D28D9",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>🔒 Encerrar compartilhamento</button>}
                              <div style={{height:1,background:"#F3F4F6"}}/>
                              <button onClick={()=>{setConfirmDelete(list.id);setListMenuId(null);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#DC2626",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>🗑 Excluir lista</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {historyLists.length>0&&(<div style={{marginTop:18}}>
              <button onClick={()=>setShowHistory(v=>!v)} style={{width:"100%",padding:"14px 16px",borderRadius:18,background:"#FFFFFF",border:"1px solid #E5E7EB",color:"#111827",fontWeight:900,fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 10px 24px rgba(17,24,39,0.05)"}}>
                <span>Histórico</span><span style={{color:"#6D28D9"}}>{showHistory?"Ocultar histórico":"Ver histórico"} ({historyLists.length})</span>
              </button>
              {showHistory&&(<div style={{display:"flex",flexDirection:"column",gap:12,marginTop:12}}>
                {historyLists.map(list=>{
                  const stats=getListCardStats(list);
                  const icons={mercado:"🛒",festa:"🎉",construcao:"🏗️",eletrico:"⚡",escolar:"🏫",farmacia:"💊",condominio:"🏢",outros:"📦"};
                  const originMeta=getListOriginMeta(list);
                  const shared=list.isShared === true;
                  const finished=isListFinished(list);
                  return(
                    <div key={list.id} style={{background:"rgba(255,255,255,0.98)",borderRadius:22,boxShadow:"0 12px 28px rgba(17,24,39,0.06)",border:"1px solid #E5E7EB",overflow:"visible",position:"relative"}}>
                      <div onClick={()=>{setCurrentList(list);setScreen("list");setSearch("");setCollapsedCats({});}} style={{display:"flex",alignItems:"center",gap:12,padding:"14px",cursor:"pointer"}}>
                        <div style={{width:42,height:42,borderRadius:16,background:"linear-gradient(135deg,#F5F3FF,#EEF2FF)",border:"1px solid #DDD6FE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icons[list.type]||"📦"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:900,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{list.name||"Lista sem nome"}</div>
                          <div style={{fontSize:12,color:"#6B7280",marginTop:3,fontWeight:700}}>{formatListDate(list.createdAt)} · {finished?"Finalizada":"Em aberto"} · {fmtR(stats.fullTotal||list.total||0)}</div>
                          {originMeta&&<div style={{fontSize:11,color:originMeta.type==="received"?"#4C1D95":"#047857",fontWeight:800,marginTop:4}}>{originMeta.icon} {originMeta.text}</div>}
                        </div>
                        <div style={{position:"relative",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>setListMenuId(listMenuId===list.id?null:list.id)} style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:12,padding:"7px 11px",cursor:"pointer",fontWeight:900,fontSize:18,color:"#4B5563",fontFamily:"inherit",lineHeight:1}}>⋯</button>
                          {listMenuId===list.id&&(
                            <div style={{position:"absolute",right:0,top:42,background:"#FFFFFF",borderRadius:20,boxShadow:"0 18px 42px rgba(17,24,39,0.16)",border:"1px solid #E5E7EB",zIndex:500,minWidth:230,overflow:"hidden"}}>
                              {!finished&&<button onClick={()=>openListForEdit(list)} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#111827",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>✏️ Editar lista</button>}
                              <button onClick={()=>{setCurrentList(list);setShareTargetList(list);setShareModal(true);setListMenuId(null);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#25D366",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}><WhatsAppIcon size={18} /> Enviar lista</button>
                              <button onClick={()=>duplicateList(list)} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#111827",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>📄 Fazer cópia</button>
                              {shared&&<button onClick={()=>stopListSharing(list)} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#6D28D9",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>🔒 Encerrar compartilhamento</button>}
                              <div style={{height:1,background:"#F3F4F6"}}/>
                              <button onClick={()=>{setConfirmDelete(list.id);setListMenuId(null);}} style={{width:"100%",padding:"12px 16px",border:"none",background:"none",textAlign:"left",fontSize:14,fontWeight:600,color:"#DC2626",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontFamily:"inherit"}}>🗑 Excluir lista</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>)}
            </div>)}
            <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={shareAppWhatsApp}
                style={{width:"100%",padding:"15px 16px",borderRadius:20,background:"#25D366",border:"none",color:"white",fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 12px 28px rgba(37,211,102,0.22)"}}>
                <WhatsAppIcon size={19} /> Compartilhe o Tá na Lista
              </button>
              <div style={{fontSize:12,color:"#6B7280",textAlign:"center",fontWeight:600,lineHeight:1.4}}>Convide outras pessoas para organizar listas e controlar o orçamento.</div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete&&(
        <ModalSheet onClose={()=>setConfirmDelete(null)}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:30,marginBottom:8}}>🗑️</div>
            <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:8}}>Excluir lista?</div>
            <div style={{fontSize:14,color:"#6B7280"}}>Essa ação não pode ser desfeita.</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setConfirmDelete(null)} style={{...btnGr,flex:1}}>Cancelar</button>
            <button onClick={()=>deleteList(confirmDelete)} style={{flex:1,padding:14,borderRadius:18,background:"#FF4444",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Excluir</button>
          </div>
        </ModalSheet>
      )}

      {/* ════════════════════════════════════
          CREATE
      ════════════════════════════════════ */}
      {screen==="create"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
          <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
            <button onClick={()=>{setScreen("home");setPendingItems([]);setCurrentInput("");setEditingListId(null);setPantryCompared(false);setPantryComparison(null);}}
              style={{width:36,height:36,borderRadius:"50%",background:"#F9FAFB",border:"none",cursor:"pointer",fontSize:18,color:"#4A5568",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><AppLogo size={26} radius={8} shadow={false}/><div style={{fontWeight:800,fontSize:18,color:"#111827",textAlign:"center"}}>{listName?listName:"Nova lista"}</div></div>
            </div>
          </div>
          <div style={{padding:20,flex:1,display:"flex",flexDirection:"column",gap:14,overflowY:"auto",paddingBottom:40}}>
            {/* MINHA DESPENSA */}
            <div style={{...createCard,borderColor:activePantry?"#86EFAC":"#DDD6FE",background:activePantry?"#F0FDF4":"#FAF9FF"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:16,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 12px 24px rgba(109,40,217,0.18)"}}>🧺</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div style={{fontWeight:900,fontSize:15,color:"#111827"}}>Minha Despensa</div>
                    <span style={{fontSize:11,fontWeight:900,borderRadius:999,padding:"4px 9px",background:activePantry?"#DCFCE7":"#F3E8FF",color:activePantry?"#15803D":"#6D28D9",border:`1px solid ${activePantry?"#86EFAC":"#DDD6FE"}`}}>{activePantry?"Ativa":"Opcional"}</span>
                  </div>
                  <div style={{fontSize:12,color:"#6B7280",fontWeight:700,marginTop:4,lineHeight:1.35}}>
                    {activePantry ? `Criada em ${formatPantryDate(activePantry.createdAt)} · ${activePantry.itemCount || countCategoryItems(activePantry.categories)} itens` : "Monte sua despensa antes de criar a lista de compras."}
                  </div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:activePantry?"1fr 1fr":"1fr",gap:10,marginTop:12}}>
                {activePantry&&(<button onClick={()=>{setPantryEditingId(activePantry.id);setPantryReviewCategories(activePantry.categories||[]);setScreen("pantry_review");}} style={{...createSecondaryBtn,background:"#FFFFFF",borderColor:"#BBF7D0",color:"#15803D"}}>Ver despensa</button>)}
                <button onClick={openPantryCreator} style={{...createSecondaryBtn,background:"#FFFFFF",borderColor:"#DDD6FE",color:"#5B21B6"}}>{activePantry?"Criar nova despensa":"Criar despensa"}</button>
              </div>
            </div>
            {/* ORÇAMENTO */}
            <div style={createCard}>
              <label style={lbl}>Orçamento</label>
              <div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:900,color:budgetText?"#6D28D9":"#6B7280",fontSize:15,pointerEvents:"none",transition:"color .25s ease, font-weight .25s ease"}}>R$</span>
                  <input value={budgetText} onChange={e=>{setBudgetText(maskBRLInput(e.target.value)); if(!budgetConfirmed)setBudgetConfirmed(true); triggerBudgetSavedPulse();}}
                    placeholder="0,00" inputMode="numeric"
                    style={inp({paddingLeft:44,width:"100%",height:58,borderColor:budgetText?"#6D28D9":"#E5E7EB",boxShadow:budgetSavedPulse?"0 0 0 4px rgba(109,40,217,0.14)":"none",fontWeight:budgetText?900:500,color:budgetText?"#6D28D9":"#111827",transition:"border-color .25s ease, box-shadow .25s ease, color .25s ease, font-weight .25s ease"})}
                    onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor=budgetText?"#6D28D9":"#E5E7EB"}/>
                </div>
                <div style={{fontSize:12,color:budgetText?"#6D28D9":"#9CA3AF",marginTop:7,fontWeight:budgetText?900:500,transition:"color .25s ease, font-weight .25s ease"}}>
                  {budgetText ? "Orçamento salvo automaticamente" : "Deixe em branco para não definir limite"}
                </div>
              </div>
            </div>
            {/* NOME DA LISTA */}
            <div style={createCard}>
              <label style={lbl}>Nome da lista</label>
              <input value={listName} onChange={e=>{setListName(e.target.value); if(!listNameConfirmed)setListNameConfirmed(true); triggerListNameSavedPulse();}}
                placeholder="Ex: Compras da semana..."
                style={inp({width:"100%",height:58,borderColor:listName?"#6D28D9":"#E5E7EB",boxShadow:listNameSavedPulse?"0 0 0 4px rgba(109,40,217,0.14)":"none",fontWeight:listName?900:500,color:listName?"#6D28D9":"#111827",transition:"border-color .25s ease, box-shadow .25s ease, font-weight .25s ease, color .25s ease"})}
                onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor=listName?"#6D28D9":"#E5E7EB"}/>
              <div style={{fontSize:12,color:listName?"#6D28D9":"#9CA3AF",marginTop:7,fontWeight:listName?900:500,transition:"color .25s ease, font-weight .25s ease"}}>
                {listName ? "Nome salvo automaticamente" : "Você pode alterar o nome quando quiser"}
              </div>
            </div>
            {/* TIPO DE LISTA */}
            <div style={createCard}>
              <label style={lbl}>Tipo de lista</label>
              <div style={{position:"relative"}}>
                <select value={listType} onChange={e=>setListType(e.target.value)}
                  style={{...inp({height:58,fontSize:16,paddingLeft:18}),appearance:"none",cursor:"pointer",paddingRight:42}}>
                  {LIST_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <span style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"#6B7280",fontSize:14}}>▼</span>
              </div>
            </div>
            <div style={createCard}>
              <label style={lbl}>Adicionar itens</label>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={currentInput} onChange={e=>setCurrentInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleAddItem()}
                  placeholder="Digite um item da lista"
                  style={inp({height:56})} onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
                <button onClick={handleAddItem}
                  style={{padding:"0 18px",height:56,borderRadius:18,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",flexShrink:0,fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 10px 22px rgba(109,40,217,0.22)"}}>Inserir</button>
              </div>
              <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5}}>Digite, cole ou fale a lista. O sistema considera o tipo selecionado para organizar os itens.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                <button onClick={()=>{setPasteTarget("list");setShowPasteModal(true);}}
                  style={{...createSecondaryBtn,borderColor:"#DDD6FE",color:"#5B21B6",background:"#FAF9FF"}}>
                  Colar lista
                </button>
                <button onClick={()=>{voiceTargetRef.current="list";setVoiceTarget("list");startVoiceInput();}} disabled={voiceProcessing}
                  style={{...createSecondaryBtn,background:voiceListening?"#FEF2F2":"#F0FDF4",borderColor:voiceListening?"#FCA5A5":"#BBF7D0",color:voiceListening?"#B91C1C":"#166534",cursor:voiceProcessing?"not-allowed":"pointer",opacity:voiceProcessing?0.65:1}}>
                  {voiceListening?"Parar fala":voiceProcessing?"Organizando...":"Falar lista"}
                </button>
              </div>
            </div>
            {pendingItems.length>0&&(
              <div style={{background:"#FFFFFF",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
                <div style={{padding:"10px 14px",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",fontSize:12,fontWeight:700,color:"#6B7280",display:"flex",justifyContent:"space-between"}}>
                  <span>{pendingItems.length} {pendingItems.length===1?"item":"itens"}</span>
                  <button onClick={()=>setPendingItems([])} style={{background:"none",border:"none",color:"#FF4444",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Limpar tudo</button>
                </div>
                {pendingItems.map((item,i)=>{
                  const emb=item.embalagem||"";
                  return(
                    <div key={i} style={{padding:"11px 14px",borderBottom:i<pendingItems.length-1?"1px solid #F0F2F5":"none",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:16}}>🛒</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {[formatQtyUnit(item.qty,item.unit),item.marca,item.tipo,item.name,emb].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <button onClick={()=>editPendingItem(i)}
                        style={{background:"#F5F3FF",border:"none",borderRadius:6,padding:"4px 10px",color:"#6D28D9",cursor:"pointer",fontSize:14,marginRight:4}}>✏️</button>
                      <button onClick={()=>setPendingItems(prev=>prev.filter((_,j)=>j!==i))}
                        style={{background:"#FFE8E8",border:"none",borderRadius:6,padding:"4px 10px",color:"#FF4444",cursor:"pointer",fontSize:14}}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
            {activePantry && pendingItems.length>0 && !pantryCompared && !editingListId && (
              <div style={{background:"#ECFDF5",border:"1px solid #86EFAC",borderRadius:20,padding:14,color:"#166534",display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{fontSize:18}}>✅</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:900,fontSize:14}}>Despensa ativa detectada</div>
                  <div style={{fontSize:12,fontWeight:700,lineHeight:1.4,marginTop:3}}>Sua pré-lista pode ser comparada com a despensa antes de organizar.</div>
                </div>
              </div>
            )}
            <button onClick={(activePantry && pendingItems.length>0 && !pantryCompared && !editingListId)?compareWithActivePantry:organizeList} disabled={loading||pendingItems.length===0}
              style={{...createPrimaryBtn,background:(activePantry && pendingItems.length>0 && !pantryCompared && !editingListId)?"linear-gradient(135deg,#16A34A,#22C55E)":"linear-gradient(135deg,#6D28D9,#8B5CF6)",boxShadow:(loading||pendingItems.length===0)?"none":"0 16px 34px rgba(109,40,217,0.30)",opacity:(loading||pendingItems.length===0)?0.5:1,cursor:(loading||pendingItems.length===0)?"not-allowed":"pointer"}}>
              {(activePantry && pendingItems.length>0 && !pantryCompared && !editingListId)?"Comparar com a Despensa":(editingListId?"Salvar alterações":"Organizar lista")} {pendingItems.length>0&&`(${pendingItems.length} ${pendingItems.length===1?"item":"itens"})`}
            </button>
          </div>
        </div>
      )}


      {/* ════════════════════════════════════
          DESPENSA: CRIAR / EDITAR
      ════════════════════════════════════ */}
      {screen==="pantry_create"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF,#FFFFFF)"}}>
          <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
            <button onClick={()=>{resetPantryFlow();setScreen("create");}}
              style={{width:36,height:36,borderRadius:"50%",background:"#F9FAFB",border:"none",cursor:"pointer",fontSize:18,color:"#4A5568",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:"#111827"}}>Criar/Editar Despensa</div>
              <div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>Itens que você já tem em casa</div>
            </div>
            <div style={{width:36}} />
          </div>
          <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,paddingBottom:42}}>
            <div style={createCard}>
              <label style={lbl}>Adicionar itens na despensa</label>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={pantryInput} onChange={e=>setPantryInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddPantryItem()} placeholder="Digite um item da despensa" style={inp({height:56})}/>
                <button onClick={handleAddPantryItem} style={{padding:"0 18px",height:56,borderRadius:18,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 10px 22px rgba(109,40,217,0.22)"}}>Inserir</button>
              </div>
              <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5}}>Digite, cole ou fale os itens existentes em casa. Você poderá editar antes de salvar.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                <button onClick={()=>{setPasteTarget("pantry");setShowPasteModal(true);}} style={{...createSecondaryBtn,borderColor:"#DDD6FE",color:"#5B21B6",background:"#FAF9FF"}}>Colar lista</button>
                <button onClick={()=>{voiceTargetRef.current="pantry";setVoiceTarget("pantry");startVoiceInput();}} disabled={voiceProcessing} style={{...createSecondaryBtn,background:voiceListening?"#FEF2F2":"#F0FDF4",borderColor:voiceListening?"#FCA5A5":"#BBF7D0",color:voiceListening?"#B91C1C":"#166534",opacity:voiceProcessing?0.65:1}}>{voiceListening?"Parar fala":voiceProcessing?"Organizando...":"Falar lista"}</button>
              </div>
            </div>
            {pantryPendingItems.length>0&&(
              <div style={{background:"#FFFFFF",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
                <div style={{padding:"10px 14px",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",fontSize:12,fontWeight:800,color:"#6B7280",display:"flex",justifyContent:"space-between"}}>
                  <span>{pantryPendingItems.length} {pantryPendingItems.length===1?"item inserido":"itens inseridos"}</span>
                  <button onClick={()=>setPantryPendingItems([])} style={{background:"none",border:"none",color:"#FF4444",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Limpar tudo</button>
                </div>
                {pantryPendingItems.map((item,i)=>(
                  <div key={i} style={{padding:"12px 14px",borderBottom:i<pantryPendingItems.length-1?"1px solid #F0F2F5":"none",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:16}}>🧺</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formatQtyUnit(item.qty,item.unit)} – {item.name}</div>
                      {item.detail&&<div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>{item.detail}</div>}
                    </div>
                    <button onClick={()=>editPantryPendingItem(i)} style={{background:"#F5F3FF",border:"none",borderRadius:6,padding:"4px 10px",color:"#6D28D9",cursor:"pointer",fontSize:14}}>✏️</button>
                    <button onClick={()=>setPantryPendingItems(prev=>prev.filter((_,j)=>j!==i))} style={{background:"#FFE8E8",border:"none",borderRadius:6,padding:"4px 10px",color:"#FF4444",cursor:"pointer",fontSize:14}}>×</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={organizePantry} disabled={loading||pantryPendingItems.length===0} style={{...createPrimaryBtn,opacity:(loading||pantryPendingItems.length===0)?0.5:1,cursor:(loading||pantryPendingItems.length===0)?"not-allowed":"pointer"}}>Organizar despensa {pantryPendingItems.length>0&&`(${pantryPendingItems.length})`}</button>
          </div>
        </div>
      )}

      {/* DESPENSA: CONFERÊNCIA */}
      {screen==="pantry_review"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF,#FFFFFF)"}}>
          <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
            <button onClick={()=>setScreen("create")} style={{width:36,height:36,borderRadius:"50%",background:"#F9FAFB",border:"none",cursor:"pointer",fontSize:18,color:"#4A5568",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:"#111827"}}>Minha Despensa</div>
              <div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>Conferência por seções, sem preços</div>
            </div>
            <div style={{width:36}} />
          </div>
          <div style={{padding:20,paddingBottom:42,display:"flex",flexDirection:"column",gap:14}}>
            {(pantryReviewCategories||[]).map((cat,ci)=>{const th=getCatTheme(cat.name);return(
              <div key={cat.name+ci} style={{border:`2px solid ${th.border}`,borderRadius:22,overflow:"hidden",background:"#FFFFFF",boxShadow:"0 12px 28px rgba(17,24,39,0.06)"}}>
                <div style={{background:th.bg,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${th.border}33`}}>
                  <span style={{fontSize:20}}>{th.icon}</span>
                  <div style={{flex:1,fontWeight:900,color:th.header,fontSize:16}}>{cat.name}</div>
                  <div style={{fontSize:12,fontWeight:900,color:th.header}}>{cat.items?.length||0} itens</div>
                </div>
                {(cat.items||[]).map((item,i)=>(
                  <div key={i} style={{padding:"12px 16px",borderBottom:i<(cat.items||[]).length-1?"1px solid #F0F2F5":"none",display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:800,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      {item.detail&&<div style={{fontSize:12,color:"#6B7280",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.detail}</div>}
                    </div>
                    <div style={{fontSize:13,fontWeight:800,color:"#6B7280",whiteSpace:"nowrap"}}>{formatQtyUnit(item.qty,item.unit)}</div>
                    <button onClick={()=>editPantryReviewItem(ci,i)} style={{background:"#F5F3FF",border:"none",borderRadius:8,padding:"5px 9px",color:"#6D28D9",cursor:"pointer",fontSize:13,fontWeight:900}}>✏️</button>
                    <button onClick={()=>removePantryReviewItem(ci,i)} style={{background:"#FEF2F2",border:"none",borderRadius:8,padding:"5px 9px",color:"#DC2626",cursor:"pointer",fontSize:13,fontWeight:900}}>×</button>
                  </div>
                ))}
              </div>
            );})}
            <div style={{background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:18,padding:12,fontSize:12,color:"#6B7280",fontWeight:700,lineHeight:1.45}}>A despensa serve apenas como base de comparação para a próxima lista. Ela ficará ativa até a compra da lista comparada ser finalizada.</div>
            <button onClick={savePantryFromReview} style={createPrimaryBtn}>{pantryEditingId?"Salvar alterações da despensa":"Salvar despensa"}</button>
          </div>
        </div>
      )}

      {/* DESPENSA: RESULTADO DA COMPARAÇÃO */}
      {screen==="pantry_compare_result"&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF,#FFFFFF)"}}>
          <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
            <button onClick={()=>setScreen("create")} style={{width:36,height:36,borderRadius:"50%",background:"#F9FAFB",border:"none",cursor:"pointer",fontSize:18,color:"#4A5568",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:18,color:"#111827"}}>Comparação concluída</div>
              <div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>Sua pré-lista foi ajustada</div>
            </div>
            <div style={{width:36}} />
          </div>
          <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
            <div style={{...createCard,textAlign:"center",borderColor:"#BBF7D0",background:"#F0FDF4"}}>
              <div style={{width:68,height:68,borderRadius:"50%",background:"#22C55E",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,fontWeight:900,margin:"0 auto 12px"}}>✓</div>
              <div style={{fontWeight:900,fontSize:18,color:"#166534",marginBottom:6}}>Despensa confrontada</div>
              <div style={{fontSize:13,color:"#166534",fontWeight:700,lineHeight:1.45}}>Mantivemos na pré-lista somente o que ainda precisa ser comprado ou complementado.</div>
            </div>
            <div style={createCard}>
              <label style={lbl}>Resumo da comparação</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
                <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:16,padding:10}}><div style={{fontWeight:900,color:"#B91C1C",fontSize:18}}>{pantryComparison?.removed?.length||0}</div><div style={{fontSize:11,color:"#7F1D1D",fontWeight:800}}>removidos</div></div>
                <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:16,padding:10}}><div style={{fontWeight:900,color:"#B45309",fontSize:18}}>{pantryComparison?.adjusted?.length||0}</div><div style={{fontSize:11,color:"#92400E",fontWeight:800}}>ajustados</div></div>
                <div style={{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:16,padding:10}}><div style={{fontWeight:900,color:"#4338CA",fontSize:18}}>{pendingItems.length}</div><div style={{fontSize:11,color:"#3730A3",fontWeight:800}}>na lista</div></div>
              </div>
            </div>
            <button onClick={()=>setShowPantryComparisonDetails(v=>!v)} style={{...createSecondaryBtn,borderColor:"#DDD6FE",color:"#5B21B6",background:"#FAF9FF"}}>
              {showPantryComparisonDetails?"Ocultar detalhes":"Ver o que foi feito"}
            </button>
            {showPantryComparisonDetails&&pantryComparison&&(<div style={createCard}>
              <label style={lbl}>Detalhes da comparação</label>
              {(pantryComparison.removed||[]).length>0&&(<div style={{marginBottom:12}}>
                <div style={{fontWeight:900,color:"#B91C1C",fontSize:13,marginBottom:6}}>Itens removidos porque já estavam na despensa</div>
                {pantryComparison.removed.map((r,i)=><div key={i} style={{fontSize:13,color:"#374151",fontWeight:700,padding:"7px 0",borderBottom:"1px solid #F3F4F6"}}>• {r.item?.name} — {r.reason}</div>)}
              </div>)}
              {(pantryComparison.adjusted||[]).length>0&&(<div style={{marginBottom:12}}>
                <div style={{fontWeight:900,color:"#B45309",fontSize:13,marginBottom:6}}>Itens ajustados ou sinalizados</div>
                {pantryComparison.adjusted.map((r,i)=><div key={i} style={{fontSize:13,color:"#374151",fontWeight:700,padding:"7px 0",borderBottom:"1px solid #F3F4F6"}}>• {r.before?.name} — {r.after?.pantryNote || "ajustado pela despensa"}</div>)}
              </div>)}
              {(pantryComparison.kept||[]).length>0&&(<div>
                <div style={{fontWeight:900,color:"#166534",fontSize:13,marginBottom:6}}>Itens mantidos na lista</div>
                {pantryComparison.kept.map((r,i)=><div key={i} style={{fontSize:13,color:"#374151",fontWeight:700,padding:"7px 0",borderBottom:"1px solid #F3F4F6"}}>• {r.name} — não encontrado na despensa</div>)}
              </div>)}
              <div style={{marginTop:10,fontSize:12,color:"#6B7280",fontWeight:700}}>Visualização apenas informativa. Para alterar, volte à pré-lista.</div>
            </div>)}
            <button onClick={()=>setScreen("create")} style={createPrimaryBtn}>Continuar e organizar lista</button>
          </div>
        </div>
      )}

      {/* DIALOG: PRODUTO */}
      {itemDialog&&(
        <ModalSheet onClose={()=>{setItemDialog(null);setItemDialogMode("pending");setEditPendingIdx(null);setCurrentInput("");}}>
          <div style={{fontWeight:900,fontSize:20,color:"#111827",marginBottom:4}}>🛒 {itemDialogMode==="pantryReview"?"Editar item da despensa":itemDialog.name}</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:12}}>{dlgLoading?"":itemDialogMode==="extra"?"Defina os detalhes do item extra":(editPendingIdx!=null||itemDialogMode==="pantryReview")?"Editar item":"Defina os detalhes"}</div>
          {!dlgLoading&&dlgConfig&& (editPendingIdx!=null || itemDialogMode==="pantryReview" || itemDialogMode==="pantry") && (
            <div style={{marginBottom:16}}>
              <label style={lbl}>Nome do item</label>
              <input
                value={itemDialog.name || ""}
                onChange={(e)=>setItemDialog(prev=>({...prev,name:e.target.value}))}
                placeholder="Nome do item"
                style={inp({height:52})}
              />
            </div>
          )}
          {dlgLoading&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 0",gap:14}}>
              <div style={{width:40,height:40,borderRadius:"50%",border:"4px solid #E6FAF2",borderTopColor:"#6D28D9",animation:"spin 0.8s linear infinite"}}/>
              <div style={{fontSize:14,color:"#6B7280",fontWeight:600}}>✨ IA classificando...</div>
            </div>
          )}
          {!dlgLoading&&dlgConfig&&(<>

          {/* Quantidade enxuta */}
          <div style={{marginBottom:16}}>
            <label style={lbl}>Quantidade</label>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={()=>changeManualQty(-1)} style={qBtn}>−</button>
              <input
                value={formatManualQty(dlgQty)}
                inputMode="decimal"
                onChange={(e)=>setManualQtyFromText(e.target.value)}
                onBlur={()=>{
                  const n = Number(String(dlgQty || "").replace(",", "."));
                  if (!Number.isFinite(n) || n <= 0) {
                    setDlgQty(getManualQtyStep());
                  } else {
                    setDlgQty(Number(n.toFixed(2)));
                  }
                }}
                style={{...inp({textAlign:"center",fontWeight:900,fontSize:22,padding:"10px 12px",maxWidth:120,borderRadius:18})}}
              />
              <button onClick={()=>changeManualQty(1)} style={qBtn}>＋</button>
            </div>
            <div style={{fontSize:12,color:"#6B7280",marginTop:8}}>
              Para kg e litro, os botões avançam de 0,5 em 0,5. Também é possível digitar o valor.
            </div>
          </div>

          {/* Unidade */}
          <div style={{marginBottom:16}}>
            <label style={lbl}>Unidade</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {getManualDialogUnits().map(u=><button key={u} onClick={()=>handleManualUnitChange(u)} style={chip(normalizeUnitValue(dlgUnit)===normalizeUnitValue(u),"#6B3FA0","#F3EEF9","#6B3FA0")}>{formatUnitForQuantity(Number(dlgQty||1), u)}</button>)}
            </div>
          </div>

          {/* Tamanho da embalagem */}
          {getManualSizeOptions().length>0&&(
            <div style={{marginBottom:16}}>
              <label style={lbl}>Tamanho da embalagem <span style={{fontWeight:500,color:"#9CA3AF"}}>(opcional)</span></label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                <button onClick={()=>{setDlgPeso("");setDlgVolume("");}} style={chip(!(dlgPeso||dlgVolume),"#1A6B8A","#E8F4F8","#1A6B8A")}>Sem tamanho</button>
                {getManualSizeOptions().map(size=><button key={size} onClick={()=>setManualSize(size)} style={chip((dlgPeso||dlgVolume)===size,"#1A6B8A","#E8F4F8","#1A6B8A")}>{size}</button>)}
              </div>
            </div>
          )}

          {/* Preview */}
          <div style={{background:"#F5F3FF",borderRadius:18,padding:"12px 14px",marginBottom:16,fontSize:14,color:"#6D28D9",fontWeight:800,display:"flex",alignItems:"center",gap:8}}>
            <span>✅</span><span>{buildManualPreview()}</span>
          </div>

          </>)}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{setItemDialog(null);setEditPendingIdx(null);setCurrentInput("");}} style={{...btnGr,flex:1}}>Cancelar</button>
            {!dlgLoading&&(
              <button onClick={confirmDialog}
                style={{flex:2,padding:14,borderRadius:18,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
                {itemDialogMode==="extra"?"Adicionar à seção Extras ✓":editPendingIdx!=null?"Atualizar ✓":"Confirmar ✓"}
              </button>
            )}
          </div>
        </ModalSheet>
      )}

      {/* ════════════════════════════════════
          LIST SCREEN
      ════════════════════════════════════ */}
      {screen==="list"&&currentList&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF 0%,#F8FAFC 48%,#FFFFFF 100%)"}}>
          <div style={{padding:"18px 16px 22px"}}>
            <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#4C1D95 0%,#6D28D9 54%,#8B5CF6 100%)",borderRadius:28,padding:"18px 18px 20px",boxShadow:"0 22px 48px rgba(91,33,182,0.24)",border:"1px solid rgba(255,255,255,0.28)"}}>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 18% 8%,rgba(255,255,255,0.22),transparent 32%),radial-gradient(circle at 90% 0%,rgba(255,255,255,0.14),transparent 34%)",pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <button onClick={()=>setScreen("home")}
                    title="Voltar para a tela inicial"
                    style={{background:"rgba(255,255,255,0.96)",border:"2px solid rgba(255,255,255,0.92)",borderRadius:"50%",width:44,height:44,color:"#4C1D95",fontSize:24,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",boxShadow:"0 12px 28px rgba(17,24,39,0.24)",animation:showFinished?"tnlPulseBack 1.2s ease-in-out infinite":"none"}}>←</button>
                  <div style={{flex:1,minWidth:0,textAlign:"center"}}>
                    <div style={{fontWeight:900,fontSize:20,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentList.name}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.76)",fontWeight:800,marginTop:3}}>{checkedItems}/{totalItems} itens concluídos</div>
                  </div>
                  <button onClick={()=>{setShareTargetList(currentList);setShareModal(true);}}
                    style={{background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.30)",borderRadius:180,padding:"8px 12px",color:"white",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",backdropFilter:"blur(8px)",boxShadow:"0 10px 22px rgba(0,0,0,0.10)",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7}}><WhatsAppIcon size={17} /> Enviar lista</button>
                </div>
                <div style={{background:"rgba(255,255,255,0.16)",border:"1px solid rgba(255,255,255,0.22)",borderRadius:22,padding:"13px 14px",backdropFilter:"blur(10px)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.18)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontWeight:800,fontSize:15,color:"white"}}>{fmtR(fullTotal)}</span>
                {budget>0&&<span style={{fontWeight:800,fontSize:15,color:"rgba(255,255,255,0.8)"}}>{fmtR(budget)}</span>}
              </div>
              <div style={{height:10,background:"rgba(255,255,255,0.2)",borderRadius:5,overflow:"hidden",marginBottom:6}}>
                <div style={{height:"100%",background:progressColor,borderRadius:5,width:pct+"%",transition:"width 0.45s ease, background 0.6s"}}/>
              </div>
              <div style={{textAlign:"center",fontSize:13,fontWeight:900,lineHeight:1.35}}>
                {budget>0?(
                  <>
                    <div style={{color:budgetDiff<0?"#FECACA":"#BBF7D0",fontSize:15}}>
                      {budgetDiff<0?"⚠️ Ultrapassado: "+fmtR(Math.abs(budgetDiff)):"Saldo disponível: "+fmtR(budgetDiff)}
                    </div>
                    <div style={{color:"rgba(255,255,255,0.82)",fontSize:12,marginTop:2}}>{budgetPctLabel}% do orçamento utilizado</div>
                  </>
                ):(
                  <span style={{color:"rgba(255,255,255,0.75)",fontSize:12}}>{checkedItems}/{totalItems} itens · {budgetPctLabel}% concluído</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

          {(currentList.isShared === true)&&(
            <div style={{margin:"10px 20px 0",background:"#EEF2FF",border:"1px solid #C4B5FD",borderRadius:18,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,color:"#4C1D95"}}>
              <span style={{fontSize:18}}>🤝</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:900,fontSize:13}}>Lista compartilhada</div>
                <div style={{fontSize:12,fontWeight:700,opacity:0.85}}>
                  {(()=>{ const originMeta=getListOriginMeta(currentList); return originMeta?originMeta.text + " · ":""; })()}{checkedItems}/{totalItems} itens concluídos
                </div>
                <div style={{height:7,background:"rgba(109,40,217,0.16)",borderRadius:999,overflow:"hidden",marginTop:7}}>
                  <div style={{height:"100%",width:(totalItems?Math.round((checkedItems/totalItems)*100):0)+"%",background:"linear-gradient(90deg,#7C3AED,#A855F7)",borderRadius:999,transition:"width 0.35s"}}/>
                </div>
                <div style={{marginTop:7,fontSize:11,fontWeight:900,color:"#312E81",background:"rgba(255,255,255,0.62)",border:"1px solid rgba(124,58,237,0.18)",borderRadius:999,padding:"5px 8px",display:"inline-flex",alignItems:"center",gap:5}}>
                  <span>🕒</span><span>Última atualização: {formatRelativeSyncTime(currentList.lastCloudSeenAt || currentList.lastSyncedAt || currentList.pulledAt)}</span>
                </div>
                {sharedUpdateNotice&&(<div style={{marginTop:7,fontSize:11,fontWeight:900,color:sharedUpdateNotice.type==="conflict"?"#B91C1C":"#047857",background:sharedUpdateNotice.type==="conflict"?"#FEF2F2":"#ECFDF5",border:"1px solid "+(sharedUpdateNotice.type==="conflict"?"#FECACA":"#A7F3D0"),borderRadius:999,padding:"5px 8px",display:"inline-flex",alignItems:"center",gap:5}}>
                  <span>{sharedUpdateNotice.type==="conflict"?"⚠️":"🔄"}</span><span>{sharedUpdateNotice.msg}</span>
                </div>)}
              </div>
              <button
                onClick={refreshSharedListFromCloud}
                disabled={sharedSyncing}
                style={{border:"none",borderRadius:16,padding:"10px 12px",background:sharedSyncing?"#DDD6FE":"#6D28D9",color:"white",fontSize:12,fontWeight:900,cursor:sharedSyncing?"default":"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 10px 20px rgba(109,40,217,0.18)"}}
              >
                {sharedSyncing?"Atualizando...":"Atualizar"}
              </button>

            </div>
          )}

          {/* Painel orçamento excedido */}
          {budget>0&&budgetDiff!==null&&budgetDiff<0&&(
            <div style={{margin:"10px 20px 0",background:"#FEF2F2",borderRadius:18,border:"2px solid #EF4444",overflow:"hidden"}}>
              <div onClick={()=>setShowSuggestions(s=>!s)}
                style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <span style={{fontSize:18}}>⚠️</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:"#B91C1C"}}>Acima do orçamento em {fmtR(Math.abs(budgetDiff))}</div>
                  <div style={{fontSize:12,color:"#EF4444",marginTop:1}}>Toque para ver sugestões de ajuste</div>
                </div>
                <span style={{fontSize:12,color:"#EF4444",transform:showSuggestions?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",display:"inline-block"}}>▾</span>
              </div>
              {showSuggestions&&(()=>{
                const suggs=getSuggestions();
                if(suggs.length===0)return <div style={{padding:"8px 14px 14px",fontSize:13,color:"#B91C1C"}}>Nenhum item comprado ainda para sugerir ajuste.</div>;
                return(
                  <div style={{borderTop:"1px solid #FECACA"}}>
                    <div style={{padding:"8px 14px 4px",fontSize:11,fontWeight:700,color:"#B91C1C",textTransform:"uppercase",letterSpacing:"0.5px"}}>
                      Plano de ajuste até voltar ao orçamento
                    </div>
                    {suggs.map(({ci,ii,name,qty,price,tipo,catName},i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderTop:"1px solid #FECACA",background:"#FFFFFF"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{fontWeight:700,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                            {tipo==="remover"&&<span style={{fontSize:10,fontWeight:700,background:"#FEF2F2",color:"#B91C1C",padding:"2px 6px",borderRadius:180,border:"1px solid #FECACA",flexShrink:0}}>supérfluo</span>}
                          </div>
                          <div style={{fontSize:12,color:"#6B7280",marginTop:2}}>
                            {tipo==="reduzir"?`${qty} un · reduzir 1 un economiza ${fmtR(price)}`:`remover economiza ${fmtR(price*qty)}`}
                          </div>
                        </div>
                        {tipo==="reduzir"?(
                          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                            <button onClick={()=>quickAdjust(ci,ii,-1)}
                              style={{width:30,height:30,borderRadius:"50%",border:"2px solid #EF4444",background:"#FEF2F2",color:"#EF4444",fontWeight:900,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>−</button>
                            <span style={{fontWeight:800,fontSize:14,minWidth:18,textAlign:"center"}}>{qty}</span>
                            <button onClick={()=>quickAdjust(ci,ii,1)}
                              style={{width:30,height:30,borderRadius:"50%",border:"2px solid #6D28D9",background:"#F5F3FF",color:"#6D28D9",fontWeight:900,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>+</button>
                          </div>
                        ):(
                          <button onClick={()=>{
                            const l=JSON.parse(JSON.stringify(currentList));
                            l.categories[ci].items.splice(ii,1);
                            if(l.categories[ci].items.length===0)l.categories.splice(ci,1);
                            updateList(l);returnToSearch();showToast("🗑 "+name+" removido");
                          }}
                            style={{padding:"6px 12px",borderRadius:8,border:"2px solid #EF4444",background:"#FEF2F2",color:"#B91C1C",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                            🗑 Remover
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{padding:"6px 14px 8px",fontSize:11,color:"#EF4444",fontStyle:"italic"}}>
                      As sugestões continuam aparecendo até o total voltar ao orçamento programado
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Search */}
          <div style={{margin:"14px 20px 0",position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#9CA3AF"}}>🔍</span>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar item na lista..."
              style={{...inp({padding:"12px 16px 12px 42px",borderRadius:180})}}
              onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
            {search&&(
              <button onClick={()=>{setSearch("");searchRef.current?.focus();}}
                style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#6B7280",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
            )}
          </div>

          {/* Categorias com cores */}
          <div ref={listRef} style={{flex:1,padding:"14px 20px 110px",overflowY:"auto"}}>
            {[...currentList.categories]
              .map((cat,origIdx)=>({cat,origIdx}))
              .sort((a,b)=>{
                const aExtra=normalizePlainText(a.cat.name)==="itens extras";
                const bExtra=normalizePlainText(b.cat.name)==="itens extras";
                if(aExtra!==bExtra)return aExtra?1:-1;
                const aDone=a.cat.items.length>0&&a.cat.items.every(i=>i.checked||i.notFound);
                const bDone=b.cat.items.length>0&&b.cat.items.every(i=>i.checked||i.notFound);
                if(aDone===bDone)return a.origIdx-b.origIdx;
                return aDone?1:-1;
              })
              .map(({cat,origIdx:ci})=>{
              const theme=getCatTheme(cat.name);
              const done=cat.items.filter(i=>i.checked).length;
              const total=cat.items.length;
              const allDone=done===total&&total>0;
              const sub=getCatSubtotal(cat);
              const isCollapsed=collapsedCats[ci];
              const isExtraCat=normalizePlainText(cat.name)==="itens extras";
              const filtered=search?cat.items.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())):cat.items;
              if(search&&filtered.length===0)return null;
              const displayItems=[...(search?filtered:cat.items)].sort((a,b)=>{
                const aDone=!!(a.checked||a.notFound);
                const bDone=!!(b.checked||b.notFound);
                if(aDone===bDone){
                  if(!aDone)return String(a.name||"").localeCompare(String(b.name||""),"pt-BR");
                  return cat.items.indexOf(a)-cat.items.indexOf(b);
                }
                return aDone?1:-1;
              });

              return(
                <div key={ci} style={getPremiumSectionStyle(theme,{isExtraCat,allDone})}>
                  {/* Cabeçalho colorido da categoria */}
                  <div onClick={()=>setCollapsedCats(p=>({...p,[ci]:!p[ci]}))}
                    style={getPremiumSectionHeaderStyle(theme,{isExtraCat,allDone,isCollapsed})}>
                    <span style={{width:34,height:34,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.72)",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.9), 0 8px 18px rgba(15,23,42,0.08)",fontSize:20,flexShrink:0}}>{theme.icon}</span>
                    <span style={{fontWeight:900,fontSize:16,color:allDone?"#15803D":theme.header,flex:1,letterSpacing:"-0.2px"}}>
                      {cat.name}
                      {allDone&&<span style={{marginLeft:8,fontSize:12,color:"#43A047"}}>✓ Completo</span>}
                    </span>
                    {sub>0&&<span style={{fontSize:13,fontWeight:800,color:allDone?"#2E7D32":theme.header}}>{fmtR(sub)}</span>}
                    <span style={{fontSize:12,color:allDone?"#43A047":theme.header,fontWeight:700,opacity:0.7,marginLeft:4}}>{done}/{total}</span>
                    <span style={{fontSize:12,color:theme.header,opacity:0.6,transition:"transform 0.2s",display:"inline-block",transform:isCollapsed?"rotate(-90deg)":"rotate(0)"}}>▾</span>
                  </div>

                  {/* Itens da categoria */}
                  {!isCollapsed&&(
                    <div style={{background:allDone?"#F9FFF9":"white",display:"flex",flexDirection:"column"}}>
                      {displayItems.map((item,ii)=>{
                        const isExtra=cat.name==="Itens Extras";
                        const hl=search&&item.name.toLowerCase().includes(search.toLowerCase());
                        const realII=Math.max(0, cat.items.findIndex(it=>it===item || (it.id && item.id && it.id===item.id) || (it.name===item.name && it.unit===item.unit && String(it.qty)===String(item.qty))));
                        const isLast=displayItems.length-1===ii;

                        // Monta descrição e linha de preço
                        const descLine=[item.name,item.detail].filter(Boolean).join(" ");
                        const qtyLabel=formatQtyUnit(item.qty || 1, item.unit || "unidade");
                        const titleLine=`${qtyLabel} – ${descLine}`;
                        const hasPrice=item.price!=null;
                        const totalItemPrice=hasPrice?fmtR(getItemLineTotal(item)):"";
                        const unitPriceLabel=hasPrice?getCompactUnitPriceLabel(item):"";

                        return(
                          <div key={`${ci}-${realII}-${item.name || "item"}`}
                            onClick={()=>{if(item.notFound)return;openItemModal(ci,realII);if(search)setSearch("");}}
                            style={{
                              display:"flex",alignItems:"center",gap:13,
                              padding:"15px 16px",
                              borderBottom:isLast?"none":`1px solid ${hexToRgba(theme.border,0.10)}`,
                              background:hl?"#FFFDE7":item.notFound?"#FFFBEB":item.checked?hexToRgba(theme.border,0.055):"rgba(255,255,255,0.98)",
                              opacity:item.notFound?0.46:(item.checked?0.62:1),filter:item.notFound?"grayscale(0.15)":"none",cursor:item.notFound?"not-allowed":"pointer",
                              transition:"background 0.15s",
                            }}>
                            {/* Checkbox com cor da categoria */}
                            <div onClick={e=>{e.stopPropagation();if(item.notFound){showToast("⚠️ Item em falta. Volte para pendente antes de marcar como adquirido.");return;}toggleCheck(ci,realII);if(search)setSearch("");}}
                              style={{width:34,height:34,borderRadius:"50%",border:`2.5px solid ${item.checked?theme.border:(item.notFound?"#F59E0B":"#E5E7EB")}`,background:item.checked?theme.border:(item.notFound?"#FEF3C7":"white"),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:15,color:"white",cursor:item.notFound?"not-allowed":"pointer",transition:"all 0.2s",boxShadow:item.checked?`0 8px 18px ${hexToRgba(theme.border,0.22)}`:"0 3px 10px rgba(15,23,42,0.04)"}}>
                              {item.checked?"✓":""}
                            </div>
                            {/* Conteúdo */}
                            <div style={{flex:1,minWidth:0}}>
                              {/* Linha 1: descrição */}
                              <div style={{fontWeight:800,fontSize:16,color:item.checked?"#9E9E9E":item.notFound?"#92400E":"#0F172A",textDecoration:item.checked?"line-through":"none",textDecorationColor:item.checked?"#EF4444":"inherit",textDecorationThickness:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6,letterSpacing:"-0.25px"}}>
                                {titleLine}
                                {isExtra&&<span style={{fontSize:10,fontWeight:700,background:"#FF7043",color:"white",padding:"2px 6px",borderRadius:180,textTransform:"uppercase",flexShrink:0}}>extra</span>}
                                {item.qtyAdjusted&&<span style={{fontSize:10,fontWeight:800,background:"#EEF2FF",color:"#4C1D95",padding:"2px 6px",borderRadius:180,textTransform:"uppercase",flexShrink:0}}>qtd. ajustada</span>}
                                {item.notFound&&<span style={{fontSize:10,fontWeight:900,background:"#DC2626",color:"white",padding:"2px 7px",borderRadius:180,textTransform:"uppercase",flexShrink:0}}>em falta</span>}
                              </div>
                              {/* Linha 2: preço unitário e total */}
                              <div style={{fontSize:12,marginTop:5,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                                {hasPrice?(
                                  <span style={{fontWeight:800,fontSize:13,color:item.checked?"#9E9E9E":"#374151"}}>{unitPriceLabel}</span>
                                ):(
                                  <span style={{color:"#6B7280"}}>Toque para informar preço</span>
                                )}
                                {hasPrice?(
                                  <span style={{fontWeight:900,fontSize:14,color:item.checked?"#9E9E9E":theme.header,flexShrink:0}}>{totalItemPrice}</span>
                                ):(
                                  <span style={{fontSize:12,color:"#9CA3AF",flexShrink:0}}>+ preço</span>
                                )}
                              </div>
                              {hasPrice && <PriceMonthBadge itemName={item.name} price={item.price} recordedAt={item.priceRecordedAt || item.checkedAt || null} listId={currentList?.id} itemId={item.id || item.name} compact />}
                              {!hasPrice && <PriceMemoryLine itemName={item.name} />}
                            </div>
                            <button onClick={e=>{e.stopPropagation();toggleNotFound(ci,realII);}} title={item.notFound?"Voltar para pendente":"Marcar item em falta"} style={{width:38,height:38,borderRadius:"50%",border:"2px solid "+(item.notFound?"#DC2626":"#E5E7EB"),background:item.notFound?"#FEE2E2":"#FFFFFF",color:item.notFound?"#991B1B":"#9CA3AF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:17,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 12px rgba(15,23,42,0.06)"}}>{item.notFound?"!":"∅"}</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={()=>setExtraModal(true)}
            style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",borderRadius:180,padding:"14px 24px",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 6px 24px rgba(124,58,237,0.4)",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap",zIndex:200,fontFamily:"inherit"}}>
            ＋ Adicionar item extra
          </button>
        </div>
      )}

      {/* MODAL: ITEM */}
      {itemModal&&currentList&&(()=>{
        const item=currentList.categories[itemModal.ci]?.items[itemModal.ii];
        if(!item)return null;
        const theme=getCatTheme(currentList.categories[itemModal.ci]?.name);
        const inferredMode=item.priceMode || inferDefaultPriceMode(item);
        const qtyOriginal=Number(item.originalQty ?? item.qty ?? 1);
        const qtyAtual=numberFromText(mQtyText) || Number(mQty||1) || 1;
        const qtyChanged=Number(qtyAtual)!==Number(qtyOriginal);
        const tempPrice=parseBRL(mPriceText);
        const temp={...item,qty:qtyAtual,price:tempPrice,priceMode:inferredMode,purchaseWeightKg:numberFromText(mWeightText)||item.purchaseWeightKg};
        const total=tempPrice!=null?getItemLineTotal(temp):0;
        const unitLabel=inferredMode==="perKg"?"Preço por kg":inferredMode==="perLiter"?"Preço por litro":inferredMode==="unit"?"Preço por unidade":inferredMode==="package"?"Preço por pacote":"Preço total pago";
        return(
          <ModalSheet onClose={()=>setItemModal(null)}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4}}>{[item.name,item.detail].filter(Boolean).join(" ")}</div>
              <div style={{fontSize:13,color:"#6B7280"}}>{currentList.categories[itemModal.ci]?.name}</div>
            </div>

            <div style={{marginBottom:14,background:qtyChanged?"#EEF2FF":"#F9FAFB",border:`1px solid ${qtyChanged?"#A78BFA":"#E5E7EB"}`,borderRadius:18,padding:12,boxShadow:qtyChanged?"0 0 0 4px rgba(124,58,237,0.08)":"none",transition:"all 0.2s"}}>
              <label style={{...lbl,marginBottom:10}}>Quantidade</label>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>{const next=Math.max(0.001,Math.round(((numberFromText(mQtyText)||Number(mQty)||1)-0.1)*1000)/1000);setMQty(next);setMQtyText(formatQtyDisplay(next));}} style={qBtn}>−</button>
                <input value={mQtyText} onChange={e=>{const txt=normalizeDecimalInput(e.target.value);setMQtyText(txt);const v=numberFromText(txt);if(v!=null&&v>0)setMQty(v);}} inputMode="decimal" style={{...inp({textAlign:"center",fontWeight:900,fontSize:20,padding:"10px 8px",borderColor:qtyChanged?"#A78BFA":"#E5E7EB"}),width:112}} />
                <button onClick={()=>{const next=Math.round(((numberFromText(mQtyText)||Number(mQty)||0)+0.1)*1000)/1000;setMQty(next);setMQtyText(formatQtyDisplay(next));}} style={qBtn}>＋</button>
                <span style={{fontSize:14,color:"#6B7280",marginLeft:4}}>{item.unit||"un"}</span>
              </div>
              {qtyChanged&&<div style={{fontSize:12,color:"#4C1D95",fontWeight:800,marginTop:8}}>Quantidade original alterada.</div>}
            </div>

            {inferredMode==="perKg" && !["kg","g"].includes(normalizeUnitForCalc(item.unit)) && (
              <div style={{marginBottom:14}}>
                <label style={lbl}>Peso total comprado em kg</label>
                <input value={mWeightText} onChange={e=>setMWeightText(e.target.value.replace(/[^0-9.,]/g,""))} placeholder="Ex: 0,700 ou 1,2" inputMode="decimal"
                  style={inp()} onFocus={e=>e.target.style.borderColor=theme.border} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
              </div>
            )}

            <div style={{marginBottom:16}}>
              <label style={lbl}>{unitLabel}</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:800,color:"#6B7280",fontSize:16,pointerEvents:"none"}}>R$</span>
                <input value={mPriceText} onChange={e=>setMPriceText(formatMoneyInput(e.target.value))}
                  placeholder="0,00" inputMode="numeric" autoFocus
                  style={inp({paddingLeft:44,fontWeight:900,fontSize:18})}
                  onFocus={e=>e.target.style.borderColor=theme.border} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
              </div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:6}}>Digite apenas números. Ex.: 800 vira R$ 8,00.</div>
              {tempPrice!=null&&mPriceText&&(<div style={{marginTop:10,fontSize:13,fontWeight:900,color:theme.header,background:theme.bg,border:`1px solid ${theme.border}40`,borderRadius:14,padding:"10px 12px",display:"flex",justifyContent:"space-between",gap:12}}>
                <span>Total calculado</span><span>{fmtR(total)}</span>
              </div>)}
              {tempPrice!=null&&mPriceText&&<PriceMonthBadge itemName={item.name} price={tempPrice} recordedAt={item.priceRecordedAt || null} listId={currentList?.id} itemId={item.id || item.name} />}
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={removeItem} style={{padding:"14px 18px",borderRadius:18,background:"#FEE2E2",border:"none",color:"#B91C1C",fontWeight:800,fontSize:16,cursor:"pointer"}}>🗑</button>
              <button onClick={confirmItem}
                disabled={!mPriceText.trim()}
                style={{flex:1,padding:14,borderRadius:18,background:`linear-gradient(135deg,${theme.border},${theme.header})`,border:"none",color:"white",fontWeight:800,fontSize:15,fontFamily:"inherit",opacity:(!mPriceText.trim())?0.5:1,cursor:(!mPriceText.trim())?"not-allowed":"pointer"}}>
                {!mPriceText.trim()?"Informe o preço":"Confirmar"}
              </button>
            </div>
          </ModalSheet>
        );
      })()}

      {/* MODAL: EXTRA */}
      {extraModal&&(
        <ModalSheet onClose={()=>setExtraModal(false)}>
          <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4,textAlign:"center"}}>Adicionar item extra</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:18,textAlign:"center"}}>Informe o item para detalhar quantidade, unidade, embalagem e preço na próxima tela.</div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Item</label>
            <input value={exName} onChange={e=>setExName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&exName.trim()){openProductDialog(exName.trim(), null, {mode:"extra"});setExtraModal(false);}}}
              placeholder="Ex: cenoura, arroz, detergente..."
              style={inp()} onFocus={e=>e.target.style.borderColor="#FF7043"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setExtraModal(false)} style={{...btnGr,flex:1}}>Cancelar</button>
            <button onClick={()=>{if(exName.trim()){openProductDialog(exName.trim(), null, {mode:"extra"});setExtraModal(false);}}}
              disabled={!exName.trim()}
              style={{flex:1.4,padding:14,borderRadius:18,background:exName.trim()?"linear-gradient(135deg,#F97316,#EA580C)":"#F0F2F5",border:"none",color:exName.trim()?"white":"#6B7280",fontSize:15,fontWeight:800,cursor:exName.trim()?"pointer":"default",fontFamily:"inherit"}}>
              Inserir
            </button>
          </div>
        </ModalSheet>
      )}

      {/* MODAL: CADASTRO LEVE DE USUÁRIO */}
      {userNameModal&&(
        <ModalSheet onClose={()=>setUserNameModal(false)}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:34,marginBottom:8}}>👋</div>
            <div style={{fontWeight:900,fontSize:20,color:"#111827",marginBottom:6}}>{sharedLandingRecord?"Identifique-se para acessar a lista":"Bem-vindo ao Tá na Lista"}</div>
            <div style={{fontSize:13,color:"#6B7280",lineHeight:1.45}}>{sharedLandingRecord?"Informe seu nome e PIN para abrir a lista recebida com segurança.":"Informe seu nome e PIN para acessar suas listas com segurança."}</div>
          </div>
          <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>Como podemos te chamar?</label>
            <input value={userNameInput} onChange={e=>setUserNameInput(e.target.value)} placeholder="Ex: Cadu" autoFocus
              style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"12px 13px",fontSize:16,fontWeight:800,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF"}}
              onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
            />
          </div>
          <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>{isRecoverPinMode?"Novo PIN":"PIN de acesso"}</label>
            <input value={userPinInput} onChange={e=>setUserPinInput(normalizePin(e.target.value))} placeholder="4 a 6 dígitos" inputMode="numeric" type="password" autoComplete="current-password"
              style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"12px 13px",fontSize:16,fontWeight:900,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",letterSpacing:"2px"}}
              onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
            />
            <div style={{fontSize:11,color:"#6B7280",fontWeight:700,marginTop:7,lineHeight:1.35}}>
              {authCheckingName?"Verificando cadastro...":isRecoverPinMode?"Informe e confirme seu novo PIN para recuperar o acesso neste aparelho.":isFirstAccessMode?"Primeiro acesso identificado. Confirme o PIN abaixo para criar seu acesso.":"Acesso rápido: informe seu PIN e toque em Entrar."}
            </div>
          </div>
          {(isFirstAccessMode||isRecoverPinMode)&&(<div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>{isRecoverPinMode?"Confirmar novo PIN":"Confirmar PIN"}</label>
            <input value={userPinConfirmInput} onChange={e=>setUserPinConfirmInput(normalizePin(e.target.value))} placeholder="Repita o PIN" inputMode="numeric" type="password" autoComplete="new-password"
              style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"12px 13px",fontSize:16,fontWeight:900,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",letterSpacing:"2px"}}
              onKeyDown={e=>{if(e.key==="Enter")submitAuthForm();}}
            />
          </div>)}
          <button onClick={submitAuthForm} disabled={loading||authCheckingName}
            style={{width:"100%",padding:16,borderRadius:20,background:(loading||authCheckingName)?"#A78BFA":"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontWeight:900,fontSize:15,cursor:(loading||authCheckingName)?"wait":"pointer",fontFamily:"inherit"}}>
            {loading?(isRecoverPinMode?"Redefinindo...":"Validando..."):authCheckingName?"Verificando...":isRecoverPinMode?"Redefinir PIN":isFirstAccessMode?"Criar acesso":"Entrar"}
          </button>
          {!isFirstAccessMode&&(<button onClick={()=>{setIsRecoverPinMode(v=>!v);setUserPinInput("");setUserPinConfirmInput("");}} disabled={loading||authCheckingName}
            style={{width:"100%",padding:12,borderRadius:16,background:"transparent",border:"none",color:"#6D28D9",fontWeight:900,fontSize:13,cursor:(loading||authCheckingName)?"wait":"pointer",fontFamily:"inherit",marginTop:8}}>
            {isRecoverPinMode?"Voltar para entrar com PIN":"Esqueci meu PIN"}
          </button>)}
          {false&&(<button onClick={()=>setUserNameModal(false)}
            style={{width:"100%",padding:12,borderRadius:18,background:"transparent",border:"none",color:"#6B7280",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
            Agora não
          </button>)}
        </ModalSheet>
      )}

      {/* MODAL: SHARE */}
      {shareModal&&(
        <ModalSheet onClose={()=>{setShareModal(false);setShareTargetList(null);}}>
          <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4,textAlign:"center"}}>Compartilhar lista</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:16,textAlign:"center"}}>Envio disponível pelo WhatsApp</div>
          <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:12}}>
            <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>Seu nome</label>
            <input value={senderName} onChange={e=>{setSenderName(e.target.value);setUserNameInput(e.target.value);saveAppUserName(e.target.value);}} placeholder="Ex: Cadu"
              style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"11px 12px",fontSize:14,fontWeight:700,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF"}}/>
            <div style={{fontSize:12,color:"#6B7280",fontStyle:"italic",marginTop:7}}>Quem receberá a lista verá seu nome</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={async()=>{const saved=getAppUserName();const clean=saveAppUserName(senderName||saved);if(!clean){showToast("⚠️ Informe seu nome antes de enviar a lista.");return;}await registerAppUser(clean);const l=shareTargetList||currentList;setShareModal(false);setShareTargetList(null);shareWhatsApp(l);}}
              style={{width:"100%",padding:16,borderRadius:20,background:"#25D366",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
              <WhatsAppIcon size={20} /> WhatsApp
            </button>          </div>
        </ModalSheet>
      )}


      {checkPopup&&currentList&&(()=>{
        const item=currentList.categories[checkPopup.ci]?.items[checkPopup.ii];
        if(!item)return null;
        return(
          <div onClick={()=>setCheckPopup(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#FFFFFF",borderRadius:20,padding:24,maxWidth:320,width:"100%",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>🛒</div>
              <div style={{fontWeight:800,fontSize:17,color:"#111827",marginBottom:6}}>{item.name}</div>
              <div style={{fontSize:14,color:"#6B7280",marginBottom:20}}>Deseja inserir o preço deste item?</div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>{
                  const l=JSON.parse(JSON.stringify(currentList));
                  l.categories[checkPopup.ci].items[checkPopup.ii].checked=true;
                  l.categories[checkPopup.ci].items[checkPopup.ii].checkedAt=new Date().toISOString();
                  updateList(l);setCheckPopup(null);setSearch("");
                  setTimeout(scrollToListTop,100);
                  const allDone=l.categories.every(c=>c.items.every(i=>i.checked||i.notFound));
                  if(allDone&&l.categories.reduce((s,c)=>s+c.items.length,0)>0)setTimeout(()=>setShowFinished(true),400);
                }} style={{flex:1,padding:14,borderRadius:20,background:"#F9FAFB",border:"none",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",color:"#4A5568"}}>Não</button>
                <button onClick={()=>{setCheckPopup(null);openItemModal(checkPopup.ci,checkPopup.ii);}}
                  style={{flex:1,padding:14,borderRadius:20,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Sim</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL: COLAR TEXTO ── */}
      {showPasteModal&&(
        <ModalSheet onClose={()=>setShowPasteModal(false)}>
          <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4}}>📋 Colar lista de texto</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:12}}>Cole sua lista — uma linha por item:</div>
          <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)}
            placeholder={"- Arroz\n- Feijão\n- Leite\n- Detergente"}
            style={{width:"100%",padding:"13px 16px",border:"2px solid #E5E7EB",borderRadius:20,fontSize:15,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",boxSizing:"border-box",height:200,resize:"none",marginBottom:16}}/>
          <button onClick={parsePastedText} disabled={!pasteText.trim()}
            style={{...btnG,opacity:pasteText.trim()?1:0.5,cursor:pasteText.trim()?"pointer":"not-allowed"}}>
            ✅ Importar itens
          </button>
        </ModalSheet>
      )}


      {/* ── MODAL: LER FOTO DA LISTA ── */}
      {showPhotoModal&&(
        <ModalSheet onClose={()=>!ocrLoading&&setShowPhotoModal(false)}>
          <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4}}>📷 Ler lista por foto</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:14,lineHeight:1.45}}>Fotografe uma lista impressa ou manuscrita. A IA vai interpretar a imagem e montar os itens. Para melhorar a leitura, use boa iluminação e enquadre apenas a lista.</div>
          <label style={{...btnG,background:"linear-gradient(135deg,#16A34A,#22C55E)",marginBottom:12,cursor:ocrLoading?"not-allowed":"pointer",opacity:ocrLoading?0.7:1}}>
            📸 Tirar foto ou escolher imagem
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoListFile} disabled={ocrLoading} style={{display:"none"}}/>
          </label>
          {ocrFileName&&<div style={{fontSize:12,color:"#6B7280",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Arquivo: {ocrFileName}</div>}
          {ocrLoading&&(
            <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:14,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:800,color:"#111827",marginBottom:8}}>Interpretando imagem... {ocrProgress}%</div>
              <div style={{height:10,background:"#E5E7EB",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${ocrProgress}%`,background:"linear-gradient(90deg,#16A34A,#22C55E)",borderRadius:999,transition:"width .25s"}}/>
              </div>
            </div>
          )}
          <textarea value={ocrText} onChange={e=>setOcrText(e.target.value)}
            placeholder={ocrLoading?"Aguarde a leitura da imagem...":"O texto reconhecido aparecerá aqui para revisão antes de importar."}
            style={{width:"100%",padding:"13px 16px",border:"2px solid #E5E7EB",borderRadius:20,fontSize:15,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF",boxSizing:"border-box",height:190,resize:"none",marginBottom:14}}/>
          <button onClick={()=>importTextAsPendingItems(ocrText,{closePhoto:true})} disabled={!ocrText.trim()||ocrLoading}
            style={{...btnG,opacity:ocrText.trim()&&!ocrLoading?1:0.5,cursor:ocrText.trim()&&!ocrLoading?"pointer":"not-allowed"}}>
            ✅ Transformar em itens da lista
          </button>
        </ModalSheet>
      )}

      {/* ── MODAL: REUTILIZAR LISTA ── */}
      {reuseModal&&(
        <ModalSheet onClose={()=>setReuseModal(null)}>
          <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4}}>🔁 Repetir lista</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:16,textAlign:"center"}}>Escolha a lista base:</div>
          <div style={{background:"#F9FAFB",borderRadius:20,padding:12,marginBottom:16,maxHeight:200,overflowY:"auto"}}>
            {lists.map(l=>(
              <button key={l.id} onClick={()=>setReuseModal(l)}
                style={{width:"100%",padding:"10px 14px",border:"none",background:reuseModal.id===l.id?"#F5F3FF":"none",borderRadius:18,textAlign:"left",fontSize:14,fontWeight:reuseModal.id===l.id?700:500,color:reuseModal.id===l.id?"#6D28D9":"#111827",cursor:"pointer",display:"flex",gap:10,marginBottom:4,fontFamily:"inherit"}}>
                <span>{({mercado:"🛒",hortifruti:"🥬",farmacia:"💊",construcao:"🏗️",eletrico:"⚡",escolar:"🏫",eventos:"🎉",outros:"📦"})[l.type]||"📦"}</span>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</span>
              </button>
            ))}
          </div>
          <button onClick={()=>reuseList(reuseModal)} style={{...btnG}}>🔁 Usar como base</button>
        </ModalSheet>
      )}

    </div>
  );
}
