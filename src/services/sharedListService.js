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
    function getAppUserId() {
  return getStoredValue(APP_USER_ID_KEY) || null;
}
  };
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
export async function updateSharedListRecord(id, list) {
  if (!id || !hasSupabaseConfig()) return null;

  const userId = list?.userId || getAppUserId() || null;

  const payload = {
    title: list?.name || "Lista de compras",
    list_type: list?.type || "general",
    budget: Number(list?.budget || 0),
    data: {
      ...list,
      userId,
      sharedId: id,
      lastSyncedAt: new Date().toISOString(),
    },
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
