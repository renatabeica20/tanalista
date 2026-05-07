import { SUPABASE_URL } from "../config/env";
import {
  APP_PIN_SESSION_NAME_KEY,
  APP_PIN_SESSION_AT_KEY,
} from "../config/storageKeys";
import { getStoredValue, setStoredValue, removeStoredValue } from "../utils/storageUtils";
import { normalizeAuthName } from "../utils/formatters";
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
