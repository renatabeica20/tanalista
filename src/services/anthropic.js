const API_URL = "https://api.anthropic.com/v1/messages";

// 🔥 CLASSIFICAÇÃO LOCAL (rápida e confiável)
function classificarLocal(nome) {
  const item = nome.toLowerCase();

  if (item.includes("arroz") || item.includes("feijão")) {
    return {
      categoria: "mercearia",
      tipo: "alimento",
      subtipo: "grãos"
    };
  }

  if (item.includes("macarrão")) {
    return {
      categoria: "mercearia",
      tipo: "alimento",
      subtipo: "massas"
    };
  }

  if (item.includes("leite")) {
    return {
      categoria: "laticínios",
      tipo: "bebida",
      subtipo: "leite"
    };
  }

  return null;
}

export async function classificarItem(nomeItem) {
  // ✅ tenta primeiro local
  const local = classificarLocal(nomeItem);
  if (local) return local;

  // 🌐 fallback IA
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `
Responda SOMENTE com JSON válido.

Item: "${nomeItem}"

Formato:
{
  "categoria": "string",
  "tipo": "string",
  "subtipo": "string"
}
`
          }
        ]
      })
    });

    const data = await response.json();
    const texto = data?.content?.[0]?.text || "";

    const match = texto.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("JSON não encontrado");
    }

    return JSON.parse(match[0]);

  } catch (error) {
    console.error("Erro IA:", error);

    // 🔥 fallback final (evita erro no app)
    return {
      categoria: "outros",
      tipo: "outros",
      subtipo: "outros"
    };
  }
}
