import { useEffect, useState, useCallback } from "react";
import { subscribeToSharedList, registerSharedListEvent } from "../services/sharedListService";

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

function getSessionFromStorage() {
  try {
    const name = localStorage.getItem("tnl_user_name") ||
                 localStorage.getItem("app_user_name") || "";
    const userId = localStorage.getItem("tnl_user_id") ||
                   localStorage.getItem("app_user_id") || "";
    const deviceId = localStorage.getItem("tnl_device_id") ||
                     localStorage.getItem("app_device_id") || "";
    const registered = localStorage.getItem("tnl_user_registered") === "1";
    return { name: name.trim(), userId: userId.trim(), deviceId: deviceId.trim(), registered };
  } catch {
    return { name: "", userId: "", deviceId: "", registered: false };
  }
}

function hasValidSession() {
  const { name, userId, deviceId, registered } = getSessionFromStorage();
  return Boolean(name && (userId || deviceId || registered));
}

function getRecipientName() {
  return getSessionFromStorage().name || "";
}

function getSharedIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get("lista");
    if (fromQuery) return decodeURIComponent(fromQuery);
    const match = url.pathname.match(/\/(?:l|lista)\/([^/]+)/);
    if (match) return match[1];
    return null;
  } catch {
    return null;
  }
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function SharedList() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventSent, setEventSent] = useState({ opened: false, started: false });
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [importing, setImporting] = useState(false);

  const sharedId = getSharedIdFromUrl();
  const userHasSession = hasValidSession();

  // ── Carrega a lista ───────────────────────────────────────────────────────
  const loadRecord = useCallback(async () => {
    if (!sharedId) {
      setError("Link inválido. Nenhuma lista encontrada na URL.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/get-list?id=${encodeURIComponent(sharedId)}`);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();
      if (!json || (!json.data && !json.title)) throw new Error("Lista não encontrada.");
      setRecord(json);
    } catch (err) {
      setError("Não foi possível carregar a lista. Verifique o link e tente novamente.");
      console.warn("SharedList load error:", err);
    } finally {
      setLoading(false);
    }
  }, [sharedId]);

  useEffect(() => { loadRecord(); }, [loadRecord]);

  // ── Abre o pop-up assim que a lista carrega ───────────────────────────────
  useEffect(() => {
    if (record && !loading) {
      setShowChoiceModal(true);
    }
  }, [record, loading]);

  // ── Registra evento "list_opened" ─────────────────────────────────────────
  useEffect(() => {
    if (!record || eventSent.opened) return;
    registerSharedListEvent(sharedId, "list_opened", getRecipientName()).catch(() => null);
    setEventSent(prev => ({ ...prev, opened: true }));
  }, [record, sharedId, eventSent.opened]);

  // ── Sincronização em tempo real ───────────────────────────────────────────
  useEffect(() => {
    if (!sharedId || !record) return;
    const unsubscribe = subscribeToSharedList(sharedId, setRecord);
    return unsubscribe;
  }, [sharedId, record]);

  // ── Importa e abre o app ──────────────────────────────────────────────────
  const handleImport = useCallback(() => {
    setImporting(true);
    if (!eventSent.started) {
      registerSharedListEvent(sharedId, "shopping_started", getRecipientName()).catch(() => null);
      setEventSent(prev => ({ ...prev, started: true }));
    }
    setTimeout(() => {
      window.location.href = `/?lista=${encodeURIComponent(sharedId)}`;
    }, 500);
  }, [sharedId, eventSent.started]);

  // ── Visualiza sem importar ────────────────────────────────────────────────
  const handleViewOnly = useCallback(() => {
    setShowChoiceModal(false);
  }, []);

  // ─── LOADING / ERRO ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>⏳</div>
          <p style={s.loadingText}>Carregando lista...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 40, marginBottom: 12, textAlign: "center" }}>⚠️</div>
          <p style={{ color: "#EF4444", fontWeight: 700, fontSize: 15, textAlign: "center" }}>{error}</p>
        </div>
      </div>
    );
  }

  const listData = record?.data || {};
  const remetente = listData.ownerName || listData.remetente || record?.remetente || "Alguém";
  const listName = listData.name || record?.title || "Lista de compras";
  const categories = Array.isArray(listData.categories) ? listData.categories : [];
  const allItems = categories.flatMap(c => Array.isArray(c.items) ? c.items : []);
  const totalItems = allItems.length;
  const checkedItems = allItems.filter(i => i.checked || i.notFound).length;
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div style={s.page}>

      {/* ── BOTTOM SHEET DE ESCOLHA ──────────────────────────────────────── */}
      {showChoiceModal && (
        <div style={s.overlay}>
          <div style={s.sheet}>

            {/* Handle */}
            <div style={s.handle} />

            {/* Ícone */}
            <div style={s.sheetIcon}>📋</div>

            {/* Título */}
            <div style={s.sheetTitle}>Lista recebida!</div>

            {/* Subtítulo */}
            <div style={s.sheetSubtitle}>
              <strong>{remetente}</strong> compartilhou{" "}
              <strong>"{listName}"</strong> com você
              {totalItems > 0 && (
                <span style={s.sheetBadge}>
                  {totalItems} {totalItems === 1 ? "item" : "itens"}
                  {listData.budget > 0
                    ? ` · R$ ${Number(listData.budget).toFixed(2).replace(".", ",")}`
                    : ""}
                </span>
              )}
            </div>

            {/* Botão principal — importar */}
            <button
              onClick={handleImport}
              disabled={importing}
              style={{ ...s.btnImport, opacity: importing ? 0.75 : 1 }}
            >
              {importing
                ? "Abrindo no app..."
                : `📲 ${userHasSession ? "Importar para meu app" : "Abrir no Tá na Lista"}`}
            </button>

            {/* Botão secundário — visualizar sem importar */}
            <button onClick={handleViewOnly} style={s.btnViewOnly}>
              👁️ Visualizar sem importar
            </button>

            {/* Nota */}
            <p style={s.sheetNote}>
              {userHasSession
                ? "Ao importar, a lista entra no seu app e sincroniza em tempo real."
                : "Ao abrir, você faz um cadastro rápido e acompanha a lista."}
            </p>

          </div>
        </div>
      )}

      {/* ── VISUALIZAÇÃO DA LISTA ─────────────────────────────────────────── */}
      <div style={s.card}>

        <div style={s.header}>
          <div style={s.avatar}>📋</div>
          <h2 style={s.listName}>{listName}</h2>
          <p style={s.senderText}>Enviado por <strong>{remetente}</strong></p>
        </div>

        {totalItems > 0 && (
          <div style={s.progressBox}>
            <div style={s.progressLabel}>
              {checkedItems}/{totalItems} itens · {pct}%
            </div>
            <div style={s.track}>
              <div style={{
                ...s.fill,
                width: `${pct}%`,
                background: pct === 100
                  ? "linear-gradient(90deg,#16A34A,#22C55E)"
                  : "linear-gradient(90deg,#6D28D9,#8B5CF6)",
              }} />
            </div>
          </div>
        )}

        {categories.length > 0 ? (
          <div style={s.catWrapper}>
            {categories.map((cat, ci) => (
              <div key={ci} style={s.catBlock}>
                <div style={s.catTitle}>{cat.name}</div>
                {(cat.items || []).map((item, ii) => (
                  <div key={ii} style={{ ...s.itemRow, opacity: item.checked || item.notFound ? 0.45 : 1 }}>
                    <span style={s.itemCheck}>
                      {item.notFound ? "❌" : item.checked ? "✅" : "⬜"}
                    </span>
                    <span style={{ ...s.itemName, textDecoration: item.checked ? "line-through" : "none" }}>
                      {item.name}
                    </span>
                    {item.qty && item.qty !== 1 && (
                      <span style={s.itemQty}>{item.qty} {item.unit || ""}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#9CA3AF", fontSize: 14, textAlign: "center", margin: "16px 0" }}>
            Nenhum item encontrado.
          </p>
        )}

        <div style={s.actions}>
          <button onClick={handleImport} style={s.btnPrimary}>
            📲 Importar para meu app
          </button>
          <button onClick={() => window.location.href = "/"} style={s.btnGhost}>
            Abrir o Tá na Lista
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(160deg,#F5F3FF 0%,#EDE9FE 50%,#DDD6FE 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "24px 16px 48px",
    boxSizing: "border-box",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px -10px rgba(109,40,217,0.18)",
  },
  loadingText: {
    color: "#6B7280", fontWeight: 600, fontSize: 14, textAlign: "center", margin: 0,
  },
  // bottom sheet
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    background: "#FFFFFF",
    borderRadius: "28px 28px 0 0",
    padding: "12px 24px 48px",
    width: "100%", maxWidth: 480,
    boxShadow: "0 -8px 40px rgba(109,40,217,0.16)",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  handle: {
    width: 40, height: 4, borderRadius: 99,
    background: "#E5E7EB", marginBottom: 20,
  },
  sheetIcon: { fontSize: 48, marginBottom: 8 },
  sheetTitle: {
    fontSize: 22, fontWeight: 900, color: "#111827",
    letterSpacing: "-0.02em", marginBottom: 8, textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 15, color: "#4B5563", textAlign: "center",
    lineHeight: 1.55, marginBottom: 16, fontWeight: 500,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  },
  sheetBadge: {
    display: "inline-block",
    background: "#F5F3FF", color: "#6D28D9",
    fontWeight: 800, fontSize: 13,
    borderRadius: 99, padding: "4px 14px",
  },
  btnImport: {
    width: "100%", padding: "17px 16px", borderRadius: 20,
    background: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
    border: "none", color: "white", fontWeight: 900, fontSize: 16,
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 10px 28px -6px rgba(109,40,217,0.45)",
    marginBottom: 10, transition: "opacity 0.2s",
  },
  btnViewOnly: {
    width: "100%", padding: "15px 16px", borderRadius: 20,
    background: "#F9FAFB", border: "1.5px solid #E5E7EB",
    color: "#374151", fontWeight: 800, fontSize: 15,
    cursor: "pointer", fontFamily: "inherit", marginBottom: 14,
  },
  sheetNote: {
    fontSize: 12, color: "#9CA3AF", textAlign: "center",
    lineHeight: 1.5, margin: 0, fontWeight: 500,
  },
  // lista
  header: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 },
  avatar: {
    fontSize: 36, width: 68, height: 68, borderRadius: 20,
    background: "linear-gradient(135deg,#F5F3FF,#DDD6FE)",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 12, border: "1px solid rgba(167,139,250,0.4)",
  },
  listName: {
    fontSize: 20, fontWeight: 900, color: "#111827",
    margin: "0 0 6px", textAlign: "center", letterSpacing: "-0.015em",
  },
  senderText: { fontSize: 14, color: "#6B7280", margin: 0, textAlign: "center" },
  progressBox: { background: "#F9FAFB", borderRadius: 16, padding: "12px 14px", marginBottom: 16 },
  progressLabel: { fontSize: 12, fontWeight: 700, color: "#4B5563", marginBottom: 8 },
  track: { height: 8, background: "#E5E7EB", borderRadius: 999, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999, transition: "width 0.4s ease" },
  catWrapper: { maxHeight: 340, overflowY: "auto", marginBottom: 20, borderRadius: 16, border: "1px solid #F3F4F6" },
  catBlock: { padding: "10px 14px", borderBottom: "1px solid #F3F4F6" },
  catTitle: { fontSize: 11, fontWeight: 900, color: "#6D28D9", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  itemRow: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0" },
  itemCheck: { fontSize: 14, flexShrink: 0 },
  itemName: { fontSize: 14, fontWeight: 600, color: "#111827", flex: 1 },
  itemQty: { fontSize: 12, color: "#9CA3AF", fontWeight: 600, flexShrink: 0 },
  actions: { display: "flex", flexDirection: "column", gap: 10 },
  btnPrimary: {
    width: "100%", padding: "16px", borderRadius: 18,
    background: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
    border: "none", color: "white", fontWeight: 900, fontSize: 15,
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 8px 20px -6px rgba(109,40,217,0.45)",
  },
  btnGhost: {
    width: "100%", padding: "12px", borderRadius: 16,
    background: "transparent", border: "none",
    color: "#9CA3AF", fontWeight: 700, fontSize: 13,
    cursor: "pointer", fontFamily: "inherit",
  },
};
