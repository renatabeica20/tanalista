export function getStoredValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

export function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignora erros de armazenamento
  }
}

export function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignora erros
  }
}

export function getStoredJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setStoredJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignora erros
  }
}
