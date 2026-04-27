import { useState, useEffect } from "react";

// 🔗 SUPABASE CONFIG (já existente no seu código)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function supabaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function getSharedListRecord(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/shared_lists?id=eq.${id}&select=*`,
    { headers: supabaseHeaders() }
  );
  const data = await res.json();
  return data[0] || null;
}

// ─────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────
export default function App() {

  // 🔥 NOVO: controle de lista compartilhada
  const [sharedList, setSharedList] = useState(null);
  const [loadingShared, setLoadingShared] = useState(false);

  // 🔍 DETECTA URL /l/ID
  useEffect(() => {
    const path = window.location.pathname;

    if (path.startsWith("/l/")) {
      const id = path.split("/l/")[1];

      if (id) {
        setLoadingShared(true);

        getSharedListRecord(id)
          .then((data) => {
            if (data?.data) {
              setSharedList(data);
            }
          })
          .catch(() => {
            setSharedList(null);
          })
          .finally(() => {
            setLoadingShared(false);
          });
      }
    }
  }, []);

  // ⏳ CARREGANDO
  if (loadingShared) {
    return <div style={{ padding: 20 }}>Carregando lista...</div>;
  }

  // 📋 TELA DE LISTA RECEBIDA
  if (sharedList) {
    const lista = sharedList.data;

    return (
      <div style={{ padding: 20 }}>
        <h2>📋 Lista recebida</h2>

        <p>
          <strong>Enviado por:</strong>{" "}
          {sharedList.remetente || "Não informado"}
        </p>

        <ul>
          {lista.items?.map((item, i) => (
            <li key={i}>
              {item.name} - {item.qty || 1}
            </li>
          ))}
        </ul>

        <br />

        <button onClick={() => (window.location.href = "/")}>
          Continuar sem instalar
        </button>

        <br /><br />

        <button onClick={() => alert("Abra no app para melhor experiência")}>
          📲 Abrir no app
        </button>
      </div>
    );
  }

  // 🏠 APP NORMAL (SEU APP CONTINUA AQUI)
  return (
    <div style={{ padding: 20 }}>
      <h1>🛒 Tá na Lista</h1>
      <p>Seu app continua funcionando normalmente aqui.</p>
    </div>
  );
}
