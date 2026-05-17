import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SharedList from './pages/SharedList.jsx'

// ─── ROTEADOR SIMPLES ─────────────────────────────────────────────────────────
// Detecta se a URL tem ?lista= com &preview=1 OU se é um usuário sem sessão.
// Se sim, renderiza o SharedList (página de visualização/escolha).
// Caso contrário, renderiza o App normalmente.
//
// O SharedList cuida do seu próprio fluxo:
//   - Mostra o pop-up de escolha para todos
//   - "Importar" → redireciona para /?lista=ID (sem preview=1) → App importa
//   - "Visualizar" → fecha o pop-up e mostra a lista no navegador
// ─────────────────────────────────────────────────────────────────────────────

function hasValidSession() {
  try {
    const name = (
      localStorage.getItem("tnl_user_name") ||
      localStorage.getItem("app_user_name") ||
      ""
    ).trim();
    const userId = (localStorage.getItem("tnl_user_id") || "").trim();
    const deviceId = (localStorage.getItem("tnl_device_id") || "").trim();
    const registered = localStorage.getItem("tnl_user_registered") === "1";
    return Boolean(name && (userId || deviceId || registered));
  } catch {
    return false;
  }
}

function getRouteComponent() {
  try {
    const url = new URL(window.location.href);
    const listaId = url.searchParams.get("lista");
    const isPreview = url.searchParams.get("preview") === "1";

    // Rota SharedList: tem ?lista= com &preview=1
    // Isso garante que quem chega pelo link do WhatsApp vê o pop-up de escolha
    if (listaId && isPreview) {
      return <SharedList />;
    }

    // Para todos os outros casos (sem preview, ou sem lista), usa o App normal
    return <App />;
  } catch {
    return <App />;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {getRouteComponent()}
  </React.StrictMode>,
)
