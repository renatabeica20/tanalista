const API_URL = "https://api.anthropic.com/v1/messages";

export async function classificarItem(nomeItem) {
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
Classifique o item abaixo em JSON válido.

Item: "${nomeItem}"

Responda SOMENTE com JSON.

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

    // 🔍 texto retornado pela IA
    const texto = data?.content?.[0]?.text || "";

    // 🔥 extrai JSON mesmo que venha com texto junto
    const match = texto.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("JSON não encontrado na resposta da IA");
    }

    let json;

    try {
      json = JSON.parse(match[0]);
    } catch {
      throw new Error("JSON inválido retornado pela IA");
    }

    return json;

  } catch (error) {
    console.error("Erro na classificação:", error);
    return null;
  }
}
