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
