import { useState, useRef, useCallback, useEffect } from "react";
import {
  ANTHROPIC_MODEL_CLASSIFY,
  ANTHROPIC_MODEL_ORGANIZE,
  ANTHROPIC_MODEL_VISION,
  APP_PUBLIC_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "./config/env";
import {
  APP_USER_NAME_KEY,
  APP_DEVICE_ID_KEY,
  APP_USER_REGISTERED_KEY,
  APP_USER_ID_KEY,
  APP_PIN_SESSION_NAME_KEY,
  APP_PIN_SESSION_AT_KEY,
  APP_INSTALL_PROMPT_DISMISSED_KEY,
  APP_INSTALL_PROMPT_LAST_SHOWN_KEY,
  APP_GUIDED_TOUR_DONE_KEY,
  APP_GUIDED_TOUR_DISMISSED_KEY,
} from "./config/storageKeys";
import {
  getStoredValue,
  setStoredValue,
  removeStoredValue,
  getStoredJSON,
  setStoredJSON,
} from "./utils/storageUtils";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  normalizeText,
  normalizeAuthName,
} from "./utils/formatters";
import {
  isPinSessionVerified,
  markPinSessionVerified,
  clearPinSession,
  normalizePin,
  isValidPin,
  hashUserPin,
  verifyOrCreateUserPin,
  resetUserAuthPin,
  findUserAuthProfile,
  
} from "./services/authService";
import {
  hasSupabaseConfig,
  supabaseHeaders,
  getSharedListRecord,
  updateSharedListRecord,
  deleteSharedListRecord,
} from "./services/sharedListService";
import {
  appendSharedListEvent,
  loadStoredNotifications,
  saveStoredNotifications,
  eventToNotification,
  buildSharedListEvent,
  addLocalSharedEventToList,
} from "./services/SharedEventsService";
import {
  getAppDeviceId,
  getAppUserName,
  saveAppUserName,
  getAppUserId,
  saveAppUserId,
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
} from "./services/CloudPersistenceService";
import {
  getProductConfig,
  getEstimatedProduceWeight,
  getCatTheme,
  hexToRgba,
  getPremiumSectionStyle,
  getPremiumSectionHeaderStyle,
} from "./services/ProductConfigService";
import GuidedTourController from "./components/GuidedTourController";
import SharedSyncController from "./components/SharedSyncController";
import ToastMessage from "./components/ToastMessage";
import InstallPrompt from "./components/InstallPrompt";
import HomeScreen from "./pages/HomeScreen";
import AppLogo from "./components/AppLogo";
import BrandWordmark from "./components/BrandWordmark";
import ModuleIcon from "./components/ModuleIcon";
import ModalSheet from "./components/ModalSheet";
import AppHeader from "./components/AppHeader";
import NotificationsPanel from "./components/NotificationsPanel";
import ExpandableSection from "./components/ExpandableSection";
import StatsLineChart from "./components/StatsLineChart";
import StatsDetailList from "./components/StatsDetailList";
import PriceStatsScreen from "./components/PriceStatsScreen";
import ListsSection from "./components/ListsSection";
import FloatingActions from "./components/FloatingActions";
import CreateListScreen from "./components/CreateListScreen";
import ListScreenHeader from "./components/ListScreenHeader";
import SharedListModal from "./components/SharedListModal";
import LoginScreen from "./components/LoginScreen";
import PantrySection from "./components/PantrySection";
import BottomSheets from "./components/BottomSheets";
import AnalyticsController from "./components/AnalyticsController";
import AppUpdateController from "./components/AppUpdateController";
import SearchBar from "./components/SearchBar";
import ProductEditorModal from "./components/ProductEditorModal";
import ItemRow from "./components/ItemRow";
import SharedStatusPanel from "./components/SharedStatusPanel";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import ShoppingListPreview from "./components/ShoppingListPreview";
import HomeBanner from "./components/HomeBanner";
import PasteModal from "./components/PasteModal";
import PhotoModal from "./components/PhotoModal";
import {
  LIST_TYPE_CONFIGS,
  getListTypeConfig,
  getListTypePromptContext,
} from "./config/listTypeConfigs";
import { getListTypeSuggestions } from "./config/listTypeSuggestions";
import { getListTypeRules } from "./config/listTypeRules";
// Etapa 7.76 - Override final rígido por item e categorias permitidas

// ── API Anthropic via função segura do Vercel ─────────────────────────────
// O navegador chama /api/anthropic; a chave fica protegida no servidor.




