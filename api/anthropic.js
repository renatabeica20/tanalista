// api/anthropic.js — Vercel Serverless Function
// Suporta chamadas de texto E visão (imagem/foto)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor." });
  }

  const { prompt, system, maxTokens = 1024, model = "claude-3-5-haiku-latest", image } = req.body || {};

  if (!prompt) return res.status(400).json({ error: "prompt é obrigatório." });

  // ── Montar conteúdo da mensagem ──────────────────────────────────────
  let messageContent;

  if (image && image.data && image.mediaType) {
    // Chamada com VISÃO — envia imagem + texto
    messageContent = [
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
    // Chamada de TEXTO simples
    messageContent = [{ type: "text", text: prompt }];
  }

  const requestBody = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: messageContent }],
  };

  if (system) requestBody.system = system;

  // ── Chamar API Anthropic ─────────────────────────────────────────────
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error("Anthropic API error:", JSON.stringify(data));
      return res.status(upstream.status).json({
        error: data?.error?.message || "Erro na API Anthropic",
        detail: data,
      });
    }

    const text = data?.content?.[0]?.text || "";

    // ── Extrair JSON da resposta ─────────────────────────────────────
    let json = null;
    try {
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      json = JSON.parse(cleaned);
    } catch {
      // Tentar encontrar objeto JSON no meio do texto
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { json = JSON.parse(match[0]); } catch { /* noop */ }
      }
    }

    return res.status(200).json({ text, json });

  } catch (err) {
    console.error("Erro interno no proxy Anthropic:", err);
    return res.status(500).json({ error: "Erro interno: " + err.message });
  }
}
