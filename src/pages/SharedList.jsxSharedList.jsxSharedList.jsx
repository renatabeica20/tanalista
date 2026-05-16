import { useEffect, useState, useCallback } from "react";
import { subscribeToSharedList, registerSharedListEvent } from "../services/sharedListService";

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

function getSessionFromStorage() {
  try {
    // Tenta ler a sessão do localStorage — mesmo esquema usado pelo App.jsx
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
    // Suporta ?lista=ID (formato atual do app)
    const fromQuery = url.searchParams.get("lista");
    if (fromQuery) return decodeURIComponent(fromQuery);
    // Suporta /l/ID (formato de path direto)
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
  const [importSuccess, setImportSuccess] = useState(false);

  const sharedId = getSharedIdFromUrl();

  // ── Carrega a lista do Supabase ──────────────────────────────────────────
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

  // ── Registra evento "list_opened" ao carregar ─────────────────────────────
  useEffect(() => {
    if (!record || eventSent.opened) return;
    const recipientName = getRecipientName();
    registerSharedListEvent(sharedId, "list_opened", recipientName).catch(() => null);
    setEventSent(prev => ({ ...prev, opened: true }));
  }, [record, sharedId, eventSent.opened]);

  // ── Sincronização em tempo real dos itens ─────────────────────────────────
  useEffect(() => {
    if (!sharedId || !record) return;
    const unsubscribe = subscribeToSharedList(sharedId, (updatedRecord) => {
      setRecord(updatedRecord);
    });
    return unsubscribe;
  }, [sharedId, record]);

  // ── Abre o app principal se usuário já tem sessão ─────────────────────────
  // Redireciona para a raiz com o parâmetro de lista — o App.jsx detecta
  // o parâmetro, lê a sessão existente e importa sem pedir login.
  const openInApp = useCallback(() => {
    if (!sharedId) return;

    if (hasValidSession()) {
      // Usuário já logado: redireciona direto sem pedir login novamente
      const target = `/?lista=${encodeURIComponent(sharedId)}`;
      window.location.href = target;
    } else {
      // Sem sessão: redireciona para o app que vai pedir nome/PIN
      window.location.href = `/?lista=${encodeURIComponent(sharedId)}`;
    }
  }, [sharedId]);

  // ── Registra evento "shopping_started" ───────────────────────────────────
  const handleStartShopping = useCallback(() => {
    if (!eventSent.started) {
      const recipientName = getRecipientName();
      registerSharedListEvent(sharedId, "shopping_started", recipientName).catch(() => null);
      setEventSent(prev => ({ ...prev, started: true }));
    }
    openInApp();
  }, [sharedId, eventSent.started, openInApp]);

  // ── Importa lista sem abrir o app (abre na tela raiz com parâmetro) ──────
  const handleImport = useCallback(() => {
    setImportSuccess(true);
    setTimeout(() => openInApp(), 800);
  }, [openInApp]);

  // ─── RENDERIZAÇÃO ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}>⏳</div>
          <p style={styles.loadingText}>Carregando lista...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
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
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Cabeçalho */}
        <div style={styles.header}>
          <div style={styles.avatarCircle}>📋</div>
          <h2 style={styles.listName}>{listName}</h2>
          <p style={styles.senderText}>
            Enviado por <strong>{remetente}</strong>
          </p>
        </div>

        {/* Progresso */}
        {totalItems > 0 && (
          <div style={styles.progressBox}>
            <div style={styles.progressLabel}>
              {checkedItems}/{totalItems} itens adquiridos · {progressPct}%
            </div>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? "linear-gradient(90deg,#16A34A,#22C55E)"
                    : "linear-gradient(90deg,#6D28D9,#8B5CF6)",
                }}
              />
            </div>
          </div>
        )}

        {/* Itens por categoria */}
        {categories.length > 0 ? (
          <div style={styles.categoriesWrapper}>
            {categories.map((cat, ci) => (
              <div key={ci} style={styles.categoryBlock}>
                <div style={styles.categoryTitle}>{cat.name}</div>
                {(cat.items || []).map((item, ii) => (
                  <div
                    key={ii}
                    style={{
                      ...styles.itemRow,
                      opacity: item.checked || item.notFound ? 0.5 : 1,
                    }}
                  >
                    <span style={styles.itemCheck}>
                      {item.notFound ? "❌" : item.checked ? "✅" : "⬜"}
                    </span>
                    <span style={{
                      ...styles.itemName,
                      textDecoration: item.checked ? "line-through" : "none",
                    }}>
                      {item.name}
                    </span>
                    {item.qty && item.qty !== 1 && (
                      <span style={styles.itemQty}>{item.qty} {item.unit || ""}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#9CA3AF", fontSize: 14, textAlign: "center", margin: "16px 0" }}>
            Nenhum item encontrado na lista.
          </p>
        )}

        {/* Ações */}
        <div style={styles.actions}>
          {importSuccess ? (
            <div style={styles.successMsg}>✅ Abrindo no app...</div>
          ) : (
            <>
              <button onClick={handleStartShopping} style={styles.btnPrimary}>
                🛒 Fazer as compras juntos
              </button>
              <button onClick={handleImport} style={styles.btnSecondary}>
                📲 Importar para meu app
              </button>
              <button onClick={() => window.location.href = "/"} style={styles.btnGhost}>
                Continuar sem importar
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const styles = {
  container: {
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
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    fontSize: 36,
    width: 68,
    height: 68,
    borderRadius: 20,
    background: "linear-gradient(135deg,#F5F3FF,#DDD6FE)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    border: "1px solid rgba(167,139,250,0.4)",
  },
  listName: {
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
    margin: "0 0 6px",
    textAlign: "center",
    letterSpacing: "-0.015em",
  },
  senderText: {
    fontSize: 14,
    color: "#6B7280",
    margin: 0,
    textAlign: "center",
  },
  progressBox: {
    background: "#F9FAFB",
    borderRadius: 16,
    padding: "12px 14px",
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#4B5563",
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    background: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },
  categoriesWrapper: {
    maxHeight: 340,
    overflowY: "auto",
    marginBottom: 20,
    borderRadius: 16,
    border: "1px solid #F3F4F6",
  },
  categoryBlock: {
    padding: "10px 14px",
    borderBottom: "1px solid #F3F4F6",
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 900,
    color: "#6D28D9",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 0",
  },
  itemCheck: {
    fontSize: 14,
    flexShrink: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: 600,
    flexShrink: 0,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  btnPrimary: {
    width: "100%",
    padding: "16px",
    borderRadius: 18,
    background: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
    border: "none",
    color: "white",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 8px 20px -6px rgba(109,40,217,0.45)",
  },
  btnSecondary: {
    width: "100%",
    padding: "14px",
    borderRadius: 18,
    background: "#F5F3FF",
    border: "1.5px solid rgba(167,139,250,0.5)",
    color: "#6D28D9",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnGhost: {
    width: "100%",
    padding: "12px",
    borderRadius: 16,
    background: "transparent",
    border: "none",
    color: "#9CA3AF",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  successMsg: {
    textAlign: "center",
    fontWeight: 800,
    color: "#16A34A",
    fontSize: 15,
    padding: "14px",
  },
  spinner: {
    fontSize: 36,
    textAlign: "center",
    marginBottom: 12,
    animation: "pulse 1.5s infinite",
  },
  loadingText: {
    color: "#6B7280",
    fontWeight: 600,
    fontSize: 14,
    textAlign: "center",
    margin: 0,
  },
};