// ── EVENTOS ANALÍTICOS (Supabase app_events) ─────────────────────────────
// Registra ações relevantes para medir uso, frequência, listas criadas/concluídas
// e comportamento comercial do app. Mantém compatibilidade com a arquitetura REST atual.
async function registrarEvento(eventType, metadata = {}) {
  try {
    if (!hasSupabaseConfig()) return false;

    const userId = getAppUserId() || null;
    const userName = getAppUserName() || "";
    const deviceId = getAppDeviceId();

    const payload = {
      user_id: userId,
      event_type: String(eventType || "").trim(),
      metadata: {
        ...(metadata && typeof metadata === "object" ? metadata : {}),
        user_name: userName,
        device_id: deviceId,
        app_version: "etapa-7.68-analytics",
      },
    };

    if (!payload.event_type) return false;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_events`, {
      method: "POST",
      headers: supabaseHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("Erro ao registrar evento analítico:", res.status, text);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Erro ao registrar evento analítico:", err);
    return false;
  }
}


// ── ATUALIZAÇÃO DO APP (PWA/cache) ───────────────────────────────────────
// Detecta quando uma nova versão foi publicada no servidor e avisa o usuário.
// Isso evita que quem adicionou o app à tela inicial continue usando arquivos antigos em cache.
const APP_UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 1000;

function getCurrentAppAssetSignature() {
  try {
    if (typeof document === "undefined") return "";
    const scripts = Array.from(document.querySelectorAll('script[src]')).map((el) => el.getAttribute("src") || "");
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map((el) => el.getAttribute("href") || "");
    return [...scripts, ...styles].filter(Boolean).sort().join("|");
  } catch {
    return "";
  }
}

async function fetchFreshAppAssetSignature() {
  try {
    if (typeof window === "undefined") return "";
    const url = `${window.location.origin}/?tnl_update_check=${Date.now()}`;
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    if (!res.ok) return "";
    const html = await res.text();
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const scripts = Array.from(doc.querySelectorAll('script[src]')).map((el) => el.getAttribute("src") || "");
    const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]')).map((el) => el.getAttribute("href") || "");
    return [...scripts, ...styles].filter(Boolean).sort().join("|");
  } catch (err) {
    console.warn("Não foi possível verificar atualização do app:", err);
    return "";
  }
}

async function clearAppCachesBeforeReload() {
  try {
    if (typeof navigator !== "undefined" && navigator.serviceWorker?.getRegistration) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      if (registration?.update) {
        await registration.update().catch(() => null);
      }
    }
  } catch {}

  try {
    if (typeof caches !== "undefined" && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {}
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
      .tnl-keyboard-safe-modal {
        max-height: calc(100dvh - max(24px, env(safe-area-inset-top)) - var(--tnl-keyboard-offset, 0px));
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        scroll-margin-bottom: calc(var(--tnl-keyboard-offset, 0px) + 32px);
      }
      .tnl-keyboard-safe-field {
        scroll-margin-bottom: calc(var(--tnl-keyboard-offset, 0px) + 110px);
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

const GUIDED_TOUR_STEPS = [
  {
    id: "home_compras",
    screen: "home",
    icon: "🛒",
    title: "Comece criando sua lista",
    text: "Toque em Compras para iniciar uma nova lista inteligente de mercado.",
    position: "bottom",
  },

  // Página 2 — Montagem da lista
  {
    id: "create_budget",
    screen: "create",
    icon: "💰",
    title: "Defina o orçamento",
    text: "O app acompanha os gastos em tempo real e avisa quando o limite for ultrapassado.",
    position: "bottom",
  },
  {
    id: "create_name",
    screen: "create",
    icon: "📝",
    title: "Nomeie sua lista",
    text: "Use nomes fáceis de reconhecer, como Compras da Semana ou Churrasco.",
    position: "bottom",
  },
  {
    id: "create_item_input",
    screen: "create",
    icon: "✍️",
    title: "Digite os produtos",
    text: "O app corrige nomes automaticamente e melhora a classificação dos itens.",
    position: "top",
  },
  {
    id: "create_item_voice",
    screen: "create",
    icon: "🎙️",
    title: "Use voz ou cole listas",
    text: "Você pode ditar itens ou colar listas inteiras de WhatsApp, notas ou mensagens.",
    position: "top",
  },
  {
    id: "create_pantry",
    screen: "create",
    icon: "🏠",
    title: "Compare com Itens em Casa",
    text: "Evite compras repetidas comparando sua lista com os produtos que já possui.",
    position: "top",
  },
  {
    id: "create_ai",
    screen: "create",
    icon: "🤖",
    title: "Organize com IA",
    text: "A IA separa os itens por categorias para facilitar o percurso dentro do mercado.",
    position: "top",
  },
  {
    id: "create_swipe",
    screen: "create",
    icon: "↔️",
    title: "Deslize entre as telas",
    text: "Passe o dedo para a esquerda ou direita para avançar ou voltar rapidamente.",
    position: "bottom",
  },

  // Página 3 — Compra
  {
    id: "list_progress",
    screen: "list",
    icon: "📊",
    title: "Acompanhe o orçamento",
    text: "Veja quanto já gastou, o valor restante e o progresso da compra.",
    position: "bottom",
  },
  {
    id: "list_budget_alert",
    screen: "list",
    icon: "⚠️",
    title: "Sugestões inteligentes de economia",
    text: "Quando o orçamento for ultrapassado, o app sugere ajustes priorizando itens supérfluos e extras.",
    position: "bottom",
  },
  {
    id: "list_item_check",
    screen: "list",
    icon: "✔️",
    title: "Marque os itens comprados",
    text: "Toque no círculo para indicar que o produto já foi colocado no carrinho.",
    position: "top",
  },
  {
    id: "list_item_price",
    screen: "list",
    icon: "💲",
    title: "Toque no item para informar preço",
    text: "Você pode alterar preço, quantidade, unidade e até editar o nome do produto.",
    position: "top",
  },
  {
    id: "list_item_missing",
    screen: "list",
    icon: "∅",
    title: "Marque item em falta",
    text: "Use o botão à direita quando o produto não for encontrado no mercado.",
    position: "top",
  },
  {
    id: "list_extra_item",
    screen: "list",
    icon: "➕",
    title: "Adicione itens extras",
    text: "Extras com preço entram automaticamente como comprados e identificados na lista.",
    position: "top",
  },
  {
    id: "list_search",
    screen: "list",
    icon: "🔎",
    title: "Busque produtos rapidamente",
    text: "Use a busca para localizar itens sem precisar percorrer toda a lista.",
    position: "bottom",
  },
  {
    id: "list_swipe",
    screen: "list",
    icon: "↔️",
    title: "Use gestos para navegar",
    text: "Deslize lateralmente para voltar ou avançar sem usar os botões.",
    position: "bottom",
  },
  {
    id: "list_share",
    screen: "list",
    icon: "🤝",
    title: "Compartilhe a lista",
    text: "Envie a lista para outra pessoa acompanhar ou ajudar durante as compras.",
    position: "bottom",
  },
  {
    id: "list_back_home",
    screen: "list",
    icon: "🏁",
    title: "Finalize a compra",
    text: "Ao sair, a lista é salva no histórico e pode ser reutilizada futuramente.",
    position: "bottom",
  },
];

const GUIDED_TOUR_FIRST_STEP_BY_SCREEN = GUIDED_TOUR_STEPS.reduce((acc, step, index) => {
  if (step?.screen && acc[step.screen] === undefined) acc[step.screen] = index;
  return acc;
}, {});

function hasCompletedGuidedTour() {
  try {
    return localStorage.getItem(APP_GUIDED_TOUR_DONE_KEY) === "1" || localStorage.getItem(APP_GUIDED_TOUR_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function setGuidedTourCompleted(value = "done") {
  try {
    if (value === "dismissed") localStorage.setItem(APP_GUIDED_TOUR_DISMISSED_KEY, "1");
    localStorage.setItem(APP_GUIDED_TOUR_DONE_KEY, "1");
  } catch {}
}

function tourHighlightStyle(active) {
  if (!active) return {};
  return { filter: "brightness(1.08) saturate(1.05)" };
}



function isAppRunningStandalone() {
  try {
    return Boolean(
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator?.standalone === true
    );
  } catch {
    return false;
  }
}

function getInstallPlatform() {
  const ua = String(navigator?.userAgent || "");
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator?.platform === "MacIntel" && navigator?.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

function shouldShowInstallPromptNotice() {
  try {
    if (isAppRunningStandalone()) return false;
    if (localStorage.getItem(APP_INSTALL_PROMPT_DISMISSED_KEY) === "1") return false;
    const lastShown = Number(localStorage.getItem(APP_INSTALL_PROMPT_LAST_SHOWN_KEY) || 0);
    if (!lastShown) return true;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - lastShown > sevenDays;
  } catch {
    return !isAppRunningStandalone();
  }
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
const sharedWith=list.sharedWithName;
if(sharedWith&&!receivedFromAnotherUser){
  const normalizedWith=normalizeAuthName(sharedWith);
  if(!normalizedCurrent||normalizedWith!==normalizedCurrent){
    return{type:"shared",icon:"🤝",text:"Compartilhada com "+sharedWith};
  }
}
  if (owner) {
    return { type:"created", icon:"✍️", text: normalizedCurrent && normalizedOwner === normalizedCurrent ? "Criada por você" : "Feita por " + owner };
  }
  return null;
}

const LIST_TYPES = Object.values(LIST_TYPE_CONFIGS).map((type) => ({
  id: type.id,
  label: `${type.icon} ${type.label}`,
}));

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
  const typeConfig = getListTypeConfig(type);
  const typeName = typeConfig?.label || TYPE_NAMES[type] || "geral";
  const typePromptContext = getListTypePromptContext(type);
  const preferredCategories = Array.isArray(typeConfig?.categories) ? typeConfig.categories.join(", ") : "";
  const preferredUnits = Array.isArray(typeConfig?.units) ? typeConfig.units.join(", ") : "";
  const list = items
    .map((i) => `${[i.marca, i.tipo, i.name, i.embalagem || i.peso || i.volume].filter(Boolean).join(" ")} - ${i.qty} ${i.unit}`)
    .join("\n");

  const prompt = `${typePromptContext}

Organize em categorias para lista de "${typeName}". Retorne APENAS JSON válido, sem markdown:
{"categories":[{"name":"Categoria","items":[{"name":"Nome","detail":"tipo e tamanho","qty":1,"unit":"un","price":null,"checked":false}]}]}

ITENS:
${list}

Categorias preferenciais para este tipo de lista: ${preferredCategories}.
Unidades preferenciais para este tipo de lista: ${preferredUnits}.

Regras: categorias em português do Brasil, máximo 8 categorias, preserve qty e unit exatos. Antes de classificar, corrija nomes digitados de forma aproximada, como 'lápi de cor' para 'lápis de cor', 'lustra móvei' para 'lustra-móveis' e 'bom bom' para 'bombom'.\nRegras de categoria obrigatórias:\n- frutas, legumes e verduras (mamão, manga, pera, maçã, banana, tomate, alface etc.) devem ficar em Hortifruti;\n- cerveja, refrigerante, água, suco e energético devem ficar em Bebidas ou Cervejas;\n- carne bovina, frango, peixe, linguiça e similares devem ficar em Carnes e Aves;\n- não crie item separado apenas para quantidade, como "24 unidades"; trate isso como detalhe/embalagem do item anterior;
- itens como abóbora, rúcula, caqui, flores comestíveis/verduras e legumes devem ficar em Hortifruti;
- álcool, lustra móvel, brilho alumínio, limpa alumínio, sapólio, bucha/esponja e produtos de limpeza devem ficar em Limpeza;
- coxão mole, fígado, bucho, acém, músculo e cortes/miúdos devem ficar em Carnes e Aves;
- bombom, amendoim, castanhas e doces devem ficar em Snacks e Doces;
- lápis de cor, canetinha, giz de cera e material escolar devem ficar em Material de Escrita;
- quando a lista não for de supermercado, priorize as categorias preferenciais do tipo selecionado e evite classificar tudo como mercado;
- para construção, nunca use Mercearia, Hortifruti, Cafés e Chás ou categorias de supermercado; use Materiais Básicos, Acabamento, Hidráulica, Ferragens, Ferramentas, Tintas ou Outros;
- para elétrico, use Fios e Cabos, Tomadas e Interruptores, Disjuntores e Proteção, Iluminação, Conduítes e Eletrodutos, Ferramentas ou Outros;
- para escolar, não use Hortifruti, Cafés e Chás ou Mercearia; use Papelaria, Escrita, Cadernos e Papéis, Artes, Mochilas e Estojos, Uniformes ou Outros;
- para farmácia, classifique medicamentos pelo nome comercial ou princípio ativo em Medicamentos, itens infantis em Bebê e materiais de cuidado em Curativos/Higiene Pessoal.`;

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
  return postProcessOrganizedCategories(sanitizeCategories(categories), type);
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

const SMART_PRODUCT_NAME_CORRECTIONS = {
  "lapi de cor": "Lápis de cor",
  "lapis de cor": "Lápis de cor",
  "lapiz de cor": "Lápis de cor",
  "lapis cor": "Lápis de cor",
  "lapi cor": "Lápis de cor",
  "lustra movel": "Lustra-móveis",
  "lustra moveis": "Lustra-móveis",
  "lustra móveis": "Lustra-móveis",
  "lustra móvei": "Lustra-móveis",
  "lustra movei": "Lustra-móveis",
  "lustra móvel": "Lustra-móveis",
  "pano prato": "Pano de prato",
  "pano de prato": "Pano de prato",
  "pano d prato": "Pano de prato",
  "bom bom": "Bombom",
  "bombom": "Bombom",
  "bombon": "Bombom",
  "rucula": "Rúcula",
  "rúcula": "Rúcula",
  "alcool": "Álcool",
  "álcool": "Álcool",
  "abobora": "Abóbora",
  "abóbora": "Abóbora",
  "caqui": "Caqui",
  "coxao mole": "Coxão mole",
  "coxão mole": "Coxão mole",
  "figado": "Fígado",
  "fígado": "Fígado",
  "brilho aluminio": "Brilho alumínio",
  "brilho alumínio": "Brilho alumínio",
  "limpa aluminio": "Limpa alumínio",
  "limpa alumínio": "Limpa alumínio",
  "bucho": "Bucho",
  "amendoim": "Amendoim",
  // Correções de nomes truncados ou com acento cortado
  "carne moi": "Carne moída",
  "carne moí": "Carne moída",
  "carne moida": "Carne moída",
  "pao frances": "Pão Francês",
  "pão frances": "Pão Francês",
  "pao francê": "Pão Francês",
  "pão francê": "Pão Francês",
  "pao france": "Pão Francês",
  "pão france": "Pão Francês",
};

function smartNormalizeProductName(value) {
  const original = String(value || "").trim();
  if (!original) return "";

  const plain = normalizePlainText(original)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (SMART_PRODUCT_NAME_CORRECTIONS[plain]) {
    return SMART_PRODUCT_NAME_CORRECTIONS[plain];
  }

  // Correções por aproximação simples para erros comuns de digitação.
  const compact = plain.replace(/\s+/g, "");
  const compactMap = {
    "lapidecor": "Lápis de cor",
    "lapisdecor": "Lápis de cor",
    "lapizdecor": "Lápis de cor",
    "lustramovel": "Lustra-móveis",
    "lustamovel": "Lustra-móveis",
    "lustramovei": "Lustra-móveis",
    "lustramoveis": "Lustra-móveis",
    "panodeprato": "Pano de prato",
    "panoprato": "Pano de prato",
    "bombom": "Bombom",
    "bombon": "Bombom",
    "bombo": "Bombom"
  };

  if (compactMap[compact]) {
    return compactMap[compact];
  }

  return normalizeProductName(original);
}


function normalizeTextForCategory(value) {
  return normalizePlainText(value)
    .replace(/\([^)]*\)/g, " ")
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

  // Palavras terminadas em "ês" são adjetivos de origem/gentílico — não singularizar
  const esAdjectives = ["frances", "ingles", "japones", "chines", "portugues", "holandes", "finlandes", "escóces", "escoces", "irandes", "danes"];
  if (esAdjectives.includes(plain)) return lower;

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
  if (/^saco/.test(raw)) return "saco";
  if (/^rolo/.test(raw)) return "rolo";
  if (/^barra/.test(raw)) return "barra";
  if (/^kit/.test(raw)) return "kit";
  if (/^frasco/.test(raw)) return "frasco";
  if (/^tubo/.test(raw)) return "tubo";
  if (/^cartela/.test(raw)) return "cartela";
  if (/^galao|^galão/.test(raw)) return "galão";
  if (/^metro$|^metros$|^m$/.test(raw)) return "metro";
  if (/^m2$|^m²$|^metro quadrado|^metros quadrados/.test(raw)) return "m²";
  if (/^m3$|^m³$|^metro cubico|^metro cúbico|^metros cubicos|^metros cúbicos/.test(raw)) return "m³";
  if (/^quilo|^kg$|^grama|^g$/.test(raw)) return "kg";
  if (/^litro|^l$|^mililitro|^ml$/.test(raw)) return "litro";
  if (/^lata/.test(raw)) return "lata";
  if (/^garrafa/.test(raw)) return "garrafa";
  if (/^bandeja/.test(raw)) return "bandeja";
  if (/^pote/.test(raw)) return "pote";
  if (/^duzia|^dúzia/.test(raw)) return "dúzia";
  if (/^peca|^peça/.test(raw)) return "peça";
  if (/^par/.test(raw)) return "par";
  if (/^mileiro/.test(raw)) return "mileiro";
  if (/^unidade|^un$/.test(raw)) return "unidade";
  return "unidade";
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
    "litro":"litros",
    "saco":"sacos",
    "rolo":"rolos",
    "barra":"barras",
    "kit":"kits",
    "frasco":"frascos",
    "tubo":"tubos",
    "cartela":"cartelas",
    "galão":"galões",
    "metro":"metros",
    "m²":"m²",
    "m³":"m³",
    "unidade":"unidades",
    "dúzia":"dúzias",
    "peça":"peças",
    "par":"pares",
    "mileiro":"mileiros",
    "bandeja":"bandejas",
    "pote":"potes",
  };
  if (u === "kg") return "kg";
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
  const name = smartNormalizeProductName(item?.name || item?.nome || "");
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


function normalizeListTypeIdForRules(type) {
  const raw = normalizePlainText(type || "mercado");
  const aliases = {
    "supermercado": "mercado",
    "mercado": "mercado",
    "evento": "festa",
    "eventos": "festa",
    "festa": "festa",
    "festas": "festa",
    "construcao": "construcao",
    "construção": "construcao",
    "obra": "construcao",
    "reforma": "construcao",
    "eletrico": "eletrico",
    "elétrico": "eletrico",
    "eletrica": "eletrico",
    "elétrica": "eletrico",
    "material eletrico": "eletrico",
    "material elétrico": "eletrico",
    "escolar": "escolar",
    "farmacia": "farmacia",
    "farmácia": "farmacia",
    "condominio": "condominio",
    "condomínio": "condominio",
    "outros": "outros",
    "outras": "outros"
  };
  return aliases[raw] || type || "mercado";
}

function categoryExistsInConfig(type, categoryName) {
  const normalizedType = normalizeListTypeIdForRules(type);
  const cfg = getListTypeConfig(normalizedType);
  const allowed = Array.isArray(cfg?.categories) ? cfg.categories : [];
  return allowed.some((c) => normalizePlainText(c) === normalizePlainText(categoryName));
}

function getAllowedCategoryFallback(type) {
  const normalizedType = normalizeListTypeIdForRules(type);
  const cfg = getListTypeConfig(normalizedType);
  const allowed = Array.isArray(cfg?.categories) && cfg.categories.length ? cfg.categories : ["Outros"];
  return allowed.includes("Outros") ? "Outros" : allowed[allowed.length - 1];
}

function getDirectCategoryOverride(type, item) {
  const normalizedType = normalizeListTypeIdForRules(type);
  const text = normalizeTextForCategory([
    item?.name,
    item?.detail,
    item?.marca,
    item?.tipo,
    item?.embalagem,
    item?.peso,
    item?.volume,
  ].filter(Boolean).join(" "));

  if (!text) return null;

  const includesAny = (words) => words.some((w) => text.includes(normalizeTextForCategory(w)));

  if (normalizedType === "festa") {
    if (includesAny(["cerveja", "heineken", "refrigerante", "água", "agua", "suco", "energético", "energetico"])) return "Bebidas";
    if (includesAny(["gelo", "carvão", "carvao", "fósforo", "fosforo", "acendedor"])) return "Gelo e Apoio";
    if (includesAny(["picanha", "linguiça", "linguica", "coxinha da asa", "frango", "carne"])) return "Carnes e Aves";
    if (includesAny(["copo", "prato", "guardanapo", "talher", "descartável", "descartavel"])) return "Descartáveis e Embalagens";
  }

  if (normalizedType === "construcao") {
    if (includesAny(["cimento", "areia", "brita", "pedra brita", "argamassa", "rejunte", "massa corrida", "cal", "gesso"])) return "Materiais Básicos";
    if (includesAny(["piso", "porcelanato", "azulejo", "revestimento", "rodapé", "rodape"])) return "Acabamento";
    if (includesAny(["ferro", "vergalhão", "vergalhao", "prego", "parafuso", "arame", "barra"])) return "Ferragens";
    if (includesAny(["tinta", "rolo", "pincel", "lixa", "selador"])) return "Tintas e Pintura";
  }

  if (normalizedType === "eletrico") {
    if (includesAny(["fio", "cabo", "1,5mm", "2,5mm", "4mm"])) return "Fios e Cabos";
    if (includesAny(["disjuntor", "bipolar", "monopolar", "dps", "dr"])) return "Disjuntores e Proteção";
    if (includesAny(["aterramento", "haste", "conector", "barra"])) return "Conectores";
    if (includesAny(["tomada", "interruptor"])) return "Tomadas e Interruptores";
    if (includesAny(["lâmpada", "lampada", "luminária", "luminaria", "spot", "bocal"])) return "Iluminação";
    if (includesAny(["fita isolante", "alicate", "multímetro", "multimetro"])) return "Ferramentas";
  }

  if (normalizedType === "mercado") {
    if (includesAny(["macarrão", "macarrao", "massa", "espaguete", "spaghetti", "parafuso", "penne", "talharim", "fusilli", "lasanha", "massa para lasanha", "massa de pastel"])) return "Mercearia";

    // Bebidas ANTES de Limpeza — "heineken" e "cerveja" não podem cair em Limpeza por causa de "álcool"
    if (includesAny(["cerveja", "heineken", "skol", "brahma", "antarctica", "budweiser", "itaipava", "crystal", "amstel", "corona", "stella", "becks", "brahma duplo malte", "refrigerante", "coca", "guarana", "guaraná", "pepsi", "suco", "energetico", "energético", "monster", "redbull", "red bull", "agua", "água", "agua com gas", "água com gás"])) return "Bebidas";
    // Descartáveis — copo e guardanapo iam parar em "Outros" sem este override
    if (includesAny(["copo descartavel", "copo descartável", "copo", "prato descartavel", "prato descartável", "guardanapo", "talher descartavel", "talher descartável", "talher", "papel aluminio", "papel alumínio", "papel filme", "saco freezer", "saco plastico", "saco plástico", "papel toalha"])) return "Descartáveis e Embalagens";
    if (includesAny(["manteiga", "mateiga", "margarina", "leite", "queijo", "presunto", "iogurte", "ovo"])) return "Frios e Laticínios";
    if (includesAny(["carne moída", "carne moida", "carne moi", "coxão mole", "coxao mole", "colchão mole", "colchao mole", "picanha", "linguiça", "linguica", "frango"])) return "Carnes e Aves";
    if (includesAny(["detergente", "sabão", "sabao", "desinfetante", "água sanitária", "agua sanitaria"])) return "Limpeza";
  }

  if (normalizedType === "farmacia") {
    if (includesAny(["donaren", "histamin", "torsilax", "dipirona", "paracetamol", "ibuprofeno", "amoxicilina", "clavulanato", "amoxiclav", "atak", "azitromicina", "cefalexina", "nimesulida", "dexametasona", "prednisona", "omeprazol", "losartana", "enalapril", "metformina", "sinvastatina", "atorvastatina", "clonazepam", "rivotril", "ritalina", "fluoxetina", "sertralina", "antibiotico", "antiinflamatorio", "vitamina", "suplemento", "xarope", "suspensao", "suspensão", "comprimido", "capsula", "cápsula", "injetavel", "injetável", "pomada", "creme", "colirio", "colírio", "solucao oral", "solução oral"])) return "Medicamentos";
    if (includesAny(["gaze", "algodão", "algodao", "curativo", "atadura"])) return "Curativos";
    if (includesAny(["fralda", "nan", "fórmula", "formula", "lenço umedecido", "lenco umedecido"])) return "Bebês";
  }

  if (normalizedType === "condominio") {
    if (includesAny(["pano de chão", "pano de chao", "pano", "flanela", "rodo", "vassoura", "detergente", "água sanitária", "agua sanitaria"])) return "Limpeza";
    if (includesAny(["papel toalha", "saco de lixo"])) return "Descartáveis e Embalagens";
    if (includesAny(["papel higiênico", "papel higienico"])) return "Higiene e Perfumaria";
  }

  if (normalizedType === "escolar") {
    if (includesAny(["lápis", "lapis", "caneta", "borracha", "apontador", "canetinha", "régua", "regua"])) return "Material de Escrita";
    if (includesAny(["fita durex", "durex", "cola", "papel sulfite", "sulfite", "tesoura", "luva descartável", "luva descartavel"])) return "Papelaria";
    if (includesAny(["caderno"])) return "Cadernos";
  }

  return null;
}

function getKeywordCategoryForItem(type, item) {
  const normalizedType = normalizeListTypeIdForRules(type);
  const rules = getListTypeRules(normalizedType);
  const text = normalizeTextForCategory([
    item?.name,
    item?.detail,
    item?.marca,
    item?.tipo,
    item?.embalagem,
    item?.peso,
    item?.volume,
  ].filter(Boolean).join(" "));

  if (!text) return null;

  const directCategory = getDirectCategoryOverride(normalizedType, item);
  if (directCategory && categoryExistsInConfig(normalizedType, directCategory)) {
    return directCategory;
  }

  // Regras locais de alta prioridade por tipo de lista.
  const strongRules = {
    mercado: {
      "Carnes e Aves": [
        "carne", "carne moi", "carne moida", "coxao", "coxao mole", "colchao mole", "colchão mole",
        "picanha", "linguica", "frango", "coxinha da asa", "costela", "figado", "bucho"
      ],
      "Frios e Laticínios": [
        "leite", "manteiga", "mateiga", "margarina", "queijo", "presunto", "iogurte", "requeijao", "ovo", "ovos"
      ],
      "Hortifruti": [
        "batata", "tomate", "cebola", "alface", "banana", "maca", "maça", "laranja", "cenoura", "mamao"
      ],
      "Limpeza": [
        "detergente", "sabao", "desinfetante", "agua sanitaria", "alcool", "pano", "bucha", "esponja"
      ],
      "Mercearia": [
        "arroz", "feijao", "macarrao", "sal", "acucar", "oleo", "farinha", "cafe"
      ]
    },

    festa: {
      "Bebidas": [
        "cerveja", "heineken", "skol", "brahma", "antarctica", "refrigerante", "coca", "guarana", "agua", "água", "suco", "energetico", "energético"
      ],
      "Carnes e Aves": [
        "picanha", "carne", "linguica", "frango", "coxinha da asa", "costela", "asa"
      ],
      "Descartáveis e Embalagens": [
        "copo", "prato", "talher", "garfo", "faca", "colher", "guardanapo", "descartavel", "toalha"
      ],
      "Gelo e Apoio": [
        "gelo", "gelo 12kg", "carvao", "carvão", "carvao 12kg", "carvão 12kg", "fosforo", "fósforo", "acendedor"
      ]
    },

    construcao: {
      "Materiais Básicos": [
        "cimento", "cimento 50kg", "areia", "brita", "pedra brita", "argamassa", "rejunte",
        "massa corrida", "cal", "gesso"
      ],
      "Acabamento": [
        "piso", "porcelanato", "azulejo", "rodape", "ceramica", "revestimento"
      ],
      "Ferragens": [
        "ferro", "vergalhao", "prego", "parafuso", "barra", "arame", "dobradica"
      ],
      "Tintas e Pintura": [
        "tinta", "rolo", "pincel", "lixa", "selador", "massa acrilica"
      ],
      "Hidráulica": [
        "cano", "tubo pvc", "joelho", "conexao", "registro", "torneira"
      ],
      "Elétrica": [
        "fio", "cabo", "tomada", "interruptor", "disjuntor", "conduite"
      ]
    },

    eletrico: {
      "Fios e Cabos": [
        "fio", "cabo", "1,5mm", "2,5mm", "4mm", "6mm"
      ],
      "Disjuntores e Proteção": [
        "disjuntor", "dr", "dps", "bipolar", "monopolar"
      ],
      "Conectores": [
        "conector", "barra de aterramento", "aterramento", "haste", "borne"
      ],
      "Tomadas e Interruptores": [
        "tomada", "interruptor", "espelho"
      ],
      "Iluminação": [
        "lampada", "luminaria", "spot", "refletor", "bocal"
      ],
      "Conduítes e Eletrodutos": [
        "conduite", "eletroduto", "canaleta"
      ],
      "Ferramentas": [
        "alicate", "chave teste", "multimetro", "fita isolante"
      ]
    },

    escolar: {
      "Material de Escrita": [
        "lapis", "caneta", "borracha", "apontador", "canetinha", "lapis de cor", "regua", "marca texto"
      ],
      "Papelaria": [
        "papel", "sulfite", "fita", "durex", "cola", "tesoura", "luva descartavel"
      ],
      "Cadernos": [
        "caderno"
      ],
      "Artes": [
        "giz", "tinta guache", "pincel", "cartolina", "eva"
      ]
    },

    farmacia: {
      "Medicamentos": [
        "dipirona", "histamin", "donaren", "torsilax", "paracetamol", "ibuprofeno", "remedio", "medicamento"
      ],
      "Curativos": [
        "gaze", "algodao", "curativo", "esparadrapo", "micropore", "atadura"
      ],
      "Bebês": [
        "fralda", "lenco umedecido", "nan", "formula", "formula nan", "mamadeira", "chupeta"
      ],
      "Higiene Pessoal": [
        "sabonete", "shampoo", "condicionador", "creme dental", "escova"
      ]
    },

    condominio: {
      "Limpeza": [
        "pano", "pano de chao", "flanela", "rodo", "vassoura", "agua sanitaria", "detergente",
        "desinfetante", "sabao", "luva", "balde"
      ],
      "Descartáveis e Embalagens": [
        "papel toalha", "saco de lixo", "copo descartavel", "guardanapo"
      ],
      "Higiene e Perfumaria": [
        "papel higienico", "sabonete", "alcool gel"
      ],
      "Elétrica": [
        "lampada", "fio", "tomada", "fita isolante"
      ]
    }
  };

  const typeRules = strongRules[normalizedType] || {};

  for (const [category, keywords] of Object.entries(typeRules)) {
    if (!categoryExistsInConfig(normalizedType, category)) continue;
    if ((keywords || []).some((keyword) => text.includes(normalizeTextForCategory(keyword)))) {
      return category;
    }
  }

  // Regras importadas do arquivo listTypeRules.js.
  if (rules?.keywords && typeof rules.keywords === "object") {
    for (const [category, keywords] of Object.entries(rules.keywords)) {
      if (!categoryExistsInConfig(normalizedType, category)) continue;
      if ((keywords || []).some((keyword) => text.includes(normalizeTextForCategory(keyword)))) {
        return category;
      }
    }
  }

  return null;
}

function isInvalidCategoryForTypeAdvanced(type, categoryName) {
  const normalizedType = normalizeListTypeIdForRules(type);
  const plain = normalizePlainText(categoryName);
  const rules = getListTypeRules(normalizedType);
  const invalidByRules = Array.isArray(rules?.invalidCategories)
    ? rules.invalidCategories.some((c) => normalizePlainText(c) === plain)
    : false;

  const cfg = getListTypeConfig(normalizedType);
  const allowed = Array.isArray(cfg?.categories) ? cfg.categories : [];

  // Para listas técnicas, qualquer categoria fora da configuração do tipo é inválida.
  const strictTypes = ["festa", "construcao", "eletrico", "escolar", "farmacia", "condominio"];
  const outsideAllowed = strictTypes.includes(normalizedType)
    ? !allowed.some((c) => normalizePlainText(c) === plain)
    : false;

  return invalidByRules || outsideAllowed;
}

function postProcessOrganizedCategories(categories, type = "mercado") {
  const normalizedType = normalizeListTypeIdForRules(type || "mercado");
  const cfg = getListTypeConfig(normalizedType);
  const allowedCategories = Array.isArray(cfg?.categories) && cfg.categories.length
    ? cfg.categories
    : ["Outros"];

  const buckets = new Map();

  const getCanonicalAllowedCategory = (categoryName) => {
    const found = allowedCategories.find(
      (cat) => normalizePlainText(cat) === normalizePlainText(categoryName)
    );
    return found || null;
  };

  const fallbackCategory =
    getCanonicalAllowedCategory("Outros") ||
    allowedCategories[allowedCategories.length - 1] ||
    "Outros";

  const hasAllowedCategory = (categoryName) => Boolean(getCanonicalAllowedCategory(categoryName));

  const inferFinalCategoryByItem = (item) => {
    const text = normalizeTextForCategory([
      item?.name,
      item?.detail,
      item?.marca,
      item?.tipo,
      item?.embalagem,
      item?.peso,
      item?.volume,
    ].filter(Boolean).join(" "));

    const has = (words) => words.some((word) => text.includes(normalizeTextForCategory(word)));
    const pick = (categoryName) => hasAllowedCategory(categoryName) ? categoryName : null;

    // Eventos
    if (normalizedType === "festa" || hasAllowedCategory("Gelo e Apoio")) {
      if (has(["cerveja", "heineken", "skol", "brahma", "antarctica", "refrigerante", "coca", "guarana", "água", "agua", "suco", "energético", "energetico"])) {
        return pick("Bebidas");
      }
      if (has(["gelo", "gelo 5kg", "gelo 12kg", "carvão", "carvao", "carvão 12kg", "carvao 12kg", "fósforo", "fosforo", "acendedor"])) {
        return pick("Gelo e Apoio") || pick("Outros");
      }
      if (has(["copo", "prato", "guardanapo", "talher", "descartável", "descartavel"])) {
        return pick("Descartáveis e Embalagens");
      }
      if (has(["picanha", "linguiça", "linguica", "coxinha da asa", "carne", "frango", "costela"])) {
        return pick("Carnes e Aves");
      }
    }

    // Construção
    if (normalizedType === "construcao" || hasAllowedCategory("Materiais Básicos")) {
      if (has(["cimento", "areia", "brita", "pedra brita", "argamassa", "rejunte", "massa corrida", "cal", "gesso"])) {
        return pick("Materiais Básicos");
      }
      if (has(["piso", "porcelanato", "azulejo", "revestimento", "rodapé", "rodape"])) {
        return pick("Acabamento");
      }
      if (has(["ferro", "vergalhão", "vergalhao", "prego", "parafuso", "barra", "arame"])) {
        return pick("Ferragens");
      }
      if (has(["tinta", "rolo", "pincel", "lixa", "selador"])) {
        return pick("Tintas e Pintura");
      }
    }

    // Mercado
    if (normalizedType === "mercado") {
      // Massas/Mercearia — regra rígida para impedir classificação indevida como Hortifruti.
      if (has(["macarrão", "macarrao", "massa", "espaguete", "spaghetti", "parafuso", "penne", "talharim", "fusilli", "lasanha", "massa para lasanha", "massa de pastel"])) {
        return pick("Mercearia") || "Mercearia";
      }

      // Bebidas PRIMEIRO — antes de qualquer regra que possa capturar "álcool"
      if (has(["cerveja", "heineken", "skol", "brahma", "antarctica", "budweiser", "itaipava", "refrigerante", "coca", "guarana", "guaraná", "pepsi", "suco", "energetico", "energético", "monster", "redbull", "red bull"])) {
        return pick("Bebidas") || "Bebidas";
      }
      // Descartáveis
      if (has(["copo", "guardanapo", "talher", "prato descartavel", "prato descartável", "papel toalha", "papel aluminio", "papel alumínio", "papel filme", "saco freezer"])) {
        return pick("Descartáveis e Embalagens") || "Descartáveis e Embalagens";
      }
      if (has(["manteiga", "mateiga", "margarina", "leite", "queijo", "presunto", "iogurte", "ovo"])) {
        return pick("Frios e Laticínios");
      }
      if (has(["carne moída", "carne moida", "carne moi", "coxão mole", "coxao mole", "colchão mole", "colchao mole", "picanha", "linguiça", "linguica", "frango"])) {
        return pick("Carnes e Aves");
      }
    }

    // Farmácia
    if (normalizedType === "farmacia") {
      if (has(["donaren", "histamin", "torsilax", "dipirona", "paracetamol", "ibuprofeno", "amoxicilina", "clavulanato", "amoxiclav", "atak", "azitromicina", "cefalexina", "nimesulida", "dexametasona", "prednisona", "omeprazol", "losartana", "enalapril", "metformina", "sinvastatina", "atorvastatina", "clonazepam", "rivotril", "ritalina", "fluoxetina", "sertralina", "antibiotico", "antiinflamatorio", "vitamina", "suplemento", "xarope", "suspensao", "suspensão", "comprimido", "capsula", "cápsula", "injetavel", "injetável", "pomada", "colirio", "colírio"])) return pick("Medicamentos");
      if (has(["gaze", "algodão", "algodao", "curativo", "atadura"])) return pick("Curativos");
      if (has(["fralda", "nan", "fórmula", "formula", "lenço umedecido", "lenco umedecido"])) return pick("Bebês");
    }

    return null;
  };

  const addItemToCategory = (categoryName, item) => {
    const canonical = getCanonicalAllowedCategory(categoryName) || fallbackCategory;
    const current = buckets.get(canonical) || { name: canonical, items: [] };
    current.items.push(normalizeListItem(item));
    buckets.set(canonical, current);
  };

  const flatItems = [];

  (Array.isArray(categories) ? categories : []).forEach((cat) => {
    const originalCategory = cat?.name || fallbackCategory;
    const items = Array.isArray(cat?.items) ? cat.items : [];

    items.forEach((rawItem) => {
      const item = normalizeListItem(rawItem);
      if (!item?.name || isQuantityOnlyItemName(item.name)) return;
      flatItems.push({ item, originalCategory });
    });
  });

  flatItems.forEach(({ item, originalCategory }) => {
    const hardCategory = inferFinalCategoryByItem(item);
    const directCategory = getDirectCategoryOverride(normalizedType, item);
    const keywordCategory = getKeywordCategoryForItem(normalizedType, item);
    const originalAllowed = getCanonicalAllowedCategory(originalCategory);

    // hardCategory e directCategory são overrides rígidos — usados diretamente mesmo
    // que a categoria não esteja em allowedCategories (ex: "Bebidas" em listTypeConfigs).
    // Sem isso, cerveja/heineken classificada em Limpeza pela IA nunca era corrigida.
    const finalCategory =
      hardCategory ||
      directCategory ||
      getCanonicalAllowedCategory(keywordCategory) ||
      (!isInvalidCategoryForTypeAdvanced(normalizedType, originalCategory) ? originalAllowed : null) ||
      fallbackCategory;

    addItemToCategory(finalCategory, item);
  });

  const result = allowedCategories
    .map((categoryName) => buckets.get(categoryName))
    .filter(Boolean)
    .map((cat) => ({
      ...cat,
      items: (Array.isArray(cat.items) ? cat.items : [])
        .filter((item) => item?.name)
        .sort((a, b) =>
          normalizePlainText(a.name).localeCompare(normalizePlainText(b.name), "pt-BR")
        ),
    }))
    .filter((cat) => cat.items.length > 0);

  return result.length ? result : sanitizeCategories(categories);
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
      const name = smartNormalizeProductName(item?.name || item?.nome || "");
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
  if (has("alcool", "álcool", "lustra movel", "lustra móvel", "brilho aluminio", "brilho alumínio", "limpa aluminio", "limpa alumínio", "bucho limpeza", "sapolio", "sapólio", "veja", "desengordurante", "limpa vidro", "limpa vidros", "bombril", "palha de aço", "palha de aco", "coala", "omo", "lava roupa", "lava roupas", "sabão em pó", "sabao em po", "sabão líquido", "sabao liquido", "detergente", "desinfetante", "amaciante", "água sanitária", "agua sanitaria", "limpador", "multiuso", "alvejante", "cloro", "esponja", "vassoura", "rodo", "saco de lixo")) return "Limpeza";
  if (has("pasta de dente", "creme dental", "sabonete", "shampoo", "condicionador", "desodorante", "escova de dente", "fio dental", "papel higiênico", "papel higienico", "absorvente", "barbeador", "aparelho de barbear")) return "Higiene e Perfumaria";


  // Refinamento forte de classificação: itens comuns não devem cair em "Outros".
  // Essas regras vêm antes das regras genéricas e corrigem falhas recorrentes da IA.
  if (hasWord("abobora", "abóbora", "abobrinha", "rucula", "rúcula", "caqui", "flor", "flor bambu", "couve", "hortela", "hortelã", "coentro", "agrião", "agriao", "quiabo", "jiló", "jilo", "vagem", "inhame", "cará", "cara")) return "Hortifruti";
  if (hasWord("coxao mole", "coxão mole", "coxao duro", "coxão duro", "figado", "fígado", "bucho", "miudo", "miúdo", "musculo", "músculo", "acém", "acem", "cupim", "contra file", "contra filé", "file mignon", "filé mignon", "paleta", "lagarto")) return "Carnes e Aves";
  if (hasWord("alcool", "álcool", "lustra movel", "lustra móvel", "brilho aluminio", "brilho alumínio", "limpa aluminio", "limpa alumínio", "sapolio", "sapólio", "veja", "desengordurante", "limpa vidro", "limpa vidros", "limpa piso", "limpa pisos", "desodorizador", "odorizador", "aromatizador", "borrifador", "bucha limpeza")) return "Limpeza";
  if (hasWord("papel aluminio", "papel alumínio", "brilho aluminio", "brilho alumínio", "filme pvc", "papel manteiga", "saco zip", "saco ziploc", "embalagem aluminio", "embalagem alumínio")) return "Descartáveis e Embalagens";
  if (hasWord("amendoim", "castanha", "castanha de caju", "castanha do para", "castanha-do-pará", "nozes", "pistache", "bombom", "bala", "chiclete", "doce", "paçoca", "pacoca", "barra de cereal")) return "Snacks e Doces";
  if (hasWord("lapis de cor", "lápis de cor", "giz de cera", "canetinha", "hidrocor", "cola escolar", "tesoura escolar", "regua", "régua", "estojo", "cartolina", "eva", "papel sulfite")) return "Material de Escrita";


  if (hasWord("bombom", "bom bom", "bombon", "bala", "chiclete", "paçoca", "pacoca", "doce")) return "Snacks e Doces";
  if (hasWord("lapis de cor", "lápis de cor", "lapiz de cor", "lapi de cor", "canetinha", "giz de cera", "hidrocor")) return "Material de Escrita";
  if (hasWord("lustra moveis", "lustra móveis", "lustra movel", "lustra móvel", "lustra-móveis", "lustra-moveis", "polidor de moveis", "polidor de móveis")) return "Limpeza";
  if (hasWord("pano de prato", "pano prato", "flanela", "pano multiuso", "pano de limpeza", "perfex")) return "Limpeza";

  const rules = [
    { cat: "Mercearia", keys: ["arroz","feijao","feijão","macarrao","macarrão","massa","farinha","acucar","açúcar","sal","oleo","óleo","azeite","vinagre","milho","ervilha","atum","sardinha","fuba","fubá","maionese","ketchup","mostarda","aveia","granola","cereal matinal","leite condensado","creme de leite"] },
    { cat: "Padaria e Matinais", keys: ["pao","pão","bisnaguinha","torrada","bolo","cereal","granola","aveia"] },
    { cat: "Cafés e Chás", keys: ["cafe","café","cha","chá","achocolatado","nescau","toddy"] },
    { cat: "Frios e Laticínios", keys: ["ovo","ovos","leite","queijo","iogurte","manteiga","margarina","requeijao","requeijão","presunto","mortadela","salame","peito de peru"] },
    { cat: "Carnes e Aves", keys: ["carne","coxao mole","coxão mole","coxao duro","coxão duro","figado","fígado","bucho","miudo","miúdo","musculo","músculo","acem","acém","cupim","paleta","lagarto","frango","coxinha da asa","asa de frango","peixe","linguica","linguiça","picanha","costela","bife","file","filé","patinho","alcatra","maminha","fraldinha","salsicha","hamburguer","hambúrguer","bacon"] },
    { cat: "Bebidas", keys: ["cerveja","heineken","skol","brahma","refrigerante","agua","água","suco","energetico","energético","coca","guarana","guaraná","agua de coco","água de coco"] },
    { cat: "Cadernos", keys: ["caderno","agenda","fichario","fichário"] },
    { cat: "Material de Escrita", keys: ["lapis de cor","lápis de cor","lapis","lápis","canetinha","hidrocor","giz de cera","cola escolar","tesoura escolar","regua","régua","caneta","borracha","apontador","marca texto","marca-texto","corretivo","grafite","lapiseira"] },
    { cat: "Medicamentos", keys: ["remedio","remédio","medicamento","dipirona","paracetamol","ibuprofeno","amoxicilina","clavulanato","amoxiclav","atak clav","azitromicina","cefalexina","nimesulida","dexametasona","prednisona","omeprazol","losartana","enalapril","metformina","sinvastatina","atorvastatina","clonazepam","rivotril","ritalina","fluoxetina","sertralina","antibiotico","antiinflamatorio","vitamina","suplemento","xarope","suspensao","suspensão","comprimido","capsula","cápsula","injetavel","injetável","pomada","colirio","colírio","solucao oral","solução oral"] },
    { cat: "Hidráulica", keys: ["cano","tubo","conexao","conexão","registro","torneira","chuveiro","ralo","sifao","sifão"] },
    { cat: "Ferramentas", keys: ["martelo","chave de fenda","alicate","furadeira","parafusadeira"] },
    { cat: "Ferragens", keys: ["prego","parafuso","bucha","porca","arruela"] },
  ];
  for (const rule of rules) {
    if (rule.keys.some(k => n.includes(normalizeTextForCategory(k)))) return rule.cat;
  }

  if (hasWord("abobora","abóbora","rucula","rúcula","caqui","flor","flor bambu","mamao","mamão","manga","pera","pêra","maca","maçã","banana","laranja","limao","limão","uva","melão","melao","abacaxi","abacate","melancia","morango","kiwi","goiaba","maracuja","maracujá","tomate","alface","cebola","alho","batata","cenoura","mandioca","aipim","macaxeira","cheiro verde","cheiro-verde","salsinha","cebolinha","chuchu","brocolis","brócolis","abobrinha","beterraba","pepino","repolho","couve","couve flor","couve-flor","berinjela","pimentao","pimentão","verdura","legume","fruta")) return "Hortifruti";
  return "";
}


function inferPreferredCategoryForItemByType(item, type = "mercado") {
  const normalizedType = String(type || "mercado");
  const n = normalizeTextForCategory([item?.name, item?.detail, item?.marca, item?.tipo, item?.embalagem].filter(Boolean).join(" "));
  const has = (...keys) => keys.some(k => n.includes(normalizeTextForCategory(k)));
  const hasWord = (...keys) => keys.some((k) => {
    const escaped = normalizeTextForCategory(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(n);
  });

  if (normalizedType === "construcao") {
    if (has("cimento", "areia", "brita", "tijolo", "bloco", "cal", "argamassa", "rejunte", "massa corrida", "gesso")) return "Materiais Básicos";
    if (has("piso", "porcelanato", "azulejo", "ceramica", "cerâmica", "rodape", "rodapé", "soleira", "revestimento")) return "Acabamento";
    if (has("tinta", "selador", "verniz", "rolo de pintura", "pincel", "bandeja de pintura", "massa acrilica", "massa acrílica")) return "Tintas e Pintura";
    if (has("cano", "tubo", "pvc", "joelho", "luva", "registro", "torneira", "sifao", "sifão", "ralo")) return "Hidráulica";
    if (has("prego", "parafuso", "bucha", "porca", "arruela", "dobradica", "dobradiça", "fechadura")) return "Ferragens";
    if (has("martelo", "alicate", "trena", "nivel", "nível", "furadeira", "parafusadeira", "serra", "desempenadeira", "colher de pedreiro")) return "Ferramentas";
    return "Outros";
  }

  if (normalizedType === "eletrico") {
    if (has("fio", "cabo", "flexivel", "flexível", "bitola", "2,5", "4mm", "6mm")) return "Fios e Cabos";
    if (has("tomada", "interruptor", "placa", "espelho")) return "Tomadas e Interruptores";
    if (has("disjuntor", "dr", "dps", "quadro de distribuição", "quadro distribuicao", "barramento")) return "Disjuntores e Proteção";
    if (has("lampada", "lâmpada", "luminaria", "luminária", "bocal", "spot", "refletor")) return "Iluminação";
    if (has("barra de aterramento", "aterramento", "conector", "conectores")) return "Conectores";
    if (has("conduite", "conduíte", "eletroduto", "canaleta", "caixa de passagem", "caixa 4x2", "caixa 4x4")) return "Conduítes e Eletrodutos";
    if (has("alicate", "chave teste", "multimetro", "multímetro", "fita isolante")) return "Ferramentas";
    return "Outros";
  }

  if (normalizedType === "escolar") {
    if (has("caderno", "agenda", "fichario", "fichário")) return "Cadernos";
    if (has("lapis", "lápis", "caneta", "borracha", "apontador", "lapiseira", "grafite", "marca texto", "marca-texto", "regua", "régua", "canetinha", "lapis de cor", "lápis de cor")) return "Material de Escrita";
    if (has("cola", "tesoura", "tinta guache", "pincel", "cartolina", "eva", "giz de cera")) return "Artes";
    if (has("mochila", "estojo", "lancheira")) return "Mochilas e Estojos";
    if (has("uniforme", "camiseta", "calça", "bermuda", "meia", "tenis", "tênis")) return "Uniformes";
    if (has("papel sulfite", "sulfite", "papel almaço", "papel almaco", "folha")) return "Cadernos";
    return "Papelaria";
  }

  if (normalizedType === "farmacia") {
    if (has("dipirona", "paracetamol", "ibuprofeno", "donaren", "histamin", "torsilax", "xarope", "antialergico", "antialérgico", "remedio", "remédio", "medicamento", "amoxicilina", "clavulanato", "amoxiclav", "atak", "azitromicina", "cefalexina", "nimesulida", "dexametasona", "prednisona", "omeprazol", "losartana", "enalapril", "metformina", "sinvastatina", "atorvastatina", "clonazepam", "rivotril", "ritalina", "fluoxetina", "sertralina", "antibiotico", "antiinflamatorio", "comprimido", "capsula", "cápsula", "suspensao", "suspensão", "injetavel", "injetável", "pomada", "colirio", "colírio")) return "Medicamentos";
    if (has("fralda", "lenço umedecido", "lenco umedecido", "pomada", "mamadeira", "chupeta", "nan", "fórmula", "formula")) return "Bebês";
    if (has("curativo", "algodão", "algodao", "gaze", "esparadrapo", "soro fisiológico", "soro fisiologico", "alcool 70", "álcool 70")) return "Curativos";
    if (has("sabonete", "shampoo", "condicionador", "escova", "creme dental", "fio dental", "desodorante")) return "Higiene Pessoal";
    if (has("protetor solar", "repelente", "hidratante", "pomada dermatologica", "pomada dermatológica")) return "Dermocosméticos";
    if (has("vitamina", "suplemento", "whey", "colageno", "colágeno")) return "Suplementos";
    return "Outros";
  }

  if (normalizedType === "festa") {
    if (has("carne", "frango", "linguica", "linguiça", "pao de alho", "pão de alho", "coxinha da asa", "asa")) return "Carnes e Aves";
    if (has("agua", "água", "refrigerante", "suco", "cerveja", "energetico", "energético")) return "Bebidas";
    if (has("copo", "prato", "talher", "guardanapo", "toalha de mesa", "descartavel", "descartável")) return "Descartáveis e Embalagens";
    if (has("balao", "balão", "decoracao", "decoração", "vela", "faixa")) return "Decoração";
    if (has("gelo", "carvão", "carvao", "fosforo", "fósforo")) return "Gelo e Apoio";
    if (has("bolo", "doce", "salgado", "salgadinho")) return "Outros";
    return "Outros";
  }

  if (normalizedType === "condominio") {
    const generic = inferPreferredCategoryForItem(item);
    return generic || "Outros";
  }

  // Mercado: regras explícitas ANTES do fallback genérico
  // Sem isso, isAllowedCategoryForType filtra "Bebidas" se não estiver em listTypeConfigs
  if (normalizedType === "mercado") {
    // Massas/Mercearia — regra rígida para impedir classificação indevida como Hortifruti.
    if (has("macarrão", "macarrao", "massa", "espaguete", "spaghetti", "parafuso", "penne", "talharim", "fusilli", "lasanha", "massa para lasanha", "massa de pastel")) return "Mercearia";

    // Bebidas — DEVE vir antes de qualquer regra de Limpeza para evitar conflito com "álcool"
    if (has("cerveja", "heineken", "skol", "brahma", "antarctica", "budweiser", "itaipava",
            "crystal", "amstel", "corona", "stella", "becks", "refrigerante", "coca cola",
            "pepsi", "guarana", "guaraná", "suco", "energetico", "energético", "monster",
            "redbull", "red bull")) return "Bebidas";
    // Descartáveis
    if (has("copo", "guardanapo", "talher", "prato descartavel", "prato descartável",
            "papel toalha", "papel aluminio", "papel alumínio", "papel filme",
            "saco freezer", "saco plastico", "saco plástico")) return "Descartáveis e Embalagens";
    // Carnes — colchão mole = coxão mole (erro de digitação)
    if (has("carne", "frango", "picanha", "linguiça", "linguica", "coxao mole", "coxão mole",
            "colchao mole", "colchão mole", "costela", "filé", "file", "salsicha",
            "hamburguer", "hambúrguer", "bacon", "peixe")) return "Carnes e Aves";
    // Frios
    if (has("leite", "queijo", "manteiga", "margarina", "iogurte", "requeijao", "requeijão",
            "presunto", "mortadela", "ovo", "ovos", "creme de leite")) return "Frios e Laticínios";
    // Hortifruti
    if (has("alface", "tomate", "cebola", "alho", "batata", "cenoura", "banana", "maca", "maçã",
            "laranja", "limao", "limão", "manga", "abacaxi", "uva", "pera", "pêra",
            "melancia", "abacate", "mamao", "mamão", "abobrinha", "beterraba", "pepino",
            "repolho", "couve", "berinjela", "mandioca")) return "Hortifruti";
    // Limpeza
    if (has("detergente", "sabão", "sabao", "desinfetante", "agua sanitaria", "água sanitária",
            "amaciante", "lava roupa", "omo", "coala", "bombril", "esponja", "vassoura",
            "rodo", "balde", "pano de chao", "pano de chão")) return "Limpeza";
    // Mercearia
    if (has("arroz", "feijao", "feijão", "macarrao", "macarrão", "farinha", "acucar", "açúcar",
            "sal", "oleo", "óleo", "azeite", "vinagre", "molho", "extrato", "milho",
            "atum", "sardinha", "aveia", "granola")) return "Mercearia";
    // Higiene
    if (has("shampoo", "sabonete", "condicionador", "desodorante", "creme dental",
            "escova", "fio dental", "absorvente", "papel higienico", "papel higiênico")) return "Higiene e Perfumaria";
  }

  return inferPreferredCategoryForItem(item);
}


function normalizeCategoryAliasForType(categoryName, type = "mercado", item = null) {
  const category = String(categoryName || "").trim();
  const normalizedType = String(type || "mercado");

  if (normalizedType === "construcao") {
    if (normalizePlainText(category) === normalizePlainText("Tintas")) return "Tintas e Pintura";
    if (normalizePlainText(category) === normalizePlainText("Elétrica")) return "Elétrica";
    return category;
  }

  if (normalizedType === "eletrico") {
    if (normalizePlainText(category) === normalizePlainText("Elétrica")) return "Outros";
    return category;
  }

  if (normalizedType === "escolar") {
    const plain = normalizePlainText(category);
    if (plain === normalizePlainText("Escrita")) return "Material de Escrita";
    if (plain === normalizePlainText("Cadernos e Papéis")) return "Cadernos";
    if (plain === normalizePlainText("Material de Escrita")) return "Material de Escrita";
    return category;
  }

  if (normalizedType === "farmacia") {
    const plain = normalizePlainText(category);
    if (plain === normalizePlainText("Bebê")) return "Bebês";
    if (plain === normalizePlainText("Bebes")) return "Bebês";
    return category;
  }

  if (normalizedType === "festa") {
    const itemText = normalizeTextForCategory([
      item?.name,
      item?.detail,
      item?.marca,
      item?.tipo,
      item?.embalagem,
    ].filter(Boolean).join(" "));
    if (normalizePlainText(category) === normalizePlainText("Alimentos")) {
      if (["gelo", "carvao", "carvão", "fosforo", "fósforo"].some((k) => itemText.includes(normalizeTextForCategory(k)))) {
        return "Gelo e Apoio";
      }
      if (["bolo", "doce", "salgado", "salgadinho"].some((k) => itemText.includes(normalizeTextForCategory(k)))) {
        return "Outros";
      }
    }
    return category;
  }

  return category;
}

function inferCategoryFromListTypeRules(item, type = "mercado") {
  const rules = getListTypeRules(type);
  if (!rules?.keywords) return null;

  const itemText = normalizeTextForCategory([
    item?.name,
    item?.detail,
    item?.marca,
    item?.tipo,
    item?.embalagem,
  ].filter(Boolean).join(" "));

  for (const [categoryName, keywords] of Object.entries(rules.keywords || {})) {
    if (!Array.isArray(keywords)) continue;
    const matched = keywords.some((keyword) => {
      const normalizedKeyword = normalizeTextForCategory(keyword);
      if (!normalizedKeyword) return false;
      return itemText.includes(normalizedKeyword);
    });
    if (matched) return categoryName;
  }

  return null;
}

function isInvalidCategoryForType(categoryName, type = "mercado") {
  const rules = getListTypeRules(type);
  if (!rules?.invalidCategories) return false;
  const plain = normalizePlainText(categoryName || "");
  return rules.invalidCategories.some((cat) => normalizePlainText(cat) === plain);
}

function isAllowedCategoryForType(categoryName, type = "mercado") {
  // Categorias universais de supermercado — aceitas mesmo que não estejam em listTypeConfigs
  const UNIVERSAL_MERCADO_CATEGORIES = [
    "bebidas", "cervejas", "bebidas alcoolicas", "bebidas alcolicas",
    "descartaveis e embalagens", "descartaveis", "embalagens",
    "carnes e aves", "frios e laticinios", "frios e laticınios",
    "hortifruti", "mercearia", "limpeza", "higiene e perfumaria",
    "snacks e doces", "temperos e condimentos", "congelados",
    "cafes e chas", "padaria e matinais", "utilidades domesticas",
    "itens extras", "outros",
  ];
  const plain = normalizePlainText(categoryName || "");
  if (normalizePlainText(type) === "mercado" && UNIVERSAL_MERCADO_CATEGORIES.includes(plain)) return true;

  const config = getListTypeConfig(type);
  const allowed = Array.isArray(config?.categories) ? config.categories : [];
  if (!allowed.length) return true;
  return allowed.some((cat) => normalizePlainText(cat) === plain);
}

function pickSafeCategoryForType({ item, originalCategory, type = "mercado" }) {
  const normalizedType = String(type || "mercado");

  const ruleCategory = inferCategoryFromListTypeRules(item, normalizedType);
  if (ruleCategory) return normalizeCategoryAliasForType(ruleCategory, normalizedType, item);

  const legacyCategory = inferPreferredCategoryForItemByType(item, normalizedType);
  const normalizedLegacy = normalizeCategoryAliasForType(legacyCategory, normalizedType, item);
  if (
    normalizedLegacy &&
    !isInvalidCategoryForType(normalizedLegacy, normalizedType) &&
    isAllowedCategoryForType(normalizedLegacy, normalizedType)
  ) {
    return normalizedLegacy;
  }

  const normalizedOriginal = normalizeCategoryAliasForType(originalCategory, normalizedType, item);
  if (
    normalizedOriginal &&
    !isInvalidCategoryForType(normalizedOriginal, normalizedType) &&
    isAllowedCategoryForType(normalizedOriginal, normalizedType)
  ) {
    return normalizedOriginal;
  }

  const config = getListTypeConfig(normalizedType);
  if (Array.isArray(config?.categories) && config.categories.some((cat) => normalizePlainText(cat) === normalizePlainText("Outros"))) {
    return "Outros";
  }

  return "Outros";
}

function enforceKnownCategoryRules(categories, type = "mercado") {
  const buckets = {};

  (Array.isArray(categories) ? categories : []).forEach((cat) => {
    (Array.isArray(cat.items) ? cat.items : []).forEach((item) => {
      if (isQuantityOnlyItemName(item.name)) return;

      const safeCategory = pickSafeCategoryForType({
        item,
        originalCategory: cat?.name || "Outros",
        type,
      });

      if (!buckets[safeCategory]) buckets[safeCategory] = [];
      buckets[safeCategory].push(item);
    });
  });

  return sanitizeCategories(
    Object.entries(buckets).map(([name, items]) => ({
      name,
      items,
    }))
  );
}


function getCategoryForExtraItem(item) {
  const preferred = inferPreferredCategoryForItem(item);
  if (preferred && normalizePlainText(preferred) !== normalizePlainText("Outros")) {
    return preferred;
  }
  return "Itens Extras";
}


function inferExtraPriceMode(item, categoryName = "") {
  const unit = normalizeUnitValue(item?.unit || "unidade");
  const category = normalizePlainText(categoryName);
  const name = normalizePlainText(item?.name || "");
  const isProduce =
    category.includes("hortifruti") ||
    ["abobora", "abobrinha", "rucula", "caqui", "mamao", "manga", "pera", "banana", "tomate", "alface", "cebola", "batata", "cenoura"].some((p) => name.includes(p));

  if (unit === "kg") return "perKg";
  if (unit === "litro" || unit === "L") return "perLiter";
  if (unit === "pacote") return "package";
  if (isProduce && unit === "unidade") return "perKg";
  return "unit";
}

function getExtraPriceInputLabel(item, categoryName = "") {
  const mode = inferExtraPriceMode(item, categoryName);
  if (mode === "perKg") return "Preço por kg";
  if (mode === "perLiter") return "Preço por litro";
  if (mode === "package") return "Preço por pacote";
  if (normalizeUnitValue(item?.unit) === "caixa") return "Preço por caixa";
  if (normalizeUnitValue(item?.unit) === "fardo") return "Preço por fardo";
  if (normalizeUnitValue(item?.unit) === "saco") return "Preço por saco";
  return "Preço por unidade";
}



function demoOrganize(items, type = "mercado") {
  // Categorias alinhadas ao Atacadão, com regras específicas antes das genéricas.
  // ATENÇÃO: ordem importa — cervejas/bebidas DEVEM vir antes de Limpeza
  // para evitar que "álcool" em Limpeza capture "cerveja" e "heineken".
  const map = [
    // ── BEBIDAS: prioridade máxima ────────────────────────────────────────────
    [["cerveja","heineken","skol","brahma","antarctica","budweiser","itaipava","crystal","amstel","corona","stella","becks","brahma duplo malte"],"Bebidas"],
    [["refrigerante","coca cola","coca-cola","pepsi","guaraná","guarana","sprite","fanta","schweppes","kuat","totem"],"Bebidas"],
    [["suco","nectar","néctar","del valle","tampico","maguary","sufresh","dafruta"],"Bebidas"],
    [["energetico","energético","monster","redbull","red bull","burn","vibe","baly","charge"],"Bebidas"],
    // ── DESCARTÁVEIS: antes de "Outros" ─────────────────────────────────────
    [["copo descartavel","copo descartável","copo","prato descartavel","prato descartável","guardanapo","talher descartavel","talher descartável","talher","papel toalha","papel aluminio","papel alumínio","papel filme","saco freezer","saco plastico","saco plástico","saco zip"],"Descartáveis e Embalagens"],
    // ── GELO E APOIO / CARVÃO ────────────────────────────────────────────────
    [["carvao","carvão","carvao 12kg","carvão 12kg","carvao vegetal","carvão vegetal","gelo","fosforo","fósforo","acendedor","isqueiro"],"Gelo e Apoio"],

    [["bombom","bom bom","bombon","bala","chiclete","paçoca","pacoca"],"Snacks e Doces"],
    [["lápis de cor","lapis de cor","lapi de cor","lapiz de cor","canetinha","giz de cera","hidrocor"],"Material de Escrita"],
    [["lustra-móveis","lustra moveis","lustra móveis","lustra movel","lustra móvel","polidor de móveis","polidor de moveis","pano de prato","pano prato","flanela","pano multiuso"],"Limpeza"],
    [["abóbora","abobora","rúcula","rucula","caqui","flor bambu","flor","hortelã","hortela","coentro","agrião","agriao","quiabo","jiló","jilo","vagem","inhame"],"Hortifruti"],
    [["coxão mole","coxao mole","coxão duro","coxao duro","fígado","figado","bucho","miúdo","miudo","músculo","musculo","acém","acem","cupim","paleta","lagarto"],"Carnes e Aves"],
    [["álcool","alcool","lustra móvel","lustra movel","brilho alumínio","brilho aluminio","limpa alumínio","limpa aluminio","sapólio","sapolio","veja","desengordurante","limpa vidro","limpa vidros"],"Limpeza"],
    [["amendoim","castanha","nozes","pistache","bombom","bala","chiclete","paçoca","pacoca"],"Snacks e Doces"],
    [["lápis de cor","lapis de cor","canetinha","hidrocor","giz de cera","cola escolar","tesoura escolar","régua","regua","cartolina","papel sulfite"],"Material de Escrita"],
    [["molho de tomate","extrato de tomate","polpa de tomate","tomate pelado"],"Mercearia"],
    [["bolacha","biscoito","cookie","oreo","chocolate","salgadinho","snack","chips","barra","pipoca"],"Snacks e Doces"],
    [["colorau","paprica","páprica","tempero","orégano","oregano","cominho","sazon"],"Temperos e Condimentos"],
    [["lenço umedecido","lenco umedecido","lenços umedecidos","lencos umedecidos","umedecido","umedecidos","umedecid","fralda","pomada bebê","pomada bebe"],"Bebês"],
    [["papel toalha","guardanapo","copo descartável","copo descartavel","prato descartável","prato descartavel","talher","papel alumínio","papel aluminio","papel filme","embalagem"],"Descartáveis e Embalagens"],
    [["pilha","bateria","fio","cabo","tomada","interruptor","disjuntor","lampada","lâmpada","extensao","extensão"],"Elétrica"],
    [["bombril","palha","coala","detergente","sabão","sabao","desinfetante","vassoura","esponja","limpador","água sanitária","agua sanitaria","amaciante","lava roupa","omo","multiuso","rodo","saco de lixo"],"Limpeza"],
    [["pasta de dente","creme dental","shampoo","sabonete","escova","fio dental","desodorante","condicionador","absorvente","papel higiênico","papel higienico"],"Higiene e Perfumaria"],
    [["arroz","feijão","feijao","macarrão","macarrao","farinha","açúcar","acucar","sal","azeite","óleo","oleo","vinagre","milho","linhaça","chia","atum","sardinha"],"Mercearia"],
    [["carne","coxao mole","coxão mole","coxao duro","coxão duro","figado","fígado","bucho","miudo","miúdo","musculo","músculo","acem","acém","cupim","paleta","lagarto","frango","coxinha da asa","asa de frango","peixe","linguiça","linguica","bacon","costela","picanha","bife","filé","file","salsicha","hambúrguer","hamburguer"],"Carnes e Aves"],
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
      const name = smartNormalizeProductName(item?.name || item?.nome || "");
      if (!name) return "";
      return `${qty} ${unit} ${name}`.trim();
    })
    .filter(Boolean)
    .join("\n");
}

// Renderiza a primeira página de um PDF como imagem JPEG via pdf.js
async function pdfFirstPageToJpeg(file) {
  return new Promise((resolve, reject) => {
    const load = () => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdfjsLib = window["pdfjs-dist/build/pdf"];
          if (!pdfjsLib) { reject(new Error("pdf.js não carregado")); return; }
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(viewport.width, 1600);
          canvas.height = Math.round(viewport.height * (canvas.width / viewport.width));
          const scaledViewport = page.getViewport({ scale: 2.0 * (canvas.width / viewport.width) });
          await page.render({ canvasContext: canvas.getContext("2d"), viewport: scaledViewport }).promise;
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error("Erro ao ler PDF"));
      reader.readAsArrayBuffer(file);
    };
    if (window["pdfjs-dist/build/pdf"]) { load(); return; }
    const existing = document.getElementById("tnl-pdfjs-script");
    if (existing) { existing.addEventListener("load", load); return; }
    const s = document.createElement("script");
    s.id = "tnl-pdfjs-script";
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = load;
    s.onerror = () => reject(new Error("Não foi possível carregar o leitor de PDF."));
    document.head.appendChild(s);
  });
}

async function compressImageFile(file, maxPx = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

const LIST_TYPE_OCR_CONTEXT = {
  farmacia: {
    role: "leitor de receitas médicas e listas de farmácia",
    example: '{"items":[{"name":"Amoxicilina 500mg","qty":1,"unit":"caixa"},{"name":"Dipirona 500mg","qty":1,"unit":"caixa"}]}',
    rules: [
      "- preserve o nome completo do medicamento incluindo dosagem (ex: 'Amoxicilina + Clavulanato 400mg');",
      "- unit deve ser caixa, frasco, tubo, cartela, ampola ou unidade;",
      "- ignore posologia, instruções de uso, nome do médico, CRM, data e dados do paciente.",
    ],
  },
  escolar: {
    role: "leitor de listas de material escolar",
    example: '{"items":[{"name":"Caderno espiral 200 folhas","qty":2,"unit":"unidade"},{"name":"Lápis de cor 12 cores","qty":1,"unit":"caixa"}]}',
    rules: [
      "- preserve especificações como número de folhas, cores, tamanho;",
      "- unit deve ser unidade, caixa, pacote, kit ou par;",
      "- ignore nome da escola, série, ano letivo e professor.",
    ],
  },
  construcao: {
    role: "leitor de listas de materiais de construção",
    example: '{"items":[{"name":"Cimento CP-II 50kg","qty":10,"unit":"saco"},{"name":"Tijolo 6 furos","qty":500,"unit":"unidade"}]}',
    rules: [
      "- preserve especificações técnicas;",
      "- unit deve ser saco, unidade, metro, m², barra, rolo, lata, caixa ou kg.",
    ],
  },
  eletrico: {
    role: "leitor de listas de materiais elétricos",
    example: '{"items":[{"name":"Fio 2,5mm","qty":50,"unit":"metro"},{"name":"Disjuntor 20A","qty":2,"unit":"unidade"}]}',
    rules: [
      "- preserve especificações técnicas como bitola, amperagem, voltagem;",
      "- unit deve ser metro, rolo, unidade, caixa ou kit.",
    ],
  },
  mercado: {
    role: "leitor de listas de compras de supermercado",
    example: '{"items":[{"name":"Arroz","qty":2,"unit":"pacote"},{"name":"Frango","qty":1,"unit":"kg"}]}',
    rules: [
      "- unit deve ser unidade, pacote, kg, g, L, ml, caixa, lata, garrafa, fardo, bandeja ou pote.",
    ],
  },
};

async function readShoppingListFromImage(file, listType = "mercado") {
  const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
  let dataUrl;
  if (isPdf) {
    try { dataUrl = await pdfFirstPageToJpeg(file); }
    catch { throw new Error("Não foi possível converter o PDF. Tente fotografar a lista diretamente."); }
  } else {
    dataUrl = await compressImageFile(file);
  }
  if (!dataUrl) throw new Error("Não foi possível ler o arquivo.");
  const [meta, base64] = dataUrl.split(",");
  const mediaType = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const ctx = LIST_TYPE_OCR_CONTEXT[listType] || LIST_TYPE_OCR_CONTEXT.mercado;
  const prompt = [
    `Você é um ${ctx.role} em português do Brasil.`,
    "Leia o documento enviado, mesmo que esteja manuscrito, impresso ou digitado.",
    "Extraia apenas os itens da lista, ignorando cabeçalhos, rodapés, datas e informações administrativas.",
    "Corrija erros óbvios de leitura quando o contexto indicar o item correto.",
    "Retorne APENAS JSON válido, sem markdown, neste formato:",
    ctx.example,
    "Regras:",
    "- qty deve ser número;",
    ...ctx.rules,
    "- não invente itens que não estejam no documento.",
    "- se não conseguir identificar nenhum item, retorne {\"items\":[]}.",
  ].join("\n");
  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model: ANTHROPIC_MODEL_VISION, maxTokens: 1500, image: { mediaType, data: base64 } }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Erro na leitura (${res.status}): ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  const parsed = data?.json || extractJsonObject(data?.text || "");
  const items = Array.isArray(parsed?.items) ? parsed.items : [];
  if (!items.length) throw new Error("A IA não identificou itens no documento. Tente uma imagem mais nítida.");
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
    .filter((list) => list && Array.isArray(list.categories) && !list.isDeleted)
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
    .map((h) => {
      const listLookup =
        listOrderByKey.get(String(h.listId || "")) ||
        listOrderByKey.get(String(h.sharedId || "")) ||
        listOrderByKey.get(String(h.listName || ""));
      return {
        ...h,
        unitPrice: Number(h.unitPrice || h.totalPrice || 0),
        totalPrice: Number(h.totalPrice || h.unitPrice || 0),
        quantity: Number(h.quantity || 1),
        createdAt: h.createdAt || new Date().toISOString(),
        monthKey: h.monthKey || String(h.createdAt || new Date().toISOString()).slice(0, 7),
        statsListOrder: listLookup?.order || 0,
        statsListLabel: listLookup?.label || h.listName || "Lista",
        __isCurrentSavedListRecord: orderedListsForStats.length ? Boolean(listLookup) : true,
      };
    })
    // A tela de estatísticas deve refletir as listas salvas no app.
    // Registros órfãos de histórico local (ex.: cópias antigas, testes apagados) são ignorados.
    .filter((h) => h.__isCurrentSavedListRecord && h.itemKey && Number.isFinite(h.unitPrice) && h.unitPrice > 0);

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

  const allCategoriesForStats = Array.from(categoryListMap.entries())
    .map(([category, points]) => ({ category, total: points.reduce((sum, p) => sum + Number(p.value || 0), 0) }))
    .sort((a, b) => String(a.category || "").localeCompare(String(b.category || ""), "pt-BR"))
    .map((c) => c.category);

  const categorySeries = allCategoriesForStats.map((category) => {
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





function formatBRL(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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



function formatPantryDate(value) {
  try {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR") + " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}


function HelpIcon({ text = "" }) {
  return (
    <span
      title={text}
      onClick={(e)=>{ e.stopPropagation(); if (text) alert(text); }}
      style={{
        display:"inline-flex",
        alignItems:"center",
        justifyContent:"center",
        width:18,
        height:18,
        borderRadius:"50%",
        background:"#EEF2FF",
        color:"#5B21B6",
        fontSize:12,
        fontWeight:900,
        cursor:"pointer",
        border:"1px solid #C7D2FE",
        flexShrink:0
      }}
    >
      i
    </span>
  );
}

export default function App(){

  const TNL_USE_LOVABLE_PREVIEW = false;

  if (TNL_USE_LOVABLE_PREVIEW) {
    return <ShoppingListPreview />;
  }


  useEffect(() => {
    ensureMobileViewport();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return undefined;
    const vv = window.visualViewport;
    const updateKeyboardOffset = () => {
      try {
        const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.documentElement.style.setProperty("--tnl-keyboard-offset", `${Math.round(offset)}px`);
      } catch {}
    };
    updateKeyboardOffset();
    vv.addEventListener("resize", updateKeyboardOffset);
    vv.addEventListener("scroll", updateKeyboardOffset);
    return () => {
      vv.removeEventListener("resize", updateKeyboardOffset);
      vv.removeEventListener("scroll", updateKeyboardOffset);
      try { document.documentElement.style.removeProperty("--tnl-keyboard-offset"); } catch {}
    };
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
  const [confirmDeleteAction,setConfirmDeleteAction]=useState(null);
  const [showFinished,setShowFinished]=useState(false);
  const currentListRef=useRef(null);
  const toastTimer=useRef(null);
  const searchRef=useRef(null);
  const listRef=useRef(null);
  const tourItemRef=useRef(null);
  const swipeStartRef=useRef({x:0,y:0,t:0,active:false});
  const priceInputRef=useRef(null);

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
  const [pantryReviewDirty,setPantryReviewDirty]=useState(false);
  const [pantryReviewReadOnly,setPantryReviewReadOnly]=useState(false);
  const [showPantryComparisonDetails,setShowPantryComparisonDetails]=useState(false);
  const [currentInput,setCurrentInput]=useState("");
  const [editingListId,setEditingListId]=useState(null);
  const [editingDraftCopyId,setEditingDraftCopyId]=useState(null);

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
  const [tourItemRect,setTourItemRect]=useState(null);
  const [collapsedCats,setCollapsedCats]=useState({});

  // Item modal
  const [itemModal,setItemModal]=useState(null);
  const [mQty,setMQty]=useState(1);
  const [mQtyText,setMQtyText]=useState("1");
  const [mPriceText,setMPriceText]=useState("");
  const [mPriceMode,setMPriceMode]=useState("total");
  const [mWeightText,setMWeightText]=useState("");
  const [mEditName,setMEditName]=useState("");
  const [mUnit,setMUnit]=useState("unidade");
  const [mShowEditDetails,setMShowEditDetails]=useState(false);

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
  const userNameInputRef=useRef(userNameInput);
  useEffect(()=>{ userNameInputRef.current=userNameInput; },[userNameInput]);
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
  const [showInstallNotice,setShowInstallNotice]=useState(false);
  const [notifications,setNotifications]=useState(()=>loadStoredNotifications());
  const [showNotificationsScreen,setShowNotificationsScreen]=useState(false);
  const [showGuidedTour,setShowGuidedTour]=useState(false);
  const [guidedTourIndex,setGuidedTourIndex]=useState(0);
  const guidedTourStep = GUIDED_TOUR_STEPS[guidedTourIndex] || null;
  const currentScreenTourSteps = GUIDED_TOUR_STEPS.filter(step => step.screen === screen);
  const guidedTourLocalIndex = Math.max(0, currentScreenTourSteps.findIndex(step => step.id === guidedTourStep?.id));
  const guidedTourLocalTotal = Math.max(1, currentScreenTourSteps.length);
  const isTourStep = useCallback((id)=>Boolean(showGuidedTour && guidedTourStep?.id === id && guidedTourStep?.screen === screen),[showGuidedTour,guidedTourStep,screen]);

  const startGuidedTour = useCallback((screenName = screen) => {
    const targetScreen = screenName || "home";
    const firstIndex = GUIDED_TOUR_FIRST_STEP_BY_SCREEN[targetScreen] ?? 0;
    setGuidedTourIndex(firstIndex);
    setShowGuidedTour(true);
    registrarEvento("guided_tour_started", { screen: targetScreen, trigger: "manual_button" });
  }, [screen]);

  const showToast=useCallback((msg,duration=1000)=>{
    clearTimeout(toastTimer.current);
    setToast({show:true,msg});
    toastTimer.current=setTimeout(()=>setToast({show:false,msg:""}),duration);
  },[]);

  const hasValidLocalSession=useCallback(()=>{
    const name=String(getAppUserName() || "").trim();
    if(!name)return false;

    // Para abrir link compartilhado, não faz sentido pedir PIN novamente
    // se este aparelho já tem usuário salvo do app. O PIN continua sendo exigido
    // apenas no fluxo normal de entrada quando não há sessão/usuário conhecido.
    if(isPinSessionVerified(name))return true;

    const userId=String(getAppUserId() || "").trim();
    const deviceId=String(getAppDeviceId() || "").trim();
    const registered=localStorage.getItem(APP_USER_REGISTERED_KEY)==="1";

    return Boolean(name && (userId || deviceId || registered));
  },[]);

  const clearSharedUrlFromAddressBar=useCallback(()=>{
    try { window.history.replaceState({}, document.title, "/"); } catch {}
  },[]);




  // O tutorial guiado não inicia automaticamente e não muda de página sozinho.
  // Cada tela possui seu próprio guia rápido contextual.

  const finishGuidedTour = useCallback((mode = "done") => {
    setShowGuidedTour(false);
    registrarEvento(mode === "skip" ? "guided_tour_skipped" : "guided_tour_closed", { step: guidedTourStep?.id || "", screen });
  }, [guidedTourStep, screen]);

  const nextGuidedTourStep = useCallback(() => {
    const sameScreenSteps = GUIDED_TOUR_STEPS
      .map((step, index) => ({ step, index }))
      .filter(item => item.step.screen === screen);
    const currentPos = sameScreenSteps.findIndex(item => item.index === guidedTourIndex);
    const nextItem = sameScreenSteps[currentPos + 1];

    if (!nextItem) {
      finishGuidedTour("done");
      return;
    }

    const currentStep = GUIDED_TOUR_STEPS[guidedTourIndex];
    setGuidedTourIndex(nextItem.index);
    registrarEvento("guided_tour_next", { from_step: currentStep?.id || "", to_step: nextItem.step?.id || "", screen });
  }, [guidedTourIndex, screen, finishGuidedTour]);

  const prevGuidedTourStep = useCallback(() => {
    const sameScreenSteps = GUIDED_TOUR_STEPS
      .map((step, index) => ({ step, index }))
      .filter(item => item.step.screen === screen);
    const currentPos = sameScreenSteps.findIndex(item => item.index === guidedTourIndex);
    const prevItem = sameScreenSteps[Math.max(0, currentPos - 1)];
    if (prevItem) setGuidedTourIndex(prevItem.index);
  }, [guidedTourIndex, screen]);

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
    archiveFinishedListsBeforeHome();
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

  const isPantryFinishedByShareStatus = (pantry) => {
    const status = normalizePlainText(pantry?.sharedStatus || pantry?.status || "");
    return ["concluida", "concluída", "finalizada", "finalizado", "completed", "archived completed", "archived_completed"].includes(status);
  };

  const activePantry = pantryLists.find(p => p.status === "ativa" && !isPantryFinishedByShareStatus(p)) || null;
  const pantryShareStatus = (() => {
    if (!activePantry) return null;

    const receiverName =
      activePantry.importedByName ||
      activePantry.sharedWithName ||
      activePantry.usedByName ||
      "";

    const senderName =
      activePantry.receivedFromName ||
      activePantry.importedFrom ||
      activePantry.sharedOwner ||
      activePantry.remetente ||
      activePantry.ownerName ||
      "";

    if (activePantry.sharedStatus === "concluida" || activePantry.sharedStatus === "finalizada") {
      return receiverName ? `Finalizada por ${receiverName}` : "Finalizada pelo destinatário";
    }

    if (activePantry.sharedStatus === "utilizada_na_comparacao") {
      return receiverName ? `Comparada por ${receiverName}` : "Utilizada na comparação";
    }

    if (activePantry.sharedStatus === "importada") {
      return senderName ? `Recebida de ${senderName}` : "Recebida";
    }

    if (activePantry.sharedAt) {
      return receiverName ? `Compartilhada com ${receiverName}` : "Compartilhada";
    }

    return null;
  })();


  const archivePantryAsRecentList = useCallback((pantry, data = {}) => {
    if (!pantry) return;
    const now = new Date().toISOString();
    const finishedAt = data.finishedAt || data.finalizedAt || data.concludedAt || pantry.finishedAt || pantry.finalizedAt || pantry.concludedAt || now;
    const recentId = pantry.recentListId || `pantry-recent-${pantry.sharedId || pantry.id || Date.now()}`;
    const itemCount = pantry.itemCount || data.itemCount || countCategoryItems(pantry.categories || data.categories || []);

    const archivedPantryList = {
      id: recentId,
      name: "Itens em Casa",
      type: "pantry",
      listKind: "pantry_history",
      listType: "pantry",
      icon: "🏠",
      emoji: "🏠",
      listIcon: "🏠",
      displayIcon: "🏠",
      moduleIcon: "home",
      iconType: "home",
      categories: pantry.categories || data.categories || [],
      itemCount,
      budget: 0,
      createdAt: pantry.createdAt || data.createdAt || now,
      updatedAt: data.updatedAt || now,
      finishedAt,
      completedAt: data.completedAt || finishedAt,
      finalizedAt: data.finalizedAt || finishedAt,
      status: "completed",
      sharedStatus: "concluida",
      archivedStatus: "archived_completed",
      archivedFinished: true,
      finished: true,
      completed: true,
      isFinished: true,
      isPantryHistory: true,
      sharedId: pantry.sharedId || data.sharedId || null,
      originalSharedId: pantry.sourceSharedId || pantry.originalSharedId || data.originalSharedId || null,
      sourceSharedId: pantry.sourceSharedId || pantry.originalSharedId || data.sourceSharedId || null,
      ownerName: pantry.ownerName || data.ownerName || getAppUserName() || "Usuário",
      remetente: pantry.remetente || data.remetente || getAppUserName() || "Usuário",
      importedByName: data.importedByName || pantry.importedByName || null,
      importedAt: data.importedAt || pantry.importedAt || null,
      sharedWithName: data.importedByName || data.sharedWithName || pantry.sharedWithName || null,
      usedByName: data.usedByName || data.importedByName || pantry.usedByName || null,
      usedByListId: data.usedByListId || pantry.usedByListId || null,
      usedByListName: data.usedByListName || pantry.usedByListName || null,
      historyNote: data.usedByName
        ? `Finalizada após uso por ${data.usedByName}`
        : "Lista de Itens em Casa finalizada",
    };

    setLists((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const exists = current.some((item) => item?.id === recentId);
      const next = exists
        ? current.map((item) => item?.id === recentId ? { ...item, ...archivedPantryList } : item)
        : [archivedPantryList, ...current];
      const safe = mergeUniqueLists(next);
      try { localStorage.setItem("tnl_lists", JSON.stringify(safe)); } catch {}
      return safe;
    });
  }, []);

  useEffect(() => {
    syncNotificationsFromLists(lists);
  }, [lists, syncNotificationsFromLists]);

  useEffect(() => {
    if (!activePantry?.sharedId) return;
    let cancelled = false;

    const refreshOriginPantryStatus = async () => {
      try {
        const record = await getSharedListRecord(activePantry.sharedId);
        const data = record?.data || {};
        if (cancelled || !data?.sharedStatus) return;

        const nextStatus = data.sharedStatus === "finalizada" ? "concluida" : data.sharedStatus;
        const shouldConclude = nextStatus === "concluida";

        savePantryLists(pantryLists.map((p) => {
          if (p.id !== activePantry.id) return p;
          return {
            ...p,
            sharedStatus: nextStatus,
            importedByName: data.importedByName || p.importedByName || null,
            importedAt: data.importedAt || p.importedAt || null,
            sharedWithName: data.importedByName || data.sharedWithName || p.sharedWithName || null,
            usedForComparisonAt: data.usedForComparisonAt || p.usedForComparisonAt || null,
            usedByName: data.usedByName || data.importedByName || p.usedByName || null,
            usedByListName: data.usedByListName || p.usedByListName || null,
            concludedAt: data.concludedAt || p.concludedAt || null,
            finalizedAt: data.finalizedAt || p.finalizedAt || null,
            finishedAt: shouldConclude ? (data.finishedAt || data.finalizedAt || data.concludedAt || p.finishedAt || new Date().toISOString()) : p.finishedAt,
            archivedFinished: shouldConclude ? true : p.archivedFinished,
            status: shouldConclude ? "completed" : p.status,
            archivedStatus: shouldConclude ? "archived_completed" : p.archivedStatus,
            finished: shouldConclude ? true : p.finished,
            completed: shouldConclude ? true : p.completed,
            isFinished: shouldConclude ? true : p.isFinished,
          };
        }));

        if (shouldConclude) {
          const finishedAt = data.finishedAt || data.finalizedAt || data.concludedAt || new Date().toISOString();
          archivePantryAsRecentList({
            ...activePantry,
            status: "completed",
            sharedStatus: "concluida",
            archivedStatus: "archived_completed",
            archivedFinished: true,
            finished: true,
            completed: true,
            isFinished: true,
            finishedAt,
            completedAt: data.completedAt || finishedAt,
            finalizedAt: data.finalizedAt || finishedAt,
            concludedAt: data.concludedAt || finishedAt,
            importedByName: data.importedByName || activePantry.importedByName || null,
            sharedWithName: data.importedByName || data.sharedWithName || activePantry.sharedWithName || null,
            usedByName: data.usedByName || data.importedByName || activePantry.usedByName || null,
            usedByListId: data.usedByListId || activePantry.usedByListId || null,
            usedByListName: data.usedByListName || activePantry.usedByListName || null,
          }, data);
        }
      } catch (err) {
        console.warn("Não foi possível consultar status dos Itens em Casa compartilhados:", err);
      }
    };

    refreshOriginPantryStatus();
    const timer = setInterval(refreshOriginPantryStatus, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activePantry?.sharedId, activePantry?.id, pantryLists, savePantryLists, archivePantryAsRecentList]);

  // Mantém o remetente sincronizado quando os Itens em Casa compartilhados
  // forem concluídos pelo destinatário. Assim a despensa enviada sai do estado
  // ativo, passa para concluída/finalizada e libera a criação de nova lista.
  useEffect(() => {
    const candidates = (pantryLists || []).filter((pantry) =>
      pantry?.sharedId &&
      pantry?.status === "ativa" &&
      !isPantryFinishedByShareStatus(pantry)
    );

    if (!candidates.length) return undefined;

    let cancelled = false;

    const refreshCompletedSharedPantries = async () => {
      try {
        const results = await Promise.all(
          candidates.map(async (pantry) => {
            const record = await getSharedListRecord(pantry.sharedId).catch(() => null);
            const data = record?.data || {};
            const status = normalizePlainText(data.sharedStatus || data.status || "");
            const finished = ["concluida", "concluída", "finalizada", "finalizado", "completed", "archived completed", "archived_completed"].includes(status);
            return { pantry, data, finished };
          })
        );

        if (cancelled) return;

        const finishedById = new Map(
          results
            .filter((result) => result.finished)
            .map((result) => [result.pantry.id, result.data || {}])
        );

        if (!finishedById.size) return;

        const now = new Date().toISOString();
        savePantryLists((pantryLists || []).map((pantry) => {
          if (!finishedById.has(pantry.id)) return pantry;
          const data = finishedById.get(pantry.id) || {};
          return {
            ...pantry,
            status: "completed",
            sharedStatus: "concluida",
            archivedStatus: "archived_completed",
            archivedFinished: true,
            finished: true,
            completed: true,
            isFinished: true,
            finishedAt: data.finishedAt || data.finalizedAt || data.concludedAt || pantry.finishedAt || now,
            concludedAt: data.concludedAt || data.finalizedAt || pantry.concludedAt || now,
            finalizedAt: data.finalizedAt || data.concludedAt || pantry.finalizedAt || now,
            lastStatusAt: data.lastStatusAt || pantry.lastStatusAt || now,
            updatedAt: data.updatedAt || now,
            usedByName: data.usedByName || pantry.usedByName || null,
            usedByListId: data.usedByListId || pantry.usedByListId || null,
            usedByListName: data.usedByListName || pantry.usedByListName || null,
            recentListId: pantry.recentListId || `pantry-recent-${pantry.sharedId || pantry.id}`,
          };
        }));

        (pantryLists || []).forEach((pantry) => {
          if (!finishedById.has(pantry.id)) return;
          const data = finishedById.get(pantry.id) || {};
          const finishedAt = data.finishedAt || data.finalizedAt || data.concludedAt || now;
          archivePantryAsRecentList({
            ...pantry,
            status: "completed",
            sharedStatus: "concluida",
            archivedStatus: "archived_completed",
            archivedFinished: true,
            finished: true,
            completed: true,
            isFinished: true,
            finishedAt,
            completedAt: data.completedAt || finishedAt,
            finalizedAt: data.finalizedAt || finishedAt,
            concludedAt: data.concludedAt || finishedAt,
            usedByName: data.usedByName || pantry.usedByName || null,
            usedByListId: data.usedByListId || pantry.usedByListId || null,
            usedByListName: data.usedByListName || pantry.usedByListName || null,
          }, data);
        });

        setPantryCompared(false);
        setPantryComparison(null);
        setShowPantryComparisonDetails(false);
      } catch (err) {
        console.warn("Não foi possível finalizar localmente os Itens em Casa compartilhados:", err);
      }
    };

    refreshCompletedSharedPantries();
    const timer = setInterval(refreshCompletedSharedPantries, 12000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pantryLists, savePantryLists, archivePantryAsRecentList]);


  const resetPantryFlow = useCallback(() => {
    setPantryPendingItems([]);
    setPantryInput("");
    setPantryReviewCategories([]);
    setPantryEditingId(null);
    setPantryReviewEdit(null);
    setPantryReviewDirty(false);
    setPantryReviewReadOnly(false);
  }, []);

  const openPantryCreator = useCallback(() => {
    setPantryPendingItems([]);
    setPantryInput("");
    setPantryReviewCategories([]);
    setPantryEditingId(null);
    setPantryReviewEdit(null);
    setPantryReviewDirty(false);
    setPantryReviewReadOnly(false);
    setScreen("pantry_create");
  }, []);


  const openPantryViewer = useCallback(() => {
    if (!activePantry) return;
    setPantryEditingId(activePantry.id);
    setPantryReviewCategories(activePantry.categories || []);
    setPantryReviewEdit(null);
    setPantryReviewDirty(false);
    setPantryReviewReadOnly(true);
    setScreen("pantry_review");
  }, [activePantry]);

  const openPantryEditor = useCallback(() => {
    if (!activePantry) return;
    setPantryEditingId(activePantry.id);
    setPantryReviewCategories(activePantry.categories || []);
    setPantryReviewEdit(null);
    setPantryReviewDirty(false);
    setPantryReviewReadOnly(false);
    setScreen("pantry_review");
  }, [activePantry]);

  const removeActivePantry = useCallback(() => {
    if (!activePantry) return;
    const now = new Date().toISOString();
    savePantryLists(pantryLists.map(p => p.id === activePantry.id ? { ...p, status:"excluida", deletedAt: now } : p));
    setPantryCompared(false);
    setPantryComparison(null);
    setShowPantryComparisonDetails(false);
    showToast("🗑️ Itens em Casa excluídos");
  }, [activePantry, pantryLists, savePantryLists, showToast]);

  const leavePantryReview = useCallback(() => {
    if (!pantryReviewReadOnly && pantryReviewDirty) {
      showToast("⚠️ Salve os Itens antes de voltar.");
      return;
    }
    resetPantryFlow();
    setScreen("create");
  }, [pantryReviewReadOnly, pantryReviewDirty, resetPantryFlow, showToast]);

  const getManualDialogUnits = useCallback(() => {
    return ["unidade", "pacote", "kg", "litro", "caixa", "fardo", "saco", "metro", "m²", "lata", "garrafa", "rolo", "barra", "kit", "frasco", "tubo", "cartela", "galão", "mileiro"];
  }, []);

  const isDecimalManualUnit = useCallback((unit) => ["kg", "litro", "metro", "m²"].includes(normalizeUnitValue(unit)), []);

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
    return [];
  }, []);

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
    const name = smartNormalizeProductName(itemDialog?.name || "");
    return `${formatQtyUnit(Number.isFinite(qty) && qty > 0 ? qty : 1, unit)} · ${name}`;
  }, [dlgQty, dlgUnit, itemDialog]);

  const normalizeListOwnershipFlags=(list)=>{
    if(!list)return list;
    const currentName=getAppUserName();
    const owner=list.ownerName || list.remetente || currentName;
    const from=list.importedFrom || list.sharedOwner || list.remetente || list.ownerName || "";
    const ownerIsCurrent=normalizeAuthName(owner) && normalizeAuthName(owner)===normalizeAuthName(currentName);
    const fromIsCurrent=normalizeAuthName(from) && normalizeAuthName(from)===normalizeAuthName(currentName);

    // ── CORREÇÃO DO BUG DE STATUS ─────────────────────────────────────────
    // O problema: listas recebidas de outro usuário perdiam o status "Recebida de X"
    // ao excluir outra lista, porque esta função sobrescrevia imported=false
    // sempre que ownerName coincidisse com o nome do usuário atual.
    //
    // A correção: imported=true é protegido quando há marca explícita de
    // importação (importedAt ou receivedAt). Isso significa que a lista
    // definitivamente veio de outra pessoa, independente do nome do remetente.
    // ─────────────────────────────────────────────────────────────────────
    const wasExplicitlyImported = list.imported === true;
  if((ownerIsCurrent || fromIsCurrent) && !wasExplicitlyImported && !list.sharedId){
      return {
        ...list,
        imported:false,
        importedFrom:null,
        sharedOwner:null,
        isShared: list.isShared === true || Boolean(list.sharedId),
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
      const ownerName=saveAppUserName(list.ownerName || list.remetente || senderName || getAppUserName() || userNameInputRef.current || "Usuário do Tá na Lista");
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
  },[senderName,showToast]);

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
  // Mede o primeiro ItemRow via ref quando o tour está nos passos 3/4/5
  useEffect(() => {
    const itemSteps = ["list_item_check", "list_item_price", "list_item_missing"];
    if (!showGuidedTour || !guidedTourStep || !itemSteps.includes(guidedTourStep.id)) {
      setTourItemRect(null);
      return;
    }
    const measure = () => {
      const el = tourItemRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        const pad = 10;
        setTourItemRect({ x: r.left-pad, y: r.top-pad, w: r.width+pad*2, h: r.height+pad*2, centerY: r.top+r.height/2 });
      }
    };
    measure();
    const t = setTimeout(measure, 300);
    return () => clearTimeout(t);
  }, [showGuidedTour, guidedTourStep?.id]);

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
          setIsFirstAccessMode(true);
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
        const msg = String(pinResult.message || "");
        if (/primeiro acesso|confirme o pin|confirmar pin/i.test(msg)) {
          setAuthCheckedName(clean);
          setIsFirstAccessMode(true);
          showToast(pinResult.message,3600);
          return;
        }
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
      const isIncomingSharedList = new URL(window.location.href).searchParams.get("preview") === "1";
if(userId && !isIncomingSharedList)await restoreUserListsFromCloud(userId,savedName);
      await registrarEvento(pinResult.mode==="created" ? "user_created" : "login", {
        auth_mode: pinResult.mode || "login",
      });
if(sharedLandingRecord){
  setUserNameModal(false);
  // Limpa a URL para evitar que o useEffect de loadSharedListFromUrl
  // dispare novamente e abra o modal de login outra vez (parecia "deslogar").
  try { window.history.replaceState({}, document.title, "/"); } catch {}
  return;
}

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

  const returnToSearch=useCallback((delay=0)=>{
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    const listY = listRef.current?.scrollTop ?? null;
    setSearch("");
    setTimeout(()=>{
      try { window.scrollTo({ top: y, behavior: "auto" }); } catch {}
      try { if (listRef.current && listY != null) listRef.current.scrollTop = listY; } catch {}
    }, delay);
  },[]);

  const getPublicAppUrl=()=>APP_PUBLIC_URL;

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

  useEffect(()=>{
    if (userNameModal || loading || sharedLandingRecord || showGuidedTour || isAppRunningStandalone()) return;
    if (!shouldShowInstallPromptNotice()) return;
    const timer = setTimeout(()=>{
      try { localStorage.setItem(APP_INSTALL_PROMPT_LAST_SHOWN_KEY, String(Date.now())); } catch {}
      setShowInstallNotice(true);
      registrarEvento("install_notice_shown", { platform: getInstallPlatform(), screen });
    }, 1800);
    return()=>clearTimeout(timer);
  },[userNameModal, loading, sharedLandingRecord, showGuidedTour, screen]);

  const closeInstallNotice=(neverShow=false)=>{
    if (neverShow) {
      try { localStorage.setItem(APP_INSTALL_PROMPT_DISMISSED_KEY, "1"); } catch {}
      registrarEvento("install_notice_dismissed", { platform: getInstallPlatform(), never_show: true });
    } else {
      try { localStorage.setItem(APP_INSTALL_PROMPT_LAST_SHOWN_KEY, String(Date.now())); } catch {}
      registrarEvento("install_notice_later", { platform: getInstallPlatform() });
    }
    setShowInstallNotice(false);
  };

  const installApp=async()=>{
    const platform = getInstallPlatform();
    registrarEvento("install_button_clicked", { platform, install_available: Boolean(installPrompt || installAvailable) });

    if(!installPrompt){
      if (platform === "ios") {
        showToast("No iPhone: toque nos três pontos do navegador, depois em Compartilhar e escolha ‘Adicionar à Tela de Início’.",8500);
      } else if (platform === "android") {
        showToast("No Android: toque nos três pontinhos do Chrome e escolha ‘Adicionar à tela inicial’.",7500);
      } else {
        showToast("No navegador, abra o menu e escolha a opção para instalar ou adicionar o app à tela inicial.",7500);
      }
      setShowInstallNotice(true);
      return;
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(()=>null);
    registrarEvento("install_prompt_result", { platform, outcome: choice?.outcome || "unknown" });
    setInstallPrompt(null);
    setInstallAvailable(false);
    setShowInstallNotice(false);
  };

  const makeShareUrl=(sharedId)=>{
  const encoded=encodeURIComponent(sharedId);
  const base=window.location.origin;
  return `${base}/?lista=${encoded}&preview=1`;
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
    return `${APP_PUBLIC_URL}/?listaData=${encodeURIComponent(encodeListForUrl(list))}`;
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
      const alreadyShared={...list,isShared:true,sharedAt:list.sharedAt||new Date().toISOString()};
setCurrentList(prev=>prev&&prev.id===list.id?alreadyShared:prev);
saveLists(lists.map(l=>l.id===list.id?alreadyShared:l));
syncSharedListToCloud(alreadyShared,{silent:true});
return{sharedId:list.sharedId,link:makeShareUrl(list.sharedId),list:alreadyShared,mode:"supabase"};
    }

    const record=await createSharedListRecord(list);
    if(!record?.id)throw new Error("Não foi possível gerar o link curto da lista no Supabase.");

    const updated={...list,sharedId:record.id,userId:record.user_id || list.userId || getAppUserId() || null,ownerName:record.remetente || list.ownerName || getAppUserName(),sharedAt:new Date().toISOString(),isShared:true};
    setCurrentList(prev=>prev&&prev.id===list.id?updated:prev);
    saveLists(lists.map(l=>l.id===list.id?updated:l));
    await registrarEvento("share_list", {
      list_id: updated.id || null,
      shared_id: updated.sharedId || null,
      list_name: updated.name || "",
      list_type: updated.type || "",
    });
    return{sharedId:record.id,link:makeShareUrl(record.id),list:updated,mode:"supabase"};
  };


  const buildPantryShareText=(pantry,link)=>{
    const lines=[];
    lines.push("🏠 Tá na Lista");
    lines.push("");
    lines.push("Você recebeu uma lista de Itens em Casa:");
    lines.push("*Itens em Casa*");
    lines.push("");
    lines.push("📌 Itens: "+(pantry?.itemCount || countCategoryItems(pantry?.categories || [])));
    lines.push("");
    lines.push("Abra no app para importar para seus Itens em Casa:");
    lines.push(link);
    lines.push("");
    lines.push("Depois, use a comparação para evitar compras repetidas.");
    return lines.join("\n");
  };

  const publishSharedPantry=async(pantry)=>{
    if(!pantry)throw new Error("Itens em Casa não encontrados.");
    const sender=getSenderName();
    const now=new Date().toISOString();
    const payload={
      id: pantry.id || `pantry-${Date.now()}`,
      name:"Itens em Casa",
      type:"pantry",
      listKind:"pantry_share",
      categories: pantry.categories || [],
      itemCount: pantry.itemCount || countCategoryItems(pantry.categories || []),
      createdAt: pantry.createdAt || now,
      updatedAt: now,
      ownerName: sender,
      remetente: sender,
      sharedAt: now,
      isShared:true,
      sharedStatus:"compartilhada",
    };

    if(pantry.sharedId){
      await updateSharedListRecord(pantry.sharedId,payload).catch(()=>null);
      return { sharedId: pantry.sharedId, link: makeShareUrl(pantry.sharedId), pantry: { ...pantry, ...payload, sharedId: pantry.sharedId } };
    }

    const record=await createSharedListRecord(payload);
    if(!record?.id)throw new Error("Não foi possível gerar o link dos Itens em Casa.");
    const updated={...pantry,...payload,sharedId:record.id};
    savePantryLists(pantryLists.map(p=>p.id===pantry.id?updated:p));
    await registrarEvento("share_pantry", {
      pantry_id: updated.id || null,
      shared_id: updated.sharedId || null,
      item_count: updated.itemCount || 0,
    });
    return { sharedId: record.id, link: makeShareUrl(record.id), pantry: updated };
  };

  const shareActivePantry=async()=>{
    if(!activePantry){ showToast("⚠️ Nenhuma lista de Itens em Casa ativa"); return; }
    try{
      showToast("🔗 Gerando link dos Itens em Casa...");
      const { link, pantry } = await publishSharedPantry(activePantry);
      const text=buildPantryShareText(pantry,link);
      openWhatsAppDirect(text);
      showToast("✅ WhatsApp aberto para envio dos Itens em Casa.",3200);
    }catch(err){
      console.error("Erro ao compartilhar Itens em Casa:",err);
      showToast("⚠️ Não foi possível compartilhar os Itens em Casa. Verifique o Supabase.",6500);
    }
  };

  const updateSharedPantryOriginStatus=async(sharedId,status,extra={})=>{
    try{
      if(!sharedId)return false;
      const record=await getSharedListRecord(sharedId);
      const data=record?.data || {};
      if(!data)return false;
      const now=new Date().toISOString();
      const payload={
        ...data,
        sharedStatus:status,
        updatedAt:now,
        lastStatusAt:now,
        ...extra,
      };
      if(status === "importada"){
        payload.sharedStatus="importada";
        payload.importedAt=extra.importedAt || now;
        payload.importedByName=extra.importedByName || extra.sharedWithName || payload.importedByName || null;
        payload.sharedWithName=extra.sharedWithName || extra.importedByName || payload.sharedWithName || null;
      }
      if(status === "utilizada_na_comparacao"){
        payload.usedForComparisonAt=extra.usedForComparisonAt || now;
        payload.importedByName=extra.importedByName || payload.importedByName || null;
        payload.sharedWithName=extra.sharedWithName || payload.importedByName || payload.sharedWithName || null;
      }
      if(status === "concluida" || status === "finalizada"){
        payload.sharedStatus="concluida";
        payload.status="completed";
        payload.archivedStatus="archived_completed";
        payload.archivedFinished=true;
        payload.finished=true;
        payload.completed=true;
        payload.isFinished=true;
        payload.concludedAt=extra.concludedAt || now;
        payload.finalizedAt=extra.finalizedAt || now;
        payload.finishedAt=extra.finishedAt || extra.finalizedAt || extra.concludedAt || now;
        payload.completedAt=extra.completedAt || extra.finishedAt || extra.finalizedAt || extra.concludedAt || now;
      }
      await updateSharedListRecord(sharedId,payload);
      return true;
    }catch(err){
      console.warn("Não foi possível atualizar status dos Itens em Casa compartilhados:",err);
      return false;
    }
  };

  const importSharedRecordToApp=useCallback(async(record, embeddedFallback=null)=>{
    const sourceSharedId=record?.id || extractSharedIdFromUrl();
    const baseData=record?.data || embeddedFallback;
    if(!baseData)throw new Error("Lista compartilhada não encontrada.");

    if(baseData?.listKind === "pantry_share" || baseData?.type === "pantry"){
      const currentUserName=saveAppUserName(getAppUserName() || senderName || userNameInputRef.current || "Usuário do Tá na Lista");
      await registerAppUser(currentUserName,{force:true}).catch(()=>getAppUserId());
      const sender=record?.remetente || baseData.remetente || baseData.ownerName || "Não informado";
      const now=new Date().toISOString();
      const importedPantry={
        id:`pantry-imported-${sourceSharedId || Date.now()}-${Math.random().toString(36).slice(2)}`,
        name:"Itens em Casa",
        status:"ativa",
        categories: Array.isArray(baseData.categories) ? baseData.categories : [],
        itemCount: baseData.itemCount || countCategoryItems(baseData.categories || []),
        createdAt: now,
        updatedAt: now,
        imported:true,
        importedFrom: sender,
        sharedOwner: sender,
        receivedFromName: sender,
        importedByName: currentUserName || "Usuário",
        importedAt: now,
        originalSharedId: sourceSharedId || baseData.sharedId || null,
        sourceSharedId: sourceSharedId || baseData.sharedId || null,
        sharedStatus:"importada",
      };
      savePantryLists([importedPantry, ...pantryLists.map(p=>p.status === "ativa" ? { ...p, status:"concluida", replacedAt: now } : p)]);
      setPantryCompared(false);
      setPantryComparison(null);
      setShowPantryComparisonDetails(false);
      setScreen("create");
      setSharedLandingRecord(null);
      try { window.history.replaceState({}, document.title, "/"); } catch {}
      if(sourceSharedId){
        appendSharedListEvent(sourceSharedId, {
          type:"pantry-imported",
          actorName:currentUserName || "Usuário",
          targetName:sender,
          listName:"Itens em Casa",
          pantryId:importedPantry.id,
          message:`${currentUserName || "Usuário"} importou os Itens em Casa compartilhados.`,
        });

        await updateSharedPantryOriginStatus(sourceSharedId, "importada", {
          importedByName: currentUserName || "Usuário",
          sharedWithName: currentUserName || "Usuário",
          importedAt: now,
        });
      }
      await registrarEvento("shared_pantry_imported", {
        pantry_id: importedPantry.id || null,
        original_shared_id: sourceSharedId || null,
        imported_from: sender,
      });
      showToast("🏠 Itens em Casa importados e ativados");
      return importedPantry;
    }

    const currentUserName=saveAppUserName(getAppUserName() || senderName || userNameInputRef.current || "Usuário do Tá na Lista");
    const currentUserId=await registerAppUser(currentUserName,{force:true}).catch(()=>getAppUserId());
    const sender=record?.remetente || baseData.remetente || baseData.ownerName || "Não informado";
    const existing=JSON.parse(localStorage.getItem("tnl_lists")||"[]");

    const already=existing.find(l=>{
      const sameSource=sourceSharedId && (l.originalSharedId===sourceSharedId || l.sourceSharedId===sourceSharedId || l.importedOriginalSharedId===sourceSharedId);
      const sameUser=!currentUserId || !l.userId || l.userId===currentUserId;
      return sameSource && sameUser;
    });

    if(already){
      setCurrentList(already);
      setScreen("list");
      setSearch("");
      setCollapsedCats({});
      setSharedLandingRecord(null);
      try { window.history.replaceState({}, document.title, "/"); } catch {}
      showToast("📲 Lista compartilhada já estava salva");
      return already;
    }

    const localId=`imported-${sourceSharedId || Date.now()}-${Math.random().toString(36).slice(2)}`;
    const received={
      ...JSON.parse(JSON.stringify(baseData)),
      id:localId,
      sharedId:null,
      originalSharedId:sourceSharedId || baseData.sharedId || null,
      sourceSharedId:sourceSharedId || baseData.sharedId || null,
      userId: currentUserId || getAppUserId() || null,
      ownerName: currentUserName,
      remetente: currentUserName,
      isShared:false,
      imported:true,
      importedFrom:sender,
      sharedOwner:sender,
      sharedMode:"imported-copy",
      receivedAt:new Date().toISOString(),
      importedAt:new Date().toISOString(),
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      status:"open",
      isFinished:false,
      finishedAt:null,
      completedAt:null,
      finalizedAt:null,
      archivedAt:null,
      archivedFinished:false,
      locked:false,
      isReadOnly:false,
      readOnly:false,
      history:false,
    };

    if(wasListDeletedLocally(received)){
      setSharedLandingRecord(null);
      showToast("🗑 Esta lista já foi excluída neste aparelho",2200);
      return null;
    }

    const finalReceived={...received,sharedId:null,originalSharedId:received.originalSharedId,sourceSharedId:received.sourceSharedId,imported:true,importedFrom:sender,sharedOwner:sender,isShared:false,sharedMode:"imported-copy"};
    const nl=mergeUniqueLists([finalReceived,...existing]);
setLists(nl);
localStorage.setItem("tnl_lists",JSON.stringify(nl));
setCurrentList(finalReceived);
setScreen("list");

// Cria registro próprio no Supabase para o receptor, vinculado ao userId dele.
// Isso permite que o PWA instalado encontre a lista ao restaurar da nuvem.
// A sincronização em tempo real continua usando sourceSharedId (registro original).
if(currentUserId && sourceSharedId){
  const receiverRecord = {
    ...finalReceived,
    sharedId: null,
    userId: currentUserId,
    ownerName: currentUserName,
    remetente: currentUserName,
    sourceSharedId,
    originalSharedId: sourceSharedId,
    imported: true,
    importedFrom: sender,
  };
  createSharedListRecord(receiverRecord).then(record => {
    if(record?.id){
      const withSharedId = {...finalReceived, sharedId: record.id, sourceSharedId, originalSharedId: sourceSharedId};
      setCurrentList(withSharedId);
      setLists(prev => (Array.isArray(prev)?prev:[]).map(l => l.id === finalReceived.id ? withSharedId : l));
      try { localStorage.setItem("tnl_lists", JSON.stringify(
        (JSON.parse(localStorage.getItem("tnl_lists")||"[]")).map(l => l.id === finalReceived.id ? withSharedId : l)
      )); } catch {}
    }
  }).catch(()=>null);
}
    setSearch("");
    setCollapsedCats({});
    setSharedLandingRecord(null);
    try { window.history.replaceState({}, document.title, "/"); } catch {}

    const actorName = getAppUserName() || "Usuário";
    if (sourceSharedId) {
      appendSharedListEvent(sourceSharedId, {
        type: "shared-accepted",
        actorName,
        targetName: sender,
        listName: finalReceived.name || "Lista",
        listId: finalReceived.id,
        message: `${actorName} importou a lista "${finalReceived.name || "compartilhada"}".`,
      });
    }
    await registrarEvento("shared_list_imported", {
      list_id: finalReceived.id || null,
      shared_id: finalReceived.sharedId || null,
      original_shared_id: sourceSharedId || null,
      list_name: finalReceived.name || "",
      imported_from: sender,
    });
    showToast("📲 Lista recebida salva no seu app");
    return finalReceived;
  },[showToast, addNotification, senderName, persistListRecordToCloud]);

  const loadSharedListFromUrl=useCallback(async()=>{
    const embedded=extractEmbeddedListFromUrl();
    const sharedId=extractSharedIdFromUrl();
    if(!sharedId&&!embedded)return;

    const validSession=hasValidLocalSession();

    setLoading(true);
    try{
      if(embedded){
        if(validSession){
          setUserNameModal(false);
          await importSharedRecordToApp(null, embedded);
          clearSharedUrlFromAddressBar();
          return;
        }

        setSharedPreviewExpanded(false);
        setSharedLandingRecord({
          id: embedded.sharedId || embedded.originalSharedId || `embedded-${Date.now()}`,
          data: embedded,
          remetente: embedded.remetente || embedded.ownerName || embedded.sharedOwner || "Não informado",
          embedded:true,
        });
        setUserNameInput(getAppUserName() || "");
        setUserNameModal(true);
        return;
      }

      const record=await getSharedListRecord(sharedId);
      if(!record?.data)throw new Error("Lista compartilhada não encontrada.");

     if(validSession){
        setUserNameModal(false);
        const isPreviewMode=new URL(window.location.href).searchParams.get("preview")==="1";
        if(!isPreviewMode){
          await importSharedRecordToApp(record);
          clearSharedUrlFromAddressBar();
          return;
        }
        // Preview: mostra o modal de escolha que já existe no app
        setSharedPreviewExpanded(false);
        setSharedLandingRecord(record);
        clearSharedUrlFromAddressBar();
        return;
      }

      setSharedPreviewExpanded(false);
      setSharedLandingRecord(record);

      // Só abre login quando não há sessão PIN válida neste aparelho.
      setUserNameInput(getAppUserName() || "");
      setUserNameModal(true);

      // Mantém o link em formato de query string para evitar 404 em hospedagens SPA/Vercel sem rewrite.
      try { window.history.replaceState({}, document.title, "/?lista=" + encodeURIComponent(sharedId)); } catch {}
    }catch(err){
      showToast("⚠️ Não foi possível abrir a lista: "+(err?.message||"erro"),5200);
    }finally{
      setLoading(false);
    }
  },[showToast,importSharedRecordToApp,hasValidLocalSession,clearSharedUrlFromAddressBar]);

  useEffect(()=>{loadSharedListFromUrl();},[loadSharedListFromUrl]);

  // ── Dialog de produto ─────────────────────────────────────────────────
  // ── Classificação por IA em tempo real ──────────────────────────────
  const [dlgLoading, setDlgLoading] = useState(false);

  const openProductDialog = async (name, existing=null, options={}) => {
    const mode = options?.mode || "pending";
    const activeTypeConfig = getListTypeConfig(options?.listType || currentList?.type || listType);
    const mergeTypeUnits = (cfg) => ({
      ...(cfg || {}),
      unidades: Array.from(new Set([
        ...((Array.isArray(cfg?.unidades) && cfg.unidades.length) ? cfg.unidades : []),
        ...((Array.isArray(activeTypeConfig?.units) && activeTypeConfig.units.length) ? activeTypeConfig.units : []),
      ])).filter(Boolean),
    });

    if (existing) {
      const cfg = mergeTypeUnits(getProductConfig(name));
      setDlgConfig(cfg);
      setDlgMarca("");
      setDlgTipo("");
      setDlgPeso("");
      setDlgVolume("");
      setDlgQty(existing.qty||1);
      setDlgUnit(existing.unit||cfg.unidades?.[0]||"unidade");
      setItemDialogMode(mode);
      setItemDialog({name});
      return;
    }
    // Novo item manual: abre diálogo simples e rápido, sem marca/tipo.
    const cfg = mergeTypeUnits(getProductConfig(name));
    setDlgLoading(false);
    setDlgConfig(cfg);
    setDlgMarca(""); setDlgTipo("");
    const preferredUnit = Array.isArray(cfg.unidades) && cfg.unidades.includes(activeTypeConfig?.defaultUnit)
      ? activeTypeConfig.defaultUnit
      : (Array.isArray(cfg.unidades) && cfg.unidades.includes("pacote") ? "pacote" : (cfg.unidades?.[0] || activeTypeConfig?.defaultUnit || "unidade"));
    setDlgUnit(normalizeUnitValue(preferredUnit));
    setDlgQty(1);
    setDlgPeso("");
    setDlgVolume("");
    setItemDialogMode(mode);
    setItemDialog({name});
  };

  const handleAddItem = async () => {
    const name = currentInput.trim();
    if (!name) return;
    await openProductDialog(name);
  };


  const addItemsToPantryReview = useCallback((items = []) => {
    const normalizedItems = applyUserMemoryToItems(Array.isArray(items) ? items : [])
      .map(normalizeListItem)
      .filter((item) => item && item.name);

    if (!normalizedItems.length) return 0;

    setPantryReviewDirty(true);
    setPantryReviewCategories((prev) => {
      const next = JSON.parse(JSON.stringify(Array.isArray(prev) ? prev : []));
      const organized = enforceKnownCategoryRules(demoOrganize(normalizedItems, "mercado"));

      (organized || []).forEach((cat) => {
        const catName = cat?.name || "Outros";
        let target = next.find((existing) => normalizePlainText(existing.name) === normalizePlainText(catName));

        if (!target) {
          target = { name: catName, items: [] };
          next.push(target);
        }

        target.items = [
          ...(Array.isArray(target.items) ? target.items : []),
          ...(Array.isArray(cat.items) ? cat.items : []).map((item) => ({
            ...normalizeListItem(item),
            checked: false,
            notFound: false,
            price: null,
          })),
        ];
      });

      return sanitizeCategories(enforceKnownCategoryRules(next));
    });

    return normalizedItems.length;
  }, []);

  const confirmDialog = () => {
    const editedName = String(itemDialog?.name || "").trim();
    if (!editedName) { showToast("⚠️ Informe o nome do item"); return; }
    const unit = normalizeUnitValue(dlgUnit || "unidade");
    const qtyNumber = Number(String(dlgQty || 1).replace(",", "."));
    const newItem = normalizeListItem({
      name: editedName,
      marca: "",
      tipo: "",
      embalagem: "",
      peso: "",
      volume: "",
      detail: "",
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
        memory[key] = { name: newItem.name, unit: newItem.unit, detail: "", updatedAt: new Date().toISOString() };
        localStorage.setItem("tnl_item_memory", JSON.stringify(memory));
      }
    } catch {}
    if (itemDialogMode === "pantryReview") {
      setPantryReviewDirty(true);
      if (pantryReviewEdit) {
        setPantryReviewCategories(prev => prev.map((cat,ci) => ci === pantryReviewEdit.catIndex ? {
          ...cat,
          items: (cat.items || []).map((it,ii) => ii === pantryReviewEdit.itemIndex ? newItem : it)
        } : cat));
      }
      setPantryReviewEdit(null);
      setItemDialog(null);
      setItemDialogMode("pending");
      showToast("✏️ Item dos Itens em Casa atualizado");
      return;
    }
    if (itemDialogMode === "pantryReviewAdd") {
      addItemsToPantryReview([newItem]);
      setPantryReviewEdit(null);
      setItemDialog(null);
      setItemDialogMode("pending");
      setPantryInput("");
      showToast("✅ Item adicionado aos Itens em Casa");
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
      showToast("✅ Item adicionado à Itens em Casa");
      return;
    }
    if (itemDialogMode === "extra" && currentList) {
      const l = JSON.parse(JSON.stringify(currentList));
      const targetCategoryName = getCategoryForExtraItem(newItem);
      const enteredPrice = parseBRL(exPrice);
      const hasExtraPrice = enteredPrice != null && enteredPrice > 0;
      const extraPriceMode = inferExtraPriceMode(newItem, targetCategoryName);

      const extraItem = {
        ...newItem,
        detail: newItem.detail || "➕ EXTRA",
        extra: true,
        extraLabel: "➕ EXTRA",
        addedDuringPurchase: true,
        addedAt: new Date().toISOString(),
        checked: hasExtraPrice,
        notFound: false,
        price: hasExtraPrice ? enteredPrice : null,
        priceMode: hasExtraPrice ? extraPriceMode : undefined,
        priceRecordedAt: hasExtraPrice ? new Date().toISOString() : undefined,
        purchasedAsExtra: hasExtraPrice,
        pendingExtraPrice: !hasExtraPrice,
      };

      let cat = l.categories.find(c => normalizePlainText(c.name) === normalizePlainText(targetCategoryName));
      if (!cat) {
        cat = { name: targetCategoryName, items: [] };
        l.categories.push(cat);
      }

      cat.items.push(extraItem);
      l.categories = enforceKnownCategoryRules(l.categories, currentList?.type || listType);
      updateList(l);

      if (hasExtraPrice) {
        try {
          const totalForHistory = getItemLineTotal(extraItem);
          addPriceHistoryEntry({
            itemName: extraItem.name,
            unitPrice: Number(extraItem.price || 0),
            totalPrice: Number(totalForHistory || extraItem.price || 0),
            quantity: Number(extraItem.qty || 1),
            unit: extraItem.unit || "unidade",
            listType: currentList?.type || listType,
            listName: currentList?.name || listName,
            listId: currentList?.id || "",
            itemId: extraItem.id || extraItem.name || "",
            recordedAt: extraItem.priceRecordedAt || new Date().toISOString()
          });
        } catch {}
      }

      registrarEvento("add_extra_item", {
        list_id: l.id || null,
        shared_id: l.sharedId || null,
        list_name: l.name || "",
        item_name: extraItem.name || "",
        item_qty: Number(extraItem.qty || 1),
        item_unit: extraItem.unit || "unidade",
        item_price: hasExtraPrice ? Number(enteredPrice || 0) : 0,
        category: targetCategoryName,
        purchased_now: hasExtraPrice,
      });
      setItemDialog(null);
      setItemDialogMode("pending");
      setCurrentInput("");
      setExName(""); setExQty(1); setExUnit("unidade"); setExPrice("");
      showToast(hasExtraPrice ? `⭐ Extra comprado em ${targetCategoryName}!` : `⭐ Item extra adicionado em ${targetCategoryName}!`);
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

  const handleAddPantryReviewItem = async () => {
    const name = pantryInput.trim();
    if (!name) {
      showToast("⚠️ Informe o item que deseja acrescentar");
      return;
    }
    setPantryReviewEdit(null);
    await openProductDialog(name, null, { mode: "pantryReviewAdd" });
  };

  const removePantryReviewItem = (catIndex, itemIndex) => {
    setPantryReviewDirty(true);
    setPantryReviewCategories(prev => prev
      .map((cat,ci) => ci === catIndex ? { ...cat, items: (cat.items || []).filter((_,ii) => ii !== itemIndex) } : cat)
      .filter(cat => (cat.items || []).length > 0)
    );
    showToast("🗑️ Item removido dos Itens em Casa");
  };


  const proceedAfterPantryComparison = useCallback(() => {
    const resultItems = Array.isArray(pantryComparison?.items) ? pantryComparison.items : [];
    setPendingItems(resultItems);
    setScreen("create");
    showToast("✅ Pré-lista atualizada. Agora toque em Organizar lista.");
  }, [pantryComparison, setPendingItems, setScreen, showToast]);

  const organizePantry = async () => {
    if (pantryPendingItems.length === 0) { showToast("⚠️ Adicione itens em casa"); return; }
    setLoading(true);
    try {
      let categories;
      const itemsWithMemory = applyUserMemoryToItems(pantryPendingItems);
      try { categories = await aiOrganize(itemsWithMemory, "mercado"); }
      catch { categories = demoOrganize(itemsWithMemory, "mercado"); }
      categories = enforceKnownCategoryRules(categories);
      setPantryReviewCategories(categories);
      setPantryReviewDirty(true);
      setPantryReviewReadOnly(false);
      setScreen("pantry_review");
    } finally { setLoading(false); }
  };

  const savePantryFromReview = () => {
    if (!pantryReviewCategories.length) { showToast("⚠️ Organize os Itens em Casa antes de salvar"); return; }
    const now = new Date().toISOString();
    if (pantryEditingId) {
      const updated = pantryLists.map(p => p.id === pantryEditingId ? {
        ...p,
        categories: pantryReviewCategories,
        itemCount: countCategoryItems(pantryReviewCategories),
        updatedAt: now,
      } : p);
      savePantryLists(updated);
      setPantryReviewDirty(false);
      resetPantryFlow();
      setPantryCompared(false);
      setPantryComparison(null);
      setShowPantryComparisonDetails(false);
      setScreen("create");
      showToast("✅ Itens em Casa atualizados");
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
    setPantryReviewDirty(false);
    resetPantryFlow();
    setPantryCompared(false);
    setPantryComparison(null);
    setShowPantryComparisonDetails(false);
    setScreen("create");
    showToast("✅ Itens em Casa salvos e ativos");
  };
















function getComparableProductKey(item) {
  const rawName = String(item?.name || item?.nome || "").trim();
  const rawDetail = String(item?.detail || item?.tipo || item?.marca || item?.embalagem || item?.peso || item?.volume || "").trim();

  const clean = (value) => normalizePlainText(value)
    .replace(/\b(pacote|pacotes|pct|pcte|unidade|unidades|un|und|unid|caixa|caixas|cx|fardo|fardos|lata|latas|garrafa|garrafas|kg|quilo|quilos|g|grama|gramas|l|litro|litros|ml)\b/g, " ")
    .replace(/\b(de|da|do|das|dos|com|para|e)\b/g, " ")
    .replace(/\d+[,.]?\d*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const text = clean(`${rawName} ${rawDetail}`);

  const knownProducts = [
    "feijao", "arroz", "macarrao", "cafe", "leite", "oleo", "acucar", "farinha", "sal",
    "detergente", "sabonete", "shampoo", "condicionador", "papel higienico",
    "tomate", "cebola", "batata", "cenoura", "banana", "maca", "laranja",
    "carne", "frango", "queijo", "presunto", "cerveja", "refrigerante", "agua",
    "ovo", "ovos", "manteiga", "margarina", "iogurte", "bolacha", "biscoito"
  ];

  const words = text.split(/\s+/).filter(Boolean);
  const found = knownProducts.find((product) => words.includes(product));
  if (found === "ovos") return "ovo";
  return found || words.slice(0, 2).join(" ") || text;
}

function areUnitsComparableForPantry(shoppingUnit, pantryUnit) {
  const a = normalizePlainText(normalizeUnitValue(shoppingUnit || "unidade"));
  const b = normalizePlainText(normalizeUnitValue(pantryUnit || "unidade"));
  if (a === b) return true;

  const generic = ["unidade", "un", "und", "unid"];
  if (generic.includes(a) || generic.includes(b)) return true;

  return false;
}

function comparePendingItemsWithPantry(items, pantryCategories = []) {
  const toNumber = (value, fallback = 1) => {
    const n = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const pantryItems = [];

  (Array.isArray(pantryCategories) ? pantryCategories : []).forEach((cat) => {
    (Array.isArray(cat?.items) ? cat.items : []).forEach((rawItem) => {
      const item = normalizeListItem(rawItem);
      const key = getComparableProductKey(item);
      if (!key) return;

      pantryItems.push({
        ...item,
        key,
        qty: toNumber(item.qty, 1),
        unit: normalizeUnitValue(item.unit || "unidade"),
      });
    });
  });

  const usedPantry = new Map();
  const resultItems = [];
  const removed = [];
  const adjusted = [];
  const kept = [];

  (Array.isArray(items) ? items : []).forEach((rawItem) => {
    const item = normalizeListItem(rawItem);
    const key = getComparableProductKey(item);
    const originalQty = toNumber(item.qty, 1);
    let remainingQty = originalQty;
    let abatedQty = 0;
    let matchedPantryName = "";

    pantryItems.forEach((pantryItem, pantryIndex) => {
      if (remainingQty <= 0) return;
      if (!key || key !== pantryItem.key) return;
      if (!areUnitsComparableForPantry(item.unit, pantryItem.unit)) return;

      const alreadyUsed = Number(usedPantry.get(pantryIndex) || 0);
      const availableQty = Math.max(0, Number(pantryItem.qty || 0) - alreadyUsed);
      if (availableQty <= 0) return;

      const discountQty = Math.min(remainingQty, availableQty);

      remainingQty = Number((remainingQty - discountQty).toFixed(3));
      abatedQty = Number((abatedQty + discountQty).toFixed(3));
      usedPantry.set(pantryIndex, Number((alreadyUsed + discountQty).toFixed(3)));
      matchedPantryName = pantryItem.name || pantryItem.nome || matchedPantryName;
    });

    if (abatedQty <= 0) {
      resultItems.push(item);
      kept.push(item);
      return;
    }

    if (remainingQty <= 0) {
      const removedEntry = {
        item,
        name: item.name,
        originalQty,
        pantryQty: abatedQty,
        matchedPantryName,
        reason: `Removido porque já havia ${formatQtyUnit(abatedQty, item.unit)} nos Itens em Casa.`,
        removedReason: `Removido porque já havia ${formatQtyUnit(abatedQty, item.unit)} nos Itens em Casa.`,
      };
      removed.push(removedEntry);
      return;
    }

    const updated = {
      ...item,
      qty: remainingQty,
      qtyAdjusted: true,
      originalQty,
      pantryQty: abatedQty,
      matchedPantryName,
      pantryNote: `Abatido ${formatQtyUnit(abatedQty, item.unit)} dos Itens em Casa`,
      adjustmentReason: `Abatido ${formatQtyUnit(abatedQty, item.unit)} dos Itens em Casa`,
    };

    adjusted.push({
      before: item,
      after: updated,
      name: item.name,
      originalQty,
      pantryQty: abatedQty,
      reason: updated.adjustmentReason,
    });

    resultItems.push(updated);
  });

  return {
    items: resultItems,
    kept,
    removed,
    adjusted,
    unchanged: kept,
    pantryItems,
  };
}

  const compareWithActivePantry = () => {
    if (!activePantry) {
      showToast("⚠️ Nenhuma lista de Itens em Casa ativa");
      return;
    }

    if (pendingItems.length === 0) {
      showToast("⚠️ Faça sua pré-lista antes de comparar");
      return;
    }

    const result = comparePendingItemsWithPantry(pendingItems, activePantry.categories);
    const now = new Date().toISOString();
    const actorName = getAppUserName() || "Usuário";
    const targetListName = listName || "Nova lista";
    const pantrySourceSharedId = activePantry.sourceSharedId || activePantry.originalSharedId || activePantry.sharedId || null;

    setPantryComparison(result);
    setPantryCompared(true);
    setShowPantryComparisonDetails(false);

    if (pantrySourceSharedId) {
      appendSharedListEvent(pantrySourceSharedId, {
        type: "pantry-used-comparison",
        actorName,
        listName: targetListName,
        pantryId: activePantry.id,
        message: `${actorName} usou os Itens em Casa compartilhados na comparação.`,
      });

      updateSharedPantryOriginStatus(pantrySourceSharedId, "utilizada_na_comparacao", {
        usedForComparisonAt: now,
        usedByName: actorName,
        sharedWithName: actorName,
        importedByName: activePantry.importedByName || actorName,
        usedByListName: targetListName,
        usedByPantryId: activePantry.id,
      });
    }

    savePantryLists(pantryLists.map(p => p.id === activePantry.id ? {
      ...p,
      sharedStatus: "utilizada_na_comparacao",
      usedForComparisonAt: now,
      usedByName: actorName,
      usedByListName: targetListName,
    } : p));

    setScreen("pantry_compare_result");
  };

  const markActivePantryAsCompleted = useCallback((sourceList=null) => {
    const active = pantryLists.find(p => p.status === "ativa");
    if (!active) return;
    const now = new Date().toISOString();
    const actorName = getAppUserName() || "Usuário";
    const pantrySourceSharedId = active.sourceSharedId || active.originalSharedId || active.sharedId || null;

    savePantryLists(pantryLists.map(p => p.id === active.id ? {
      ...p,
      status: "completed",
      sharedStatus: "concluida",
      archivedStatus: "archived_completed",
      archivedFinished: true,
      finished: true,
      completed: true,
      isFinished: true,
      concludedAt: now,
      finalizedAt: now,
      finishedAt: now,
      completedAt: now,
      usedByName: actorName,
      usedByListId: sourceList?.id || p.usedByListId || null,
      usedByListName: sourceList?.name || p.usedByListName || null,
    } : p));

    if (pantrySourceSharedId) {
      appendSharedListEvent(pantrySourceSharedId, {
        type: "pantry-finished",
        actorName,
        listName: sourceList?.name || active.usedByListName || "Lista de compras",
        pantryId: active.id,
        message: `${actorName} finalizou a compra usando os Itens em Casa compartilhados.`,
      });
      updateSharedPantryOriginStatus(pantrySourceSharedId, "concluida", {
        concludedAt: now,
        finalizedAt: now,
        finishedAt: now,
        completedAt: now,
        usedByName: actorName,
        sharedWithName: actorName,
        importedByName: active.importedByName || actorName,
        usedByListId: sourceList?.id || active.usedByListId || null,
        usedByListName: sourceList?.name || active.usedByListName || null,
      });
    }
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
     catch(err){
  console.error("Erro IA:", err);

  categories = demoOrganize(itemsWithMemory, listType) || [];

  if (!Array.isArray(categories)) {
    categories = [];
  }

  showToast("⚠️ IA indisponível — organização básica");
}
      categories=enforceKnownCategoryRules(categories, listType);
      saveUserItemMemoryFromCategories(categories);
      const now=new Date().toISOString();
      const editingOriginal=editingListId?lists.find(l=>l.id===editingListId):null;
      const editingDraftCopy=!editingOriginal && editingDraftCopyId ? lists.find(l=>l.id===editingDraftCopyId) : null;
      const baseEditingList=editingOriginal || editingDraftCopy;
      const isEditingDraftCopy=Boolean(editingDraftCopy);

      if(editingOriginal){
        categories=preserveEditedListStatus(editingOriginal,categories);
      }

      let newList=baseEditingList
        ? {
            ...baseEditingList,
            name:listName.trim()||baseEditingList.name||"Minha lista",
            type:listType,
            budget:parseBRL(budgetText)||0,
            categories,
            lastEditedAt:now,
            updatedAt:now,
            lastSyncedAt:now,
            total:0,
            isShared:baseEditingList.isShared===true,
            status:isEditingDraftCopy ? "active" : baseEditingList.status,
            editableCopy:isEditingDraftCopy ? false : baseEditingList.editableCopy,
            isCopy:isEditingDraftCopy ? false : baseEditingList.isCopy,
            copyMode:isEditingDraftCopy ? null : baseEditingList.copyMode,
            archivedFinished:false,
            finishedAt:null,
            completedAt:null,
            finalizedAt:null,
            finished:false,
            completed:false,
            isFinished:false,
            finalizada:false,
            finalized:false,
            isReadOnly:false,
            readOnly:false,
            locked:false,
            history:false,
          }
        : {id:Date.now().toString(),name:listName.trim()||"Minha lista",type:listType,budget:parseBRL(budgetText)||0,categories,createdAt:now,lastSyncedAt:now,total:0,isShared:false};

      // Toda lista criada pelo usuário passa a ser salva também na nuvem.
      // Assim ela aparece no computador e no celular com o mesmo nome de usuário.
     try {
  newList = await persistListRecordToCloud(newList, { silent: false });
} catch (err) {
  console.warn("Falha ao salvar lista na nuvem. Mantendo lista local:", err);
  showToast("⚠️ Lista salva apenas neste aparelho. Nuvem indisponível.", 3600);
}
      await registrarEvento(baseEditingList ? "update_list" : "create_list", {
        list_id: newList.id || null,
        shared_id: newList.sharedId || null,
        list_name: newList.name || "",
        list_type: newList.type || listType,
        budget: Number(newList.budget || 0),
        item_count: countCategoryItems(newList.categories || []),
      });

      const nl=baseEditingList
        ? lists.map(l=>l.id===baseEditingList.id?newList:l)
        : [newList,...lists];
      saveLists(nl);
      setPendingItems([]);setListName("");setBudgetText("");setBudgetEnabled(false);setListType("mercado");setCurrentInput("");setListNameConfirmed(false);setBudgetConfirmed(false);setEditingListId(null);setEditingDraftCopyId(null);
      setSearch("");setCollapsedCats({});
      if(editingOriginal){
        setCurrentList(null);
        archiveFinishedListsBeforeHome();
      }else{
        setCurrentList(newList);
        setScreen("list");
      }
     showToast(
  editingOriginal
    ? "✅ Alterações salvas. Voltando para o início."
    : "✅ Lista organizada!"
);
} catch (err) {
  console.error("Erro ao organizar lista:", err);
  showToast(
    "❌ Erro ao organizar lista: " + (err?.message || String(err)),
    6000
  );
} finally {
  setLoading(false);
}
  };

  const organizeListKeepOrder=async()=>{
    if(pendingItems.length===0){showToast("⚠️ Adicione pelo menos um item");return;}
    setLoading(true);
    try{
      const itemsWithMemory=applyUserMemoryToItems(pendingItems).map((item,index)=>({
        ...normalizeListItem(item),
        checked:false,
        notFound:false,
        price:item.price ?? null,
        originalOrder:index,
      }));

      let categories=[{
        name:"Minha sequência",
        items:itemsWithMemory,
        manualOrder:true,
      }];

      saveUserItemMemoryFromCategories(categories);
      const now=new Date().toISOString();
      const editingOriginal=editingListId?lists.find(l=>l.id===editingListId):null;
      const editingDraftCopy=!editingOriginal && editingDraftCopyId ? lists.find(l=>l.id===editingDraftCopyId) : null;
      const baseEditingList=editingOriginal || editingDraftCopy;
      const isEditingDraftCopy=Boolean(editingDraftCopy);

      if(editingOriginal){
        categories=preserveEditedListStatus(editingOriginal,categories);
      }

      let newList=baseEditingList
        ? {
            ...baseEditingList,
            name:listName.trim()||baseEditingList.name||"Minha lista",
            type:listType,
            budget:parseBRL(budgetText)||0,
            categories,
            lastEditedAt:now,
            updatedAt:now,
            lastSyncedAt:now,
            total:0,
            isShared:baseEditingList.isShared===true,
            organizationMode:"manual_order",
            status:isEditingDraftCopy ? "active" : baseEditingList.status,
            editableCopy:isEditingDraftCopy ? false : baseEditingList.editableCopy,
            isCopy:isEditingDraftCopy ? false : baseEditingList.isCopy,
            copyMode:isEditingDraftCopy ? null : baseEditingList.copyMode,
            archivedFinished:false,
            finishedAt:null,
            completedAt:null,
            finalizedAt:null,
            finished:false,
            completed:false,
            isFinished:false,
            finalizada:false,
            finalized:false,
            isReadOnly:false,
            readOnly:false,
            locked:false,
            history:false,
          }
        : {id:Date.now().toString(),name:listName.trim()||"Minha lista",type:listType,budget:parseBRL(budgetText)||0,categories,createdAt:now,lastSyncedAt:now,total:0,isShared:false,organizationMode:"manual_order"};

      try{
        newList=await persistListRecordToCloud(newList,{silent:false});
      }catch(err){
        console.warn("Falha ao salvar lista na nuvem. Mantendo lista local:",err);
        showToast("⚠️ Lista salva apenas neste aparelho. Nuvem indisponível.",3600);
      }

      await registrarEvento(baseEditingList ? "update_list" : "create_list",{
        list_id:newList.id||null,
        shared_id:newList.sharedId||null,
        list_name:newList.name||"",
        list_type:newList.type||listType,
        organization_mode:"manual_order",
        budget:Number(newList.budget||0),
        item_count:countCategoryItems(newList.categories||[]),
      });

      const nl=baseEditingList
        ? lists.map(l=>l.id===baseEditingList.id?newList:l)
        : [newList,...lists];

      saveLists(nl);
      setPendingItems([]);setListName("");setBudgetText("");setBudgetEnabled(false);setListType("mercado");setCurrentInput("");setListNameConfirmed(false);setBudgetConfirmed(false);setEditingListId(null);setEditingDraftCopyId(null);
      setSearch("");setCollapsedCats({});
      if(editingOriginal){
        setCurrentList(null);
        archiveFinishedListsBeforeHome();
      }else{
        setCurrentList(newList);
        setScreen("list");
      }
      showToast(editingOriginal?"✅ Alterações salvas. Voltando para o início.":"✅ Lista criada na sua ordem!");
    }catch(err){
      console.error("Erro ao criar lista na ordem do usuário:",err);
      showToast("❌ Erro ao criar lista: "+(err?.message||String(err)),6000);
    }finally{
      setLoading(false);
    }
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
      if (target === "pantry") {
        setPantryPendingItems(prev=>[...prev,...items]);
      } else if (target === "pantryReview") {
        addItemsToPantryReview(items);
        setPantryInput("");
      } else {
        setPendingItems(prev=>[...prev,...items]);
      }
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
      if (pasteTarget === "pantry") {
        setPantryPendingItems(prev=>[...prev,...normalizedItems]);
      } else if (pasteTarget === "pantryReview") {
        addItemsToPantryReview(normalizedItems);
        setPantryInput("");
      } else {
        setPendingItems(prev=>[...prev,...normalizedItems]);
      }
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
      // Voz não deve preencher o campo/modal de “Colar lista”.
      // A transcrição é processada diretamente como entrada de voz.
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
    setOcrFileName(file.name||"arquivo");
    setOcrText("");
    setOcrProgress(12);
    setOcrLoading(true);
    try{
      setOcrProgress(35);
      const text=normalizeOcrText(await readShoppingListFromImage(file, listType));
      setOcrProgress(100);
      setOcrText(text);
      if(text)showToast("✅ Lista lida pela IA. Revise antes de importar.",3600);
      else showToast("⚠️ Não consegui identificar itens. Tente enquadrar melhor.",4200);
    }catch(err){
      console.error("Erro na leitura:",err);
      const msg=err?.message||"";
      if(msg.includes("PDF")||msg.includes("converter"))showToast("⚠️ "+msg,5000);
      else if(msg.includes("não identificou")||msg.includes("nítida"))showToast("⚠️ A IA não encontrou itens. Tente uma imagem mais nítida e bem iluminada.",5000);
      else showToast("⚠️ Erro ao ler o arquivo. Tente novamente.",4600);
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

  const getAllowedPurchaseUnits=()=>{
    const activeType = currentList?.type || listType || "mercado";
    const typeUnits = getListTypeConfig(activeType)?.units || [];
    const baseUnits = ["unidade","pacote","kg","litro","caixa","fardo","saco"];
    return Array.from(new Set([...typeUnits, ...baseUnits])).filter(Boolean);
  };

  const inferPriceModeForUnit=(unit,item={})=>{
    const normalized=normalizeUnitValue(unit || item?.unit || "unidade");
    if(normalized==="kg")return "perKg";
    if(normalized==="litro" || normalized==="L")return "perLiter";
    if(normalized==="pacote")return "package";
    return "unit";
  };

  const getPriceLabelForModeAndUnit=(mode,unit)=>{
    const normalized=normalizeUnitValue(unit||"unidade");
    if(mode==="perKg")return "Preço por kg";
    if(mode==="perLiter")return "Preço por litro";
    if(normalized==="pacote")return "Preço por pacote";
    if(normalized==="caixa")return "Preço por caixa";
    if(normalized==="fardo")return "Preço por fardo";
    if(normalized==="saco")return "Preço por saco";
    return "Preço por unidade";
  };

  const qtyToKg=(item)=>{
    const q=normalizeCalcNumber(item?.qty,0);
    const u=normalizeUnitForCalc(item?.unit);
    if(["kg","quilo","quilos"].includes(u))return q;
    if(["g","grama","gramas"].includes(u))return q/1000;
    const stored=normalizeCalcNumber(item?.purchaseWeightKg,0);
    if(stored>0)return stored;
    const estimated=getEstimatedProduceWeight(item);
    return estimated?.estimatedKg || null;
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
    const rebuiltHistory = Array.from(byKey.values()).sort((a,b)=>String(a.createdAt||"").localeCompare(String(b.createdAt||"")));
savePriceHistory(rebuiltHistory);
return rebuiltHistory;
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
    if (!list) return false;

    // Cópias editáveis e rascunhos nunca podem ser tratados como lista finalizada.
    if (
      list.editableCopy === true ||
      list.isCopy === true ||
      list.copyMode === "prelist" ||
      list.status === "draft"
    ) {
      return false;
    }

    const explicitFinished = Boolean(
      list.archivedFinished === true ||
      list.finished === true ||
      list.completed === true ||
      list.isFinished === true ||
      list.finalizada === true ||
      list.finalized === true ||
      ["completed", "concluida", "concluída", "finalizada", "finalizado", "archived_completed", "archived completed"].includes(normalizePlainText(list.status || "")) ||
      ["concluida", "concluída", "finalizada", "finalizado", "completed"].includes(normalizePlainText(list.sharedStatus || ""))
    );
    if (explicitFinished) return true;
    const total=(list?.categories||[]).reduce((s,c)=>s+(c.items||[]).length,0);
    return total>0 && (list?.categories||[]).every(c=>(c.items||[]).every(i=>i.checked||i.notFound));
  };

const isRealSharedList=(list)=>Boolean(
  (list?.sharedId||list?.originalSharedId||list?.sourceSharedId) &&
  (list?.isShared === true || list?.imported === true || Boolean(list?.originalSharedId||list?.sourceSharedId))
);
  const isReadOnlyFinishedList=(list)=>Boolean(list?.archivedFinished===true);

  const blockFinishedListEdit=()=>{
    showToast("🔒 Lista finalizada. Faça uma cópia para usar ou editar.");
    returnToSearch();
    return true;
  };

  const archiveFinishedListsBeforeHome=()=>{
    try{
      if(currentList && isListFinished(currentList)){
        const now=new Date().toISOString();
        const archivedList={
          ...currentList,
          archivedFinished:true,
          finishedAt:currentList.finishedAt||now,
          finalizedAt:currentList.finalizedAt||now,
          lastSyncedAt:now,
          updatedAt:now,
          status:"archived_completed"
        };

        const exists=(lists||[]).some(item=>item?.id===archivedList.id);
        const nextLists=exists
          ? (lists||[]).map(item=>item?.id===archivedList.id ? archivedList : item)
          : [archivedList,...(lists||[])];

        saveLists(nextLists);

        // Se a compra usou Itens em Casa compartilhados/importados,
        // finalizar a compra também finaliza essa lista na origem.
        markActivePantryAsCompleted(archivedList);

        setCurrentList(null);

        // Sincroniza em segundo plano quando houver registro na nuvem.
        // A navegação não fica bloqueada caso a conexão demore ou falhe.
        persistListRecordToCloud(archivedList,{silent:true}).catch(err=>
          console.warn("Nao foi possivel sincronizar lista arquivada:",err)
        );

        showToast("✅ Lista salva no histórico.");
      }else{
        setCurrentList(null);
      }
    }catch(err){
      console.warn("Erro ao salvar lista antes de voltar:",err);
      setCurrentList(null);
    }

   setSearch("");
    setCollapsedCats({});
    // Limpa ?lista= da URL para evitar que loadSharedListFromUrl
    // dispare novamente e abra o modal de login ao voltar para home.
    try { window.history.replaceState({}, document.title, "/"); } catch {}
    setScreen("home");
  };


  const openListForEdit=(list)=>{
    if(!list)return;

    const editableCopy = Boolean(
      list?.isCopy === true ||
      list?.editableCopy === true ||
      list?.copyMode === "prelist" ||
      list?.copiedFrom ||
      list?.copiedFromId ||
      list?.copiedFromListId ||
      list?.status === "draft"
    );

    if(isListFinished(list) && !editableCopy){
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
    })));

    // Cópia de lista finalizada vira nova pré-lista, não edição da lista original.
    setEditingListId(editableCopy ? null : list.id);
    setEditingDraftCopyId(editableCopy ? list.id : null);
    setCurrentList(null);
    setPendingItems(items);
    setListName(String(list.name || "").replace(/\s*\(c[oó]pia\)$/i,""));
    setBudgetText(list.budget>0 ? fmtBRL(list.budget) : "");
    setBudgetEnabled(Number(list.budget||0)>0);
    setBudgetConfirmed(Number(list.budget||0)>0);
    setListNameConfirmed(Boolean(list.name));
    setListType(list.type||"mercado");
    setCurrentInput("");
    setEditPendingIdx(null);
    setPantryCompared(false);
    setPantryComparison(null);
    setShowPantryComparisonDetails(false);
    setListMenuId(null);
    setSearch("");
    setCollapsedCats({});
    setScreen("create");
    showToast(editableCopy ? "✏️ Cópia aberta para editar e organizar." : "✏️ Lista aberta para edição");
  };

  const duplicateList=(list)=>{
    if(!list)return;

    const now=new Date().toISOString();
    const copy={
      id:Date.now().toString(),
      name:(list.name||"Lista")+" (cópia)",
      type:list.type||"mercado",
      budget:Number(list.budget||0),
      categories:(Array.isArray(list.categories)?list.categories:[]).map(cat=>({
        ...cat,
        items:(Array.isArray(cat.items)?cat.items:[]).map(item=>({
          ...item,
          checked:false,
          notFound:false,
          checkedAt:null,
          price:null,
          total:null,
        }))
      })),
      createdAt:now,
      updatedAt:now,
      lastSyncedAt:null,
      total:0,

      // Marcadores usados para liberar a cópia como pré-lista editável.
      status:"draft",
      copyMode:"prelist",
      isCopy:true,
      editableCopy:true,
      copiedFrom:list.id || list.sharedId || null,
      copiedFromId:list.id || null,
      copiedFromListId:list.id || null,

      // Remove qualquer marca de finalização/travamento herdada da lista original.
      archivedFinished:false,
      finishedAt:null,
      completedAt:null,
      finalizedAt:null,
      finished:false,
      completed:false,
      isFinished:false,
      finalizada:false,
      finalized:false,
      isReadOnly:false,
      readOnly:false,
      locked:false,
      history:false,

      // Cópia começa local e independente.
      sharedId:null,
      isShared:false,
      sharedAt:null,
      sharedUrl:null,
      sharedEvents:[],
      imported:false,
      importedFrom:null,
      restoredFromCloud:false,
    };

    saveLists([copy,...lists]);
    setListMenuId(null);
    showToast("📄 Cópia criada. Abra o menu da cópia e toque em Editar lista.");
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

  useEffect(()=>{
    const handleListMenuAction=(event)=>{
      const detail=event?.detail || {};
      const action=detail.action;
      const listId=detail.listId;
      if(!action || !listId)return;

      const target=(Array.isArray(lists)?lists:[]).find(l=>(
        l?.id===listId ||
        l?.sharedId===listId ||
        l?.id===String(listId) ||
        l?.sharedId===String(listId)
      ));

      if(!target){
        showToast("⚠️ Lista não encontrada para executar a ação.",1800);
        return;
      }

      setListMenuId(null);

      if(action==="edit"){
        openListForEdit(target);
        return;
      }

      if(action==="share"){
        setCurrentList(target);
        setShareTargetList(target);
        setShareModal(true);
        return;
      }

      if(action==="duplicate"){
        duplicateList(target);
        return;
      }

      if(action==="stopSharing"){
        stopListSharing(target);
        return;
      }

      if(action==="delete"){
        setConfirmDelete(target.id);
        return;
      }
    };

    window.addEventListener("tnl:list-menu-action",handleListMenuAction);
    return()=>window.removeEventListener("tnl:list-menu-action",handleListMenuAction);
  },[lists,currentList]);

  const closeFinishedModal=()=>{
    markActivePantryAsCompleted(currentList);
    setShowFinished(false);
  };


  currentListRef.current=currentList;

  useEffect(()=>{
    if(!showFinished)return;
    const timer=setTimeout(()=>{
      markActivePantryAsCompleted(currentListRef.current);
      setShowFinished(false);
    },5000);
    return()=>clearTimeout(timer);
  },[showFinished]);

  const syncSharedListToCloud=useCallback(async(list,{silent=true,force=false}={})=>{
    const sharedId=list?.sharedId||list?.originalSharedId||list?.sourceSharedId;
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
    const sharedId=currentList?.originalSharedId||currentList?.sourceSharedId||currentList?.sharedId;
    if(!sharedId)return;
    setSharedSyncing(true);
    try{
      const record=await getSharedListRecord(sharedId);
      if(!record?.data)throw new Error("Lista compartilhada não encontrada.");
      const currentUserName = getAppUserName();
      const remoteOwner = record?.remetente || record?.data?.remetente || record?.data?.ownerName || currentList.remetente || currentList.ownerName || currentUserName || "Não informado";
      const remoteOwnerIsCurrentUser = normalizeAuthName(remoteOwner) && normalizeAuthName(remoteOwner) === normalizeAuthName(currentUserName);
      const isReceivedFromAnotherUser = Boolean(currentList.imported === true || currentList.receivedAt || currentList.importedAt) && !remoteOwnerIsCurrentUser;
      const acceptedEvent=(record.data?.sharedEvents||[]).find(e=>e.type==="shared-accepted");
const sharedWithName=acceptedEvent?.actorName||record.data?.sharedWithName||currentList.sharedWithName||null;
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
        sharedWithName: isReceivedFromAnotherUser ? null : sharedWithName,
        pulledAt:new Date().toISOString(),
      },record.data);
      setCurrentList(refreshed);
      const existing=JSON.parse(localStorage.getItem("tnl_lists")||"[]");
      const hasLocal=existing.some(l=>l.id===currentList.id||(sharedId&&(l.sharedId===sharedId||l.originalSharedId===sharedId||l.sourceSharedId===sharedId)));
      const nl=hasLocal
       ? existing.map(l=>(l.id===currentList.id||(sharedId&&(l.sharedId===sharedId||l.originalSharedId===sharedId||l.sourceSharedId===sharedId)))?refreshed:l)
        : [refreshed,...existing];
      setLists(nl);
      localStorage.setItem("tnl_lists",JSON.stringify(nl));
      const remoteSignature=sharedListSignature(record.data);
const localSignature=sharedListSignature(currentList);
const hasChanges=remoteSignature && remoteSignature!==localSignature;
setSharedUpdateNotice({type:"ok",msg:"Atualizada agora"});
if(hasChanges)showToast("🔄 Lista atualizada");
    }catch(err){
      console.warn("Falha ao atualizar lista compartilhada",err);
      showToast("⚠️ Não foi possível atualizar a lista compartilhada",5200);
    }finally{
      setSharedSyncing(false);
    }
  },[currentList,showToast]);



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
    const effectiveSharedId = updated.sharedId || updated.originalSharedId || updated.sourceSharedId;
if(effectiveSharedId){
  syncSharedListToCloud({...updated, sharedId: effectiveSharedId},{silent:true,force:true});
}
  };

  const toggleCheck=(ci,ii)=>{
    if(isReadOnlyFinishedList(currentList))return blockFinishedListEdit();
    const item=currentList.categories[ci].items[ii];
    if(item.notFound){
      showToast("⚠️ Item em falta. Volte para pendente antes de marcar como adquirido.");
      return;
    }
    if(item.checked){
      const l=JSON.parse(JSON.stringify(currentList));
      l.categories[ci].items[ii].checked=false;
      l.categories[ci].items[ii].price=null;
      updateList(l);
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
    registrarEvento(item.notFound ? "item_not_found" : "item_pending", {
      list_id: l.id || null,
      shared_id: l.sharedId || null,
      list_name: l.name || "",
      item_name: item.name || "",
    });
    updateList(l);
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
    setMEditName(item.name || "");
    setMUnit(normalizeUnitValue(item.unit || "unidade"));
    setMShowEditDetails(false);
    setMNotFound(false);
  };

  useEffect(()=>{
    if(!itemModal)return;
    const isTouchDevice = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;
    if (isTouchDevice) return undefined;
    const timer=setTimeout(()=>{
      try{
        priceInputRef.current?.focus?.();
        const len=String(priceInputRef.current?.value || "").length;
        priceInputRef.current?.setSelectionRange?.(len,len);
      }catch{}
    },120);
    return()=>clearTimeout(timer);
  },[itemModal]);

  const confirmItem=()=>{
    if(isReadOnlyFinishedList(currentList)){ setItemModal(null); return blockFinishedListEdit(); }
    const l=JSON.parse(JSON.stringify(currentList));
    const item=l.categories[itemModal.ci].items[itemModal.ii];
    const confirmedQty=numberFromText(mQtyText) || Number(mQty||1) || 1;
    const previousQty=Number(item.qty||1);
    if(item.originalQty==null)item.originalQty=previousQty;
    item.name=smartNormalizeProductName(mEditName || item.name || "");
    item.unit=normalizeUnitValue(mUnit || item.unit || "unidade");
    item.qty=confirmedQty;
    item.qtyAdjusted=Number(item.qty||0)!==Number(item.originalQty||0);
    item.notFound=mNotFound;
    const hasTypedPrice = Boolean(String(mPriceText || "").trim());
    if(mNotFound){
      item.checked=false;item.price=null;
    } else {
      const p=parseBRL(mPriceText);
      if(hasTypedPrice && p!=null&&p>=0){
        item.price=p;
        item.priceRecordedAt=new Date().toISOString();
        item.priceMode=normalizePriceMode(mPriceMode) || inferPriceModeForUnit(item.unit,item) || normalizePriceMode(item.priceMode) || inferDefaultPriceMode(item);
        if(item.priceMode==="perKg"){
          const kg=numberFromText(mWeightText);
          const estimated=getEstimatedProduceWeight(item);
          if(kg&&kg>0){
            item.purchaseWeightKg=kg;
            item.estimatedWeightUsed=false;
          } else if(estimated?.estimatedKg){
            item.purchaseWeightKg=estimated.estimatedKg;
            item.estimatedWeightUsed=true;
            item.estimatedWeightRangeKg=[estimated.minTotalKg, estimated.maxTotalKg];
          } else {
            delete item.purchaseWeightKg;
            delete item.estimatedWeightUsed;
            delete item.estimatedWeightRangeKg;
          }
        } else {
          delete item.purchaseWeightKg;
          delete item.estimatedWeightUsed;
          delete item.estimatedWeightRangeKg;
        }
      }
      if (hasTypedPrice) item.checked=true;
      if (hasTypedPrice) try {
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
      registrarEvento("start_shopping", {
        list_id: l.id || null,
        shared_id: l.sharedId || null,
        list_name: l.name || "",
        list_type: l.type || "",
      });
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
      l.completedAt = l.finishedAt;
      l.finalizedAt = l.finishedAt;
      l.status = "completed";
      registrarEvento("complete_list", {
        list_id: l.id || null,
        shared_id: l.sharedId || null,
        list_name: l.name || "",
        list_type: l.type || "",
        budget: Number(l.budget || 0),
        total: Number(getProgress(l).fullTotal || 0),
        item_count: countCategoryItems(l.categories || []),
      });
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

    registrarEvento(mNotFound ? "item_not_found" : "item_checked", {
      list_id: l.id || null,
      shared_id: l.sharedId || null,
      list_name: l.name || "",
      item_name: item.name || "",
      item_qty: Number(item.qty || 1),
      item_unit: item.unit || "unidade",
      item_price: Number(item.price || 0),
      item_total: Number(getItemLineTotal(item) || 0),
      price_mode: item.priceMode || "",
    });
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
    const normalizedName = smartNormalizeProductName(exName.trim());
    openProductDialog(normalizedName, null, { mode: "extra" });
    setExtraModal(false);
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
      archiveFinishedListsBeforeHome();
    }

    showToast("🗑 Lista excluída");

    // Se a lista foi criada pelo próprio usuário e possui registro no Supabase, tenta excluir também no servidor.
    // Se for lista recebida, ou se o DELETE for bloqueado por RLS, oculta a lista para este usuário/dispositivo.
    if(target.sharedId){
      let removedFromCloud=false;
      let persistedDeletion=false;

      persistedDeletion=await softDeleteSharedListRecord(target.sharedId,target);

      if(!target.imported){
        removedFromCloud=await deleteSharedListRecord(target.sharedId);
      }

      if(!removedFromCloud && !persistedDeletion){
        await hideSharedListRecordForCurrentUser(target.sharedId);
        showToast("🗑 Lista removida da sua conta",1800);
      }
    } else {
      // Lista sem sharedId local — pode ter sido persistida no Supabase em sessão anterior
      // sem que o sharedId tenha sido salvo de volta no localStorage.
      // Busca pelo nome+userId e marca como deletada no Supabase se encontrar.
      try {
        const cloudRecord = await findSharedListRecordByList(target);
        if(cloudRecord?.id){
          await softDeleteSharedListRecord(cloudRecord.id, target);
        }
      } catch {
        // Falha silenciosa — a exclusão local já foi feita
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
  const dlgPreview=itemDialog?[dlgQty+" "+dlgUnit,dlgTipo,itemDialog.name].filter(Boolean).join(" · "):"";


  // ─────────────────────────────────────────────────────────────────────
  const globalFirstPendingKey = (() => {
    if (!currentList?.categories) return null;
    const sortedCats = [...currentList.categories]
      .map((cat, oi) => ({ cat, oi }))
      .sort((a, b) => {
        const aX = normalizePlainText(a.cat.name) === "itens extras";
        const bX = normalizePlainText(b.cat.name) === "itens extras";
        if (aX !== bX) return aX ? 1 : -1;
        const aD = a.cat.items.length > 0 && a.cat.items.every(i => i.checked || i.notFound);
        const bD = b.cat.items.length > 0 && b.cat.items.every(i => i.checked || i.notFound);
        if (aD === bD) return a.oi - b.oi;
        return aD ? 1 : -1;
      });
    for (const { cat } of sortedCats) {
      const items = [...cat.items].sort((a, b) => {
        const aD = !!(a.checked || a.notFound);
        const bD = !!(b.checked || b.notFound);
        if (aD === bD) return !aD ? String(a.name||"").localeCompare(String(b.name||""),"pt-BR") : 0;
        return aD ? 1 : -1;
      });
      const first = items.find(i => !i.checked && !i.notFound);
      if (first) return `${first.name}||${first.unit}||${first.qty}`;
    }
    return null;
  })();

  if(showNotificationsScreen) return (
    <NotificationsPanel
      notifications={notifications}
      onBack={()=>setShowNotificationsScreen(false)}
      onMarkAllRead={markAllNotificationsRead}
    />
  );
  if (showPriceStatsScreen) {
    return (
      <PriceStatsScreen
        lists={lists}
        onBack={() => setShowPriceStatsScreen(false)}
        getPriceStatsSummary={getPriceStatsSummary}
        normalizeCacheKey={normalizeCacheKey}
        formatBRL={formatBRL}
      />
    );
  }

  // Login leve e isolado: evita renderizar toda a tela principal por baixo do modal.
  // Isso deixa o campo clicável imediatamente no smartphone e elimina a sensação de tela bloqueada.
  if (userNameModal) {
    return (
      <LoginScreen
        sharedLandingRecord={sharedLandingRecord}
        userNameInput={userNameInput}
        setUserNameInput={setUserNameInput}
        userPinInput={userPinInput}
        setUserPinInput={setUserPinInput}
        userPinConfirmInput={userPinConfirmInput}
        setUserPinConfirmInput={setUserPinConfirmInput}
        normalizePin={normalizePin}
        submitAuthForm={submitAuthForm}
        authCheckingName={authCheckingName}
        isRecoverPinMode={isRecoverPinMode}
        setIsRecoverPinMode={setIsRecoverPinMode}
        isFirstAccessMode={isFirstAccessMode}
        loading={loading}
        toast={toast}
      />
    );
  }

  const visibleLists = mergeUniqueLists(Array.isArray(lists) ? lists : []);

  const recentLists = visibleLists.slice(0,1);
  const historyLists = visibleLists.slice(1);

  const shouldIgnoreSwipeTarget=(target)=>{
    try{
      const el=target;
      if(!el || !el.closest)return false;
      return Boolean(el.closest("input, textarea, select, button, [role='button'], a"));
    }catch{return false;}
  };

  const goBackBySwipe=()=>{
    if(itemDialog || extraModal || confirmDelete || shareModal || showFinished || showGuidedTour)return false;
    if(screen==="list"){
      archiveFinishedListsBeforeHome();
      showToast("↩️ Voltando para o início", 1200);
      return true;
    }
    if(screen==="create"){
      archiveFinishedListsBeforeHome();
      showToast("↩️ Voltando para o início", 1200);
      return true;
    }
    if(screen==="pantry_create" || screen==="pantry_review"){
      setScreen("create");
      showToast("↩️ Voltando para a lista", 1200);
      return true;
    }
    return false;
  };

  const goForwardBySwipe=()=>{
    if(itemDialog || extraModal || confirmDelete || shareModal || showFinished || showGuidedTour)return false;
    if(screen==="home"){
      setScreen("create");
      showToast("🛒 Nova lista", 1200);
      return true;
    }
    if(screen==="create"){
      if(pendingItems.length>0){
        organizeList();
        return true;
      }
      showToast("Adicione itens antes de avançar", 1500);
      return false;
    }
    return false;
  };

  const handleSwipeStart=(e)=>{
    if(shouldIgnoreSwipeTarget(e.target))return;
    const touch=e.touches?.[0];
    if(!touch)return;
    swipeStartRef.current={x:touch.clientX,y:touch.clientY,t:Date.now(),active:true};
  };

  const handleSwipeEnd=(e)=>{
    const start=swipeStartRef.current;
    if(!start?.active)return;
    swipeStartRef.current={x:0,y:0,t:0,active:false};
    const touch=e.changedTouches?.[0];
    if(!touch)return;
    const dx=touch.clientX-start.x;
    const dy=touch.clientY-start.y;
    const absX=Math.abs(dx);
    const absY=Math.abs(dy);
    const elapsed=Date.now()-start.t;

    // Só reconhece gesto horizontal claro; ignora rolagem vertical e diagonais.
    if(absX<90 || absX<absY*1.55 || elapsed>900)return;

    if(dx>0)goBackBySwipe();
    else goForwardBySwipe();
  };

  return(
    <div
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      style={{width:"100%",maxWidth:430,minWidth:0,margin:"0 auto",minHeight:"100vh",background:"linear-gradient(180deg,#EEF2FF 0%,#F8FAFC 34%,#FFFFFF 100%)",fontFamily:"Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",position:"relative",overflowX:"hidden",boxSizing:"border-box",touchAction:"pan-y"}}
    >
      <AppHeader
        userName={getAppUserName()}
        onSwitchUser={handleSwitchUser}
        onNotifications={()=>setShowNotificationsScreen(true)}
        unreadCount={unreadNotificationsCount}
      />

      <AnalyticsController
        screen={screen}
        currentList={currentList}
        showPriceStatsScreen={showPriceStatsScreen}
        showNotificationsScreen={showNotificationsScreen}
        showGuidedTour={showGuidedTour}
        userName={getAppUserName()}
        registerEvent={registrarEvento}
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
      <ToastMessage message={toast.msg} />

      <AppUpdateController
        getCurrentAppAssetSignature={getCurrentAppAssetSignature}
        fetchFreshAppAssetSignature={fetchFreshAppAssetSignature}
        clearAppCachesBeforeReload={clearAppCachesBeforeReload}
        registerEvent={registrarEvento}
        checkIntervalMs={APP_UPDATE_CHECK_INTERVAL_MS}
      />

      {/* AVISO PARA ADICIONAR À TELA INICIAL */}
      <InstallPrompt
  show={showInstallNotice}
  isStandalone={isAppRunningStandalone()}
  getInstallPlatform={getInstallPlatform}
  installApp={installApp}
  installAvailable={installAvailable}
  closeInstallNotice={closeInstallNotice}
  AppLogo={AppLogo}
/>


      <SharedSyncController
        screen={screen}
        currentList={currentList}
        isRealSharedList={isRealSharedList}
        getListSyncStamp={getListSyncStamp}
        autoSyncNoticeRef={autoSyncNoticeRef}
        onRefresh={refreshSharedListFromCloud}
      />

      <GuidedTourController
        show={showGuidedTour}
        step={guidedTourStep}
        externalRect={tourItemRect}
        userNameModal={userNameModal}
        index={guidedTourLocalIndex}
        total={guidedTourLocalTotal}
        onNext={nextGuidedTourStep}
        onPrev={prevGuidedTourStep}
        onClose={() => finishGuidedTour("done")}
        onSkip={() => finishGuidedTour("skip")}
        screen={screen}
      />

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
<HomeScreen>
        <div style={{display:"flex",flexDirection:"column",minHeight:"100dvh",width:"100%",maxWidth:"100%",overflowX:"hidden",boxSizing:"border-box",background:"linear-gradient(160deg,#f5f0ff 0%,#faf8ff 40%,#f0f4ff 100%)",position:"relative"}}>

          <HomeBanner
  onStartTour={() => startGuidedTour("home")}
  onOpenCompras={() => setScreen("create")}
  isTourStep={isTourStep}
/>


            <ListsSection
              lists={lists}
              visibleLists={visibleLists}
              recentLists={recentLists}
              historyLists={historyLists}
              showHistory={showHistory}
              setShowHistory={setShowHistory}
              listMenuId={listMenuId}
              setListMenuId={setListMenuId}
              setCurrentList={setCurrentList}
              setScreen={setScreen}
              setSearch={setSearch}
              setCollapsedCats={setCollapsedCats}
              formatListDate={formatListDate}
              getListOriginMeta={getListOriginMeta}
              isListFinished={isListFinished}
              openListForEdit={openListForEdit}
              setShareTargetList={setShareTargetList}
              setShareModal={setShareModal}
              duplicateList={duplicateList}
              stopListSharing={stopListSharing}
              setConfirmDelete={setConfirmDelete}
              getListCardStats={getListCardStats}
              fmtR={fmtR}
              WhatsAppIcon={WhatsAppIcon}
              rebuildLocalPriceHistoryFromLists={rebuildLocalPriceHistoryFromLists}
              setShowPriceStatsScreen={setShowPriceStatsScreen}
              shareAppWhatsApp={shareAppWhatsApp}
            />
     </div>
        </HomeScreen>
)}


      {/* CONFIRM DELETE */}
      <ConfirmDeleteModal
        open={Boolean(confirmDelete)}
        title="Excluir lista?"
        message="Essa ação remove a lista deste aparelho e não pode ser desfeita."
        onCancel={()=>setConfirmDelete(null)}
        onConfirm={()=>deleteList(confirmDelete)}
      />

      <ConfirmDeleteModal
        open={Boolean(confirmDeleteAction)}
        title={confirmDeleteAction?.title || "Excluir?"}
        message={confirmDeleteAction?.message || "Essa ação não pode ser desfeita."}
        onCancel={()=>setConfirmDeleteAction(null)}
        onConfirm={()=>{
          const action=confirmDeleteAction?.onConfirm;
          setConfirmDeleteAction(null);
          if(typeof action==="function") action();
        }}
      />

      {/* ════════════════════════════════════
          CREATE
      ════════════════════════════════════ */}
      {screen==="create"&&(
        <CreateListScreen
          archiveFinishedListsBeforeHome={archiveFinishedListsBeforeHome}
          setPendingItems={setPendingItems}
          setCurrentInput={setCurrentInput}
          setEditingListId={setEditingListId}
          setPantryCompared={setPantryCompared}
          setPantryComparison={setPantryComparison}
          listName={listName}
          setListName={setListName}
          listNameConfirmed={listNameConfirmed}
          setListNameConfirmed={setListNameConfirmed}
          listNameSavedPulse={listNameSavedPulse}
          triggerListNameSavedPulse={triggerListNameSavedPulse}
          startGuidedTour={startGuidedTour}
          activePantry={activePantry}
          removeActivePantry={removeActivePantry}
          shareActivePantry={shareActivePantry}
          pantryShareStatus={pantryShareStatus}
          formatPantryDate={formatPantryDate}
          countCategoryItems={countCategoryItems}
          openPantryViewer={openPantryViewer}
          openPantryEditor={openPantryEditor}
          openPantryCreator={openPantryCreator}
          budgetText={budgetText}
          setBudgetText={setBudgetText}
          maskBRLInput={maskBRLInput}
          budgetConfirmed={budgetConfirmed}
          setBudgetConfirmed={setBudgetConfirmed}
          budgetSavedPulse={budgetSavedPulse}
          triggerBudgetSavedPulse={triggerBudgetSavedPulse}
          listType={listType}
          setListType={setListType}
          LIST_TYPES={LIST_TYPES}
          listTypeConfig={getListTypeConfig(listType)}
          listTypeSuggestions={getListTypeSuggestions(listType)}
          currentInput={currentInput}
          handleAddItem={handleAddItem}
          setPasteTarget={setPasteTarget}
          setShowPasteModal={setShowPasteModal}
          voiceTargetRef={voiceTargetRef}
          setVoiceTarget={setVoiceTarget}
          startVoiceInput={startVoiceInput}
          voiceProcessing={voiceProcessing}
          voiceListening={voiceListening}
          pendingItems={pendingItems}
          formatQtyUnit={formatQtyUnit}
          editPendingItem={editPendingItem}
          pantryCompared={pantryCompared}
          editingListId={editingListId}
          compareWithActivePantry={compareWithActivePantry}
          organizeList={organizeList}
          organizeListKeepOrder={organizeListKeepOrder}
          loading={loading}
          isTourStep={isTourStep}
          tourHighlightStyle={tourHighlightStyle}
          onShowPhotoModal={()=>setShowPhotoModal(true)}
        />
      )}

      <PantrySection
        screen={screen}
        setScreen={setScreen}
        pantryPendingItems={pantryPendingItems}
        setPantryPendingItems={setPantryPendingItems}
        resetPantryFlow={resetPantryFlow}
        pantryInput={pantryInput}
        setPantryInput={setPantryInput}
        handleAddPantryItem={handleAddPantryItem}
        inp={inp}
        lbl={lbl}
        createCard={createCard}
        createSecondaryBtn={createSecondaryBtn}
        createPrimaryBtn={createPrimaryBtn}
        setPasteTarget={setPasteTarget}
        setShowPasteModal={setShowPasteModal}
        voiceTargetRef={voiceTargetRef}
        setVoiceTarget={setVoiceTarget}
        startVoiceInput={startVoiceInput}
        voiceProcessing={voiceProcessing}
        voiceListening={voiceListening}
        tourHighlightStyle={tourHighlightStyle}
        isTourStep={isTourStep}
        formatQtyUnit={formatQtyUnit}
        editPantryPendingItem={editPantryPendingItem}
        organizePantry={organizePantry}
        loading={loading}
        leavePantryReview={leavePantryReview}
        pantryReviewReadOnly={pantryReviewReadOnly}
        pantryReviewCategories={pantryReviewCategories}
        getCatTheme={getCatTheme}
        editPantryReviewItem={editPantryReviewItem}
        handleAddPantryReviewItem={handleAddPantryReviewItem}
        removePantryReviewItem={removePantryReviewItem}
        savePantryFromReview={savePantryFromReview}
        pantryEditingId={pantryEditingId}
        pantryComparison={pantryComparison}
        pendingItems={pendingItems}
        showPantryComparisonDetails={showPantryComparisonDetails}
        setShowPantryComparisonDetails={setShowPantryComparisonDetails}
        proceedAfterPantryComparison={proceedAfterPantryComparison}
      />

      <ProductEditorModal
        itemDialog={itemDialog}
        setItemDialog={setItemDialog}
        setItemDialogMode={setItemDialogMode}
        setEditPendingIdx={setEditPendingIdx}
        setCurrentInput={setCurrentInput}
        itemDialogMode={itemDialogMode}
        dlgLoading={dlgLoading}
        dlgConfig={dlgConfig}
        editPendingIdx={editPendingIdx}
        lbl={lbl}
        inp={inp}
        changeManualQty={changeManualQty}
        qBtn={qBtn}
        formatManualQty={formatManualQty}
        dlgQty={dlgQty}
        setManualQtyFromText={setManualQtyFromText}
        setDlgQty={setDlgQty}
        getManualQtyStep={getManualQtyStep}
        getManualDialogUnits={getManualDialogUnits}
        handleManualUnitChange={handleManualUnitChange}
        chip={chip}
        normalizeUnitValue={normalizeUnitValue}
        dlgUnit={dlgUnit}
        formatUnitForQuantity={formatUnitForQuantity}
        getManualSizeOptions={getManualSizeOptions}
        setDlgPeso={setDlgPeso}
        setDlgVolume={setDlgVolume}
        dlgPeso={dlgPeso}
        dlgVolume={dlgVolume}
        setManualSize={setManualSize}
        buildManualPreview={buildManualPreview}
        btnGr={btnGr}
        confirmDialog={confirmDialog}
        exPrice={exPrice}
        setExPrice={setExPrice}
        formatMoneyInput={formatMoneyInput}
        parseBRL={parseBRL}
        getExtraPriceInputLabel={getExtraPriceInputLabel}
        getCategoryForExtraItem={getCategoryForExtraItem}
        listType={currentList?.type || listType}
      />

      {/* ════════════════════════════════════
          LIST SCREEN
      ════════════════════════════════════ */}
      {screen==="list"&&currentList&&(
        <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF 0%,#F8FAFC 48%,#FFFFFF 100%)"}}>
          <ListScreenHeader
            currentList={currentList}
            listType={currentList?.type || listType || "mercado"}
            checkedItems={checkedItems}
            totalItems={totalItems}
            fullTotal={fullTotal}
            budget={budget}
            budgetDiff={budgetDiff}
            budgetPctLabel={budgetPctLabel}
            progressColor={progressColor}
            pct={pct}
            showFinished={showFinished}
            onBackHome={archiveFinishedListsBeforeHome}
            onShare={() => { setShareTargetList(currentList); setShareModal(true); }}
            isTourStep={isTourStep}
            tourHighlightStyle={tourHighlightStyle}
            WhatsAppIcon={WhatsAppIcon}
            fmtR={fmtR}
          />

          <SharedStatusPanel
            currentList={currentList}
            checkedItems={checkedItems}
            totalItems={totalItems}
            originText={(() => {
              const originMeta = getListOriginMeta(currentList);
              return originMeta ? originMeta.text : "";
            })()}
            sharedUpdateNotice={sharedUpdateNotice}
            sharedSyncing={sharedSyncing}
            onRefresh={refreshSharedListFromCloud}
            formatRelativeSyncTime={formatRelativeSyncTime}
          />

          {/* Search */}
          <div style={{padding:"0 20px",margin:"-4px 0 10px"}}>
            <button onClick={()=>startGuidedTour("list")} style={{width:"100%",border:"1px solid #DDD6FE",background:"#F5F3FF",color:"#5B21B6",borderRadius:999,padding:"10px 12px",fontSize:12,fontWeight:950,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 20px rgba(109,40,217,0.10)"}}>✨ Guia rápido desta tela</button>
          </div>
          {/* Card integrado: orçamento excedido */}
          {budget>0&&budgetDiff!==null&&budgetDiff<0&&(()=>{
            const suggs = getSuggestions();
            const preview = suggs.slice(0, 3);
            return (
              <div data-tour-step="list_budget_alert" style={{padding:"0 20px",margin:"12px 0 10px"}}>
                <div style={{
                  background:"linear-gradient(135deg,#FFF7ED 0%,#FEF2F2 100%)",
                  border:"1px solid #FDBA74",
                  borderRadius:24,
                  boxShadow:"0 14px 34px rgba(234,88,12,0.10)",
                  overflow:"hidden"
                }}>
                  <button
                    type="button"
                    onClick={()=>setShowSuggestions(s=>!s)}
                    style={{
                      width:"100%",
                      border:"none",
                      background:"transparent",
                      padding:"14px 15px",
                      display:"flex",
                      alignItems:"center",
                      gap:12,
                      cursor:"pointer",
                      fontFamily:"inherit",
                      textAlign:"left"
                    }}
                  >
                    <div style={{
                      width:38,
                      height:38,
                      borderRadius:16,
                      background:"#FFEDD5",
                      border:"1px solid #FDBA74",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      fontSize:19,
                      flexShrink:0
                    }}>
                      ⚠️
                    </div>

                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:950,fontSize:14,color:"#9A3412"}}>
                        Orçamento ultrapassado em {fmtR(Math.abs(budgetDiff))}
                      </div>
                      <div style={{fontSize:12,color:"#C2410C",fontWeight:750,marginTop:2,lineHeight:1.35}}>
                        {suggs.length>0
                          ? `${suggs.length} sugestão${suggs.length>1?"ões":""} para voltar ao planejado`
                          : "Assim que houver itens comprados, o app sugere ajustes"}
                      </div>
                    </div>

                    <span style={{
                      fontSize:14,
                      color:"#C2410C",
                      fontWeight:950,
                      transform:showSuggestions?"rotate(180deg)":"rotate(0)",
                      transition:"transform 0.2s",
                      display:"inline-block"
                    }}>
                      ▾
                    </span>
                  </button>

                  {!showSuggestions && preview.length>0 && (
                    <div style={{padding:"0 15px 14px 65px",display:"flex",gap:7,flexWrap:"wrap"}}>
                      {preview.map((s,i)=>(
                        <span key={i} style={{
                          fontSize:11,
                          fontWeight:900,
                          color:"#9A3412",
                          background:"#FFFFFF",
                          border:"1px solid #FED7AA",
                          borderRadius:999,
                          padding:"5px 8px",
                          maxWidth:"100%",
                          overflow:"hidden",
                          textOverflow:"ellipsis",
                          whiteSpace:"nowrap"
                        }}>
                          {s.tipo==="remover"?"Remover":"Reduzir"} {s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {showSuggestions&&(
                    <div style={{borderTop:"1px solid #FED7AA",background:"rgba(255,255,255,0.72)"}}>
                      {suggs.length===0 ? (
                        <div style={{padding:"12px 15px 15px",fontSize:13,color:"#9A3412",fontWeight:750,lineHeight:1.4}}>
                          Nenhum item comprado ainda para sugerir ajuste. Continue registrando preços para o app calcular alternativas.
                        </div>
                      ) : (
                        <>
                          <div style={{padding:"11px 15px 5px",fontSize:11,fontWeight:950,color:"#9A3412",textTransform:"uppercase",letterSpacing:"0.45px"}}>
                            Sugestões priorizando itens supérfluos e extras
                          </div>

                          {suggs.map(({ci,ii,name,qty,price,tipo,catName,economy},i)=>(
                            <div key={i} style={{
                              display:"grid",
                              gridTemplateColumns:"minmax(0,1fr) auto",
                              gap:10,
                              alignItems:"center",
                              padding:"10px 15px",
                              borderTop:i===0?"none":"1px solid #FFEDD5"
                            }}>
                              <div style={{minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0,flexWrap:"wrap"}}>
                                  <span style={{fontWeight:900,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>
                                    {name}
                                  </span>
                                  <span style={{
                                    fontSize:10,
                                    fontWeight:950,
                                    color:tipo==="remover"?"#B91C1C":"#92400E",
                                    background:tipo==="remover"?"#FEE2E2":"#FEF3C7",
                                    border:"1px solid "+(tipo==="remover"?"#FCA5A5":"#FCD34D"),
                                    borderRadius:999,
                                    padding:"3px 7px"
                                  }}>
                                    {tipo==="remover"?"Remover":"Reduzir"}
                                  </span>
                                </div>
                                <div style={{fontSize:11,color:"#9A3412",fontWeight:750,marginTop:3}}>
                                  {catName} • economia estimada {fmtR(economy || price || 0)}
                                </div>
                              </div>

                              {tipo==="remover" ? (
                                <button
                                  type="button"
                                  onClick={()=>{
                                    const l=JSON.parse(JSON.stringify(currentList));
                                    if(!l.categories?.[ci]?.items?.[ii]) return;
                                    l.categories[ci].items.splice(ii,1);
                                    if(l.categories[ci].items.length===0)l.categories.splice(ci,1);
                                    updateList(l);returnToSearch();showToast("🗑 "+name+" removido");
                                  }}
                                  style={{
                                    padding:"8px 11px",
                                    borderRadius:12,
                                    border:"1px solid #FCA5A5",
                                    background:"#FEF2F2",
                                    color:"#B91C1C",
                                    fontWeight:900,
                                    fontSize:12,
                                    cursor:"pointer",
                                    fontFamily:"inherit",
                                    whiteSpace:"nowrap"
                                  }}
                                >
                                  Remover
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={()=>{
                                    const l=JSON.parse(JSON.stringify(currentList));
                                    const it=l.categories?.[ci]?.items?.[ii];
                                    if(!it)return;
                                    if(it.originalQty==null)it.originalQty=Number(it.qty||1);
                                    it.qty=Math.max(1,Math.floor(Number(it.qty||1)-1));
                                    it.qtyAdjusted=Number(it.qty||0)!==Number(it.originalQty||0);
                                    updateList(l);returnToSearch();showToast("➖ Quantidade reduzida: "+name);
                                  }}
                                  style={{
                                    padding:"8px 11px",
                                    borderRadius:12,
                                    border:"1px solid #FCD34D",
                                    background:"#FFFBEB",
                                    color:"#92400E",
                                    fontWeight:900,
                                    fontSize:12,
                                    cursor:"pointer",
                                    fontFamily:"inherit",
                                    whiteSpace:"nowrap"
                                  }}
                                >
                                  Reduzir
                                </button>
                              )}
                            </div>
                          ))}

                          <div style={{padding:"8px 15px 12px",fontSize:11,color:"#C2410C",fontWeight:700,lineHeight:1.35}}>
                            O card permanece aqui até o total voltar ao orçamento programado.
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div data-tour-step="list_search">
          <SearchBar
            searchRef={searchRef}
            search={search}
            setSearch={setSearch}
            inputStyle={{ ...inp({ padding: "12px 16px 12px 42px", borderRadius: 180 }) }}
            highlightStyle={tourHighlightStyle(isTourStep("list_search"))}
          />
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
              const LIST_SOFT_BY_TYPE={"mercado":"#F5F3FF","supermercado":"#F5F3FF","festa":"#FFF7ED","eventos":"#FFF7ED","construcao":"#FFFBEB","eletrico":"#EFF6FF","escolar":"#F0FDF4","farmacia":"#FDF2F8","condominio":"#EFF6FF","outros":"#F9FAFB"};
              const listSoft=LIST_SOFT_BY_TYPE[currentList?.type||"mercado"]||"#F5F3FF";
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
                <div key={ci} style={getPremiumSectionStyle(theme,{isExtraCat,allDone,listThemeSoft:listSoft})}>
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

                        const isFP=`${item.name}||${item.unit}||${item.qty}`===globalFirstPendingKey;
                        return(
                          <ItemRow
                            key={`${ci}-${realII}-${item.name || "item"}`}
                            rowRef={isFP ? tourItemRef : null}
                            item={item}
                            ci={ci}
                            ii={ii}
                            realII={realII}
                            theme={theme}
                            isExtra={isExtra}
                            isHighlighted={hl}
                            isLast={isLast}
                            currentList={currentList}
                            searchActive={Boolean(search)}
                            onOpenItem={(catIndex,itemIndex)=>{openItemModal(catIndex,itemIndex);if(search)setSearch("");}}
                            onToggleCheck={(catIndex,itemIndex)=>{toggleCheck(catIndex,itemIndex);if(search)setSearch("");}}
                            onToggleNotFound={toggleNotFound}
                            showToast={showToast}
                            formatQtyUnit={formatQtyUnit}
                            getItemLineTotal={getItemLineTotal}
                            getCompactUnitPriceLabel={getCompactUnitPriceLabel}
                            fmtR={fmtR}
                            hexToRgba={hexToRgba}
                            PriceMonthBadge={PriceMonthBadge}
                            PriceMemoryLine={PriceMemoryLine}
                            isFirstItem={`${item.name}||${item.unit}||${item.qty}`===globalFirstPendingKey}
                            priceHighlightStyle={isTourStep("list_item_price") && ii===0 ? tourHighlightStyle(true) : {}}
                            checkHighlightStyle={isTourStep("list_item_check") && ii===0 ? tourHighlightStyle(true) : {}}
                            missingHighlightStyle={isTourStep("list_item_missing") && ii===0 ? tourHighlightStyle(true) : {}}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div data-tour-step="list_extra_item" style={{position:"relative"}}>
         <FloatingActions
  onAddExtraItem={() => setExtraModal(true)}
  highlightExtraItem={isTourStep("list_extra_item")}
  themeGradient={(() => {
    const t = currentList?.type || listType || "mercado";
    const TMAP = {
      mercado:"#4C1D95,#6D28D9,#8B5CF6", supermercado:"#4C1D95,#6D28D9,#8B5CF6",
      eventos:"#9A3412,#EA580C,#FB923C", festa:"#9A3412,#EA580C,#FB923C",
      construcao:"#78350F,#B45309,#D97706", eletrico:"#1E3A8A,#1D4ED8,#3B82F6",
      escolar:"#14532D,#15803D,#22C55E", farmacia:"#831843,#BE185D,#EC4899",
      condominio:"#0B3559,#0F4C75,#3282B8", outros:"#1F2937,#374151,#6B7280",
    };
    const c = TMAP[t] || TMAP.mercado;
    return `linear-gradient(135deg, ${c.split(",")[0]} 0%, ${c.split(",")[1]} 45%, ${c.split(",")[2]} 100%)`;
  })()}
/>
          </div>
        </div>
      )}

      {/* MODAL: ITEM */}
      {itemModal&&currentList&&(()=>{
        const item=currentList.categories[itemModal.ci]?.items[itemModal.ii];
        if(!item)return null;
        const theme=getCatTheme(currentList.categories[itemModal.ci]?.name);
        const effectiveItem={...item,name:mEditName || item.name,unit:mUnit || item.unit,qty:numberFromText(mQtyText)||Number(mQty||1)||1};
        const inferredMode=mPriceMode || inferPriceModeForUnit(effectiveItem.unit,effectiveItem) || item.priceMode || inferDefaultPriceMode(effectiveItem);
        const qtyOriginal=Number(item.originalQty ?? item.qty ?? 1);
        const qtyAtual=numberFromText(mQtyText) || Number(mQty||1) || 1;
        const qtyChanged=Number(qtyAtual)!==Number(qtyOriginal);
        const tempPrice=parseBRL(mPriceText);
        const estimatedProduceWeight=getEstimatedProduceWeight({...effectiveItem,qty:qtyAtual});
        const manualWeight=numberFromText(mWeightText);
        const temp={...effectiveItem,price:tempPrice,priceMode:inferredMode,purchaseWeightKg:manualWeight||item.purchaseWeightKg||estimatedProduceWeight?.estimatedKg};
        const total=tempPrice!=null?getItemLineTotal(temp):0;
        const unitLabel=getPriceLabelForModeAndUnit(inferredMode,effectiveItem.unit);
        return(
          <ModalSheet onClose={()=>setItemModal(null)}>
            <div className="tnl-keyboard-safe-modal">
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,flexWrap:"wrap",fontWeight:900,fontSize:18,color:"#111827",marginBottom:4}}>
                <span>{item.extra || item.addedDuringPurchase ? "➕" : "🛒"}</span>
                <span>{mEditName || item.name}</span>
                {(item.extra || item.addedDuringPurchase) && (
                  <span style={{fontSize:10,fontWeight:900,color:"#C2410C",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:999,padding:"4px 8px"}}>EXTRA</span>
                )}
              </div>
              <div style={{fontSize:13,color:"#6B7280"}}>{currentList.categories[itemModal.ci]?.name}</div>
            </div>

            <button
              type="button"
              onClick={()=>setMShowEditDetails(v=>!v)}
              style={{width:"100%",marginBottom:12,padding:"11px 12px",borderRadius:16,border:"1px solid #E5E7EB",background:"#F9FAFB",color:"#4B5563",fontWeight:900,fontSize:13,fontFamily:"inherit",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
            >
              <span>⚙️ Editar nome e unidade</span>
              <span>{mShowEditDetails ? "▴" : "▾"}</span>
            </button>

            {mShowEditDetails && (
              <div style={{marginBottom:14,background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:18,padding:12}}>
                <label style={lbl}>Nome do item</label>
                <input className="tnl-keyboard-safe-field" value={mEditName} onChange={e=>setMEditName(e.target.value)} placeholder={`Nome do item de ${getListTypeConfig(currentList?.type || listType).label.toLowerCase()}`} style={inp({height:50,fontWeight:800})} />

                <div style={{height:12}} />

                <label style={lbl}>Unidade de medida</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {getAllowedPurchaseUnits().map((u)=>(
                    <button
                      type="button"
                      key={u}
                      onClick={()=>{
                        const normalized=normalizeUnitValue(u);
                        setMUnit(normalized);
                        setMPriceMode(inferPriceModeForUnit(normalized,effectiveItem));
                        if(["kg","litro"].includes(normalized)){
                          const current=numberFromText(mQtyText)||Number(mQty)||1;
                          setMQty(current);
                          setMQtyText(formatQtyDisplay(current));
                        }
                      }}
                      style={{border:"1px solid "+(normalizeUnitValue(mUnit)===normalizeUnitValue(u)?theme.border:"#E5E7EB"),background:normalizeUnitValue(mUnit)===normalizeUnitValue(u)?theme.bg:"#FFFFFF",color:normalizeUnitValue(mUnit)===normalizeUnitValue(u)?theme.header:"#374151",borderRadius:999,padding:"8px 11px",fontSize:12,fontWeight:900,fontFamily:"inherit",cursor:"pointer"}}
                    >
                      {formatUnitForQuantity(Number(mQtyText?.replace(",",".")||1),u)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{marginBottom:14,background:qtyChanged?"#EEF2FF":"#F9FAFB",border:`1px solid ${qtyChanged?"#A78BFA":"#E5E7EB"}`,borderRadius:18,padding:12,boxShadow:qtyChanged?"0 0 0 4px rgba(124,58,237,0.08)":"none",transition:"all 0.2s"}}>
              <label style={{...lbl,marginBottom:10}}>Quantidade</label>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>{const step=["kg","litro"].includes(normalizeUnitValue(mUnit))?0.5:1;const next=Math.max(step,Math.round(((numberFromText(mQtyText)||Number(mQty)||step)-step)*1000)/1000);setMQty(next);setMQtyText(formatQtyDisplay(next));}} style={qBtn}>−</button>
                <input value={mQtyText} onChange={e=>{const txt=normalizeDecimalInput(e.target.value);setMQtyText(txt);const v=numberFromText(txt);if(v!=null&&v>0)setMQty(v);}} inputMode="decimal" style={{...inp({textAlign:"center",fontWeight:900,fontSize:20,padding:"10px 8px",borderColor:qtyChanged?"#A78BFA":"#E5E7EB"}),width:112}} />
                <button onClick={()=>{const step=["kg","litro"].includes(normalizeUnitValue(mUnit))?0.5:1;const next=Math.round(((numberFromText(mQtyText)||Number(mQty)||0)+step)*1000)/1000;setMQty(next);setMQtyText(formatQtyDisplay(next));}} style={qBtn}>＋</button>
                <span style={{fontSize:14,color:"#6B7280",marginLeft:4}}>{formatUnitForQuantity(qtyAtual,mUnit||item.unit||"unidade")}</span>
              </div>
              {qtyChanged&&<div style={{fontSize:12,color:"#4C1D95",fontWeight:800,marginTop:8}}>Quantidade original alterada.</div>}
            </div>

            {inferredMode==="perKg" && !["kg","g"].includes(normalizeUnitForCalc(mUnit||item.unit)) && (
              <div style={{marginBottom:14}}>
                <label style={lbl}>Peso total comprado em kg</label>
                {estimatedProduceWeight && (
                  <div style={{marginBottom:8,background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:14,padding:"9px 11px",fontSize:12,color:"#166534",fontWeight:800,lineHeight:1.35}}>
                    Peso estimado: {estimatedProduceWeight.estimatedKg.toFixed(2).replace(".",",")} kg
                    <br/>Faixa provável: {estimatedProduceWeight.minTotalKg.toFixed(2).replace(".",",")} kg a {estimatedProduceWeight.maxTotalKg.toFixed(2).replace(".",",")} kg
                    <br/><span style={{fontWeight:700}}>Ajuste manualmente se souber o peso real.</span>
                  </div>
                )}
                <input value={mWeightText} onChange={e=>setMWeightText(e.target.value.replace(/[^0-9.,]/g,""))} placeholder={estimatedProduceWeight?`Estimado: ${estimatedProduceWeight.estimatedKg.toFixed(2).replace(".",",")} kg`:"Ex: 0,700 ou 1,2"} inputMode="decimal"
                  style={inp()} onFocus={e=>e.target.style.borderColor=theme.border} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
              </div>
            )}

            <div style={{marginBottom:16}}>
              <label style={lbl}>{unitLabel}</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:800,color:"#6B7280",fontSize:16,pointerEvents:"none"}}>R$</span>
                <input className="tnl-keyboard-safe-field" ref={priceInputRef} value={mPriceText} onChange={e=>setMPriceText(formatMoneyInput(e.target.value))}
                  placeholder="0,00" inputMode="numeric"
                  style={inp({paddingLeft:44,fontWeight:900,fontSize:18,textAlign:"left",caretColor:theme.header})}
                  onFocus={e=>{e.target.style.borderColor=theme.border;try{e.target.setSelectionRange(String(mPriceText||"").length,String(mPriceText||"").length);}catch{}}} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
              </div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:6}}>Digite apenas números. Ex.: 800 vira R$ 8,00.</div>
              {tempPrice!=null&&mPriceText&&(<div style={{marginTop:10,fontSize:13,fontWeight:900,color:theme.header,background:theme.bg,border:`1px solid ${theme.border}40`,borderRadius:14,padding:"10px 12px",display:"flex",justifyContent:"space-between",gap:12}}>
                <span>Total calculado</span><span>{fmtR(total)}</span>
              </div>)}
              {tempPrice!=null&&mPriceText&&<PriceMonthBadge itemName={mEditName||item.name} price={tempPrice} recordedAt={item.priceRecordedAt || null} listId={currentList?.id} itemId={item.id || item.name} />}
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{
                const itemName = item?.name || "item";
                setConfirmDeleteAction({
                  title:"Excluir item?",
                  message:`Deseja excluir "${itemName}" da lista? Essa ação não pode ser desfeita.`,
                  onConfirm: removeItem,
                });
              }} style={{padding:"14px 18px",borderRadius:18,background:"#FEE2E2",border:"none",color:"#B91C1C",fontWeight:800,fontSize:16,cursor:"pointer"}}>🗑</button>
              <button onClick={confirmItem}
                style={{flex:1,padding:14,borderRadius:18,background:`linear-gradient(135deg,${theme.border},${theme.header})`,border:"none",color:"white",fontWeight:800,fontSize:15,fontFamily:"inherit",cursor:"pointer"}}>
                {mPriceText.trim()?"Confirmar compra":"Salvar alterações"}
              </button>
            </div>
            </div>
          </ModalSheet>
        );
      })()}

      {/* MODAL: EXTRA */}
      {extraModal&&(()=>{
        const correctedExtraName = smartNormalizeProductName(exName);
        const showCorrection = exName.trim() && correctedExtraName && normalizePlainText(correctedExtraName) !== normalizePlainText(exName);
        const startExtraFlow = () => {
          const name = (showCorrection ? correctedExtraName : exName).trim();
          if (!name) return;
          setExPrice("");
          openProductDialog(name, null, {mode:"extra"});
          setExtraModal(false);
        };
        return (
        <ModalSheet onClose={()=>setExtraModal(false)}>
          <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4,textAlign:"center"}}>Adicionar item extra</div>
          <div style={{fontSize:13,color:"#6B7280",marginBottom:18,textAlign:"center"}}>Digite o item extra. Se ele já foi comprado, informe o preço na próxima etapa para entrar marcado como adquirido.</div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Item</label>
            <input value={exName} onChange={e=>setExName(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&exName.trim()){startExtraFlow();}}}
              placeholder={getListTypeConfig(currentList?.type || listType).placeholder}
              style={inp()} onFocus={e=>e.target.style.borderColor="#FF7043"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
            {showCorrection&&(
              <button
                type="button"
                onClick={()=>setExName(correctedExtraName)}
                style={{marginTop:10,width:"100%",border:"1px solid #FED7AA",background:"#FFF7ED",color:"#C2410C",borderRadius:14,padding:"10px 12px",fontWeight:900,fontSize:13,fontFamily:"inherit",cursor:"pointer",textAlign:"left"}}
              >
                Você quis dizer: {correctedExtraName}?
              </button>
            )}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setExtraModal(false)} style={{...btnGr,flex:1}}>Cancelar</button>
            <button onClick={startExtraFlow}
              disabled={!exName.trim()}
              style={{flex:1.4,padding:14,borderRadius:18,background:exName.trim()?"linear-gradient(135deg,#F97316,#EA580C)":"#F0F2F5",border:"none",color:exName.trim()?"white":"#6B7280",fontSize:15,fontWeight:800,cursor:exName.trim()?"pointer":"default",fontFamily:"inherit"}}>
              Inserir
            </button>
          </div>
        </ModalSheet>
        );
      })()}

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
      <SharedListModal
        open={shareModal}
        senderName={senderName}
        onClose={()=>{setShareModal(false);setShareTargetList(null);}}
        onSenderNameChange={(value)=>{setSenderName(value);setUserNameInput(value);saveAppUserName(value);}}
        onShareWhatsApp={async()=>{const saved=getAppUserName();const clean=saveAppUserName(senderName||saved);if(!clean){showToast("⚠️ Informe seu nome antes de enviar a lista.");return;}await registerAppUser(clean);const l=shareTargetList||currentList;setShareModal(false);setShareTargetList(null);shareWhatsApp(l);}}
      />


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
      {showPasteModal && (
  <PasteModal
    open={showPasteModal}
    onClose={() => setShowPasteModal(false)}
    pasteText={pasteText}
    setPasteText={setPasteText}
    parsePastedText={parsePastedText}
    placeholder={pasteTarget === "pantry"
      ? "- Arroz\n- Feijão\n- Leite\n- Detergente"
      : getListTypeConfig(listType).placeholder}
  />
)}


      {/* ── MODAL: LER FOTO DA LISTA ── */}
      {showPhotoModal && (
  <PhotoModal
    open={showPhotoModal}
    listType={listType}
    ocrLoading={ocrLoading}
    ocrProgress={ocrProgress}
    ocrFileName={ocrFileName}
    ocrText={ocrText}
    setOcrText={setOcrText}
    onClose={() => setShowPhotoModal(false)}
    onFileChange={handlePhotoListFile}
    onImport={() => importTextAsPendingItems(ocrText, {closePhoto: true})}
  />
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
        <button onClick={() => reuseList(reuseModal)} style={{ ...btnG }}>
  🔁 Usar como base
</button>
</ModalSheet>
)}
     
   

       </div>
  );
}
