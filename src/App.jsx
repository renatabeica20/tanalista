import { useState, useEffect } from "react";

// ── CONFIG SUPABASE ─────────────────────────────
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

// ── USUÁRIO ─────────────────────────────
const USER_KEY = "tnl_user_name";
const DEVICE_KEY = "tnl_device_id";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function getUserName() {
  return localStorage.getItem(USER_KEY);
}

function setUserName(name) {
  localStorage.setItem(USER_KEY, name);
}

async function registrarUsuario(nome) {
  try {
    const device_id = getDeviceId();

    await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: "POST",
      headers: supabaseHeaders({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        nome,
        device_id
      })
    });
  } catch (e) {
    console.warn("Erro ao registrar usuário:", e);
  }
}

// ── APP ─────────────────────────────
export default function App() {

  const [userName, setUserNameState] = useState(getUserName() || "");
  const [showUserModal, setShowUserModal] = useState(!getUserName());

  // ── TELA DE CADASTRO SIMPLES ─────────────────
  if (showUserModal) {
    return (
      <div style={{ padding: 20 }}>
        <h2>👋 Bem-vindo ao Tá na Lista</h2>
        <p>Como podemos te chamar?</p>

        <input
          value={userName}
          onChange={(e) => setUserNameState(e.target.value)}
          placeholder="Seu nome"
          style={{ padding: 10, width: "100%", marginBottom: 10 }}
        />

        <button
          onClick={async () => {
            if (!userName.trim()) return;

            setUserName(userName);
            await registrarUsuario(userName);
            setShowUserModal(false);
          }}
          style={{
            padding: 10,
            width: "100%",
            background: "#4CAF50",
            color: "#fff",
            border: "none",
            borderRadius: 6
          }}
        >
          Continuar
        </button>
      </div>
    );
  }

  // ── APP NORMAL ─────────────────
  return (
    <div style={{ padding: 20 }}>
      <h1>🛒 Tá na Lista</h1>

      <p>
        Olá, <strong>{getUserName() || "Usuário"}</strong>
      </p>

      <p>Seu aplicativo continua funcionando normalmente aqui.</p>
    </div>
  );
}
