// api/anthropic.js — Vercel Serverless Function
// Suporta tanto chamadas de texto quanto de visão (imagem)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor." });
  }

  const { prompt, system, maxTokens = 1024, model = "claude-3-5-haiku-latest", image } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "prompt é obrigatório." });
  }

  // Montar o conteúdo da mensagem
  let content;
  if (image && image.data && image.mediaType) {
    // Chamada com visão (foto da lista)
    content = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: image.mediaType,
          data: image.data,
        },
      },
      {
        type: "text",
        text: prompt,
      },
    ];
  } else {
    // Chamada de texto simples
    content = prompt;
  }

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content }],
  };

  if (system) {
    body.system = system;
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error("Anthropic API error:", data);
      return res.status(upstream.status).json({ error: data?.error?.message || "Erro na API Anthropic" });
    }

    const text = data?.content?.[0]?.text || "";

    // Tentar extrair JSON da resposta
    let json = null;
    try {
      // Remover markdown se houver
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      json = JSON.parse(cleaned);
    } catch {
      // Tentar encontrar JSON no texto
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { json = JSON.parse(match[0]); } catch { /* noop */ }
      }
    }

    return res.status(200).json({ text, json });
  } catch (err) {
    console.error("Erro no proxy Anthropic:", err);
    return res.status(500).json({ error: "Erro interno: " + err.message });
  }
}
