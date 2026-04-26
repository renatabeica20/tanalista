// api/anthropic.js — Vercel Serverless Function
// Suporta texto E visão (imagem/foto)
// Configuração: adicione ANTHROPIC_API_KEY nas variáveis de ambiente do Vercel

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada. Adicione nas variáveis de ambiente do Vercel." });
  }

  const { prompt, system, maxTokens = 1024, model = "claude-3-5-haiku-latest", image } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Campo 'prompt' obrigatório." });

  // ── Montar conteúdo ──────────────────────────────────────────────────
  let messageContent;
  if (image && image.data && image.mediaType) {
    // Visão: imagem + texto
    messageContent = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: image.mediaType,
          data: image.data,
        },
      },
      { type: "text", text: prompt },
    ];
  } else {
    // Texto simples
    messageContent = [{ type: "text", text: prompt }];
  }

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: messageContent }],
  };
  if (system) body.system = system;

  // ── Chamar Anthropic ─────────────────────────────────────────────────
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
      console.error("Anthropic error:", data);
      return res.status(upstream.status).json({
        error: data?.error?.message || "Erro Anthropic " + upstream.status,
        type: data?.error?.type,
      });
    }

    const text = data?.content?.[0]?.text || "";

    // Extrair JSON
    let json = null;
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    try {
      json = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) { try { json = JSON.parse(m[0]); } catch {} }
    }

    return res.status(200).json({ text, json });

  } catch (err) {
    console.error("Erro proxy:", err);
    return res.status(500).json({ error: err.message });
  }
}
