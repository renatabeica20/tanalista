import { useEffect, useState } from "react";

export default function SharedList() {
  const [data, setData] = useState(null);

  const id = window.location.pathname.split("/l/")[1];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/get-list?id=${id}`);
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      }
    }

    if (id) load();
  }, [id]);

  if (!data) {
    return <div style={{ padding: 20 }}>Carregando lista...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📋 Lista recebida</h2>

      <p><strong>Enviado por:</strong> {data.remetente || "Não informado"}</p>

      <ul>
        {data.data?.items?.map((item, i) => (
          <li key={i}>
            {item.name} - {item.qty || 1}
          </li>
        ))}
      </ul>

      <br />

      <button onClick={() => window.location.href = "/"}>
        Continuar sem instalar
      </button>

      <br /><br />

      <button onClick={() => alert("Instale o app para melhor experiência")}>
        📲 Abrir no app
      </button>
    </div>
  );
}
