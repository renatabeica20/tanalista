import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "../config/env";
import {
  APP_PIN_SESSION_NAME_KEY,
  APP_PIN_SESSION_AT_KEY,
} from "../config/storageKeys";
import { getStoredValue, setStoredValue, removeStoredValue } from "../utils/storageUtils";
import { normalizeAuthName } from "../utils/formatters";
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
export function isPinSessionVerified(name) {
  const clean = String(name || "").trim().toLowerCase();
  const verified = getStoredValue(APP_PIN_SESSION_NAME_KEY)
    .trim()
    .toLowerCase();

  return Boolean(clean && verified && clean === verified);
}
export function markPinSessionVerified(name) {
  const clean = String(name || "").trim();

  if (!clean) return;

  setStoredValue(APP_PIN_SESSION_NAME_KEY, clean);

  setStoredValue(
    APP_PIN_SESSION_AT_KEY,
    new Date().toISOString()
  );
}
export function clearPinSession() {
  removeStoredValue(APP_PIN_SESSION_NAME_KEY);
  removeStoredValue(APP_PIN_SESSION_AT_KEY);
}
export function normalizePin(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}
export function isValidPin(value) {
  const pin = normalizePin(value);
  return pin.length >= 4 && pin.length <= 6;
}
export async function hashUserPin(name, pin) {
  const cleanName = normalizeAuthName(name);
  const cleanPin = String(pin || "").trim();
  const raw = `ta-na-lista:v1:${cleanName}:${cleanPin}`;

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  let h = 0;

  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }

  return `fallback-${Math.abs(h)}`;
}
export async function findUserAuthProfile(name) {
  const clean = String(name || "").trim();

  if (!clean || !hasSupabaseConfig()) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shared_lists?list_type=eq.auth_profile&remetente=ilike.${encodeURIComponent(clean)}&select=*&order=created_at.asc&limit=1`,
      {
        method: "GET",
        headers: supabaseHeaders({ "Cache-Control": "no-store" }),
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}
export async function createUserAuthProfile(name, pinHash) {
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
    throw new Error(
      `Não foi possível criar PIN de acesso (${res.status}) ${detail}`.trim()
    );
  }

  const data = await res.json().catch(() => []);

  return Array.isArray(data) ? data[0] : data;
}
export async function resetUserAuthPin(
  name,
  newPin,
  newPinConfirm = ""
) {
  const clean = String(name || "").trim();

  const safePin = normalizePin(newPin);
  const safeConfirm = normalizePin(newPinConfirm);

  if (!clean) {
    return {
      ok: false,
      message: "Informe seu nome para recuperar o acesso.",
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      message: "Configuração do Supabase não encontrada.",
    };
  }

  if (!isValidPin(safePin)) {
    return {
      ok: false,
      message: "Informe um novo PIN de 4 a 6 dígitos.",
    };
  }

  if (safePin !== safeConfirm) {
    return {
      ok: false,
      message: "A confirmação do PIN não confere.",
    };
  }

  const profile = await findUserAuthProfile(clean);

  if (!profile?.id) {
    return {
      ok: false,
      message: "Perfil não encontrado para este nome.",
    };
  }

  const pinHash = await hashUserPin(clean, safePin);

  const nextData = {
    ...(profile.data || {}),
    authProfile: true,
    name: clean,
    pinHash,
    pinVersion: "sha256-v1",
    updatedAt: new Date().toISOString(),
  };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${profile.id}`,
    {
      method: "PATCH",
      headers: supabaseHeaders({
        Prefer: "return=representation",
      }),
      body: JSON.stringify({
        data: nextData,
      }),
    }
  );

  if (!res.ok) {
    return {
      ok: false,
      message: "Não foi possível atualizar o PIN.",
    };
  }

  markPinSessionVerified(clean);

  return {
    ok: true,
    message: "PIN atualizado com sucesso.",
  };
}
