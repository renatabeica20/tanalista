// Classificação local rápida para itens comuns — sem chamada de rede
function classificarLocal(nome) {
  const item = nome.toLowerCase();

  if (item.includes("arroz") || item.includes("feijão")) {
    return { categoria: "mercearia", tipo: "alimento", subtipo: "grãos" };
  }
  if (item.includes("macarrão")) {
    return { categoria: "mercearia", tipo: "alimento", subtipo: "massas" };
  }
  if (item.includes("leite")) {
    return { categoria: "laticínios", tipo: "bebida", subtipo: "leite" };
  }

  return null;
}

export async function classificarItem(nomeItem) {
  // Tenta classificação local primeiro — sem custo e sem risco
  const local = classificarLocal(nomeItem);
  if (local) return local;

  // Fallback: chama /api/anthropic (função serverless da Vercel)
  // A chave da Anthropic fica protegida no servidor — nunca exposta no browser.
  try {
    const res = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        maxTokens: 200,
        prompt: `Responda SOMENTE com JSON válido, sem texto adicional.

Item: "${nomeItem}"

Formato obrigatório:
{
  "categoria": "string",
  "tipo": "string",
  "subtipo": "string"
}`,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const texto = data?.text || "";
    const match = texto.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON não encontrado");

    return JSON.parse(match[0]);
  } catch (error) {
    console.error("Erro ao classificar item via IA:", error);
    return { categoria: "outros", tipo: "outros", subtipo: "outros" };
  }
}
