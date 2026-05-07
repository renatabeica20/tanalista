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
