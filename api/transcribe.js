export const config = {
  api: {
    bodyParser: false,
  },
};

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readRequestBuffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function filenameFromHeaders(req, contentType) {
  const rawName = req.headers["x-audio-filename"] || "";
  try {
    const decoded = decodeURIComponent(String(rawName || ""));
    if (decoded && /\.[a-z0-9]{2,5}$/i.test(decoded)) return decoded;
  } catch {}

  const type = String(contentType || "").toLowerCase();
  if (type.includes("mp4")) return "lista-voz.m4a";
  if (type.includes("aac")) return "lista-voz.aac";
  if (type.includes("wav")) return "lista-voz.wav";
  if (type.includes("mpeg") || type.includes("mp3")) return "lista-voz.mp3";
  if (type.includes("ogg")) return "lista-voz.ogg";
  return "lista-voz.webm";
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return sendJson(res, 500, { error: "OPENAI_API_KEY não configurada no Vercel." });
    }

    const buffer = await readRequestBuffer(req);
    if (!buffer || buffer.length < 1000) {
      return sendJson(res, 400, { error: "Áudio vazio ou muito curto." });
    }

    const contentType = req.headers["content-type"] || "audio/webm";
    const filename = filenameFromHeaders(req, contentType);

    const formData = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    formData.append("file", blob, filename);
    formData.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1");
    formData.append("language", req.headers["x-audio-language"] || "pt");
    formData.append("response_format", "json");
    formData.append(
      "prompt",
      "Lista de compras em português do Brasil. Preserve quantidades decimais como 1,5 kg, unidades, marcas, embalagens, pesos e volumes. Não transforme 1,5 em 5. Preserve expressões como fardo com 24 unidades."
    );

    const openaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await openaiRes.json().catch(() => ({}));

    if (!openaiRes.ok) {
      return sendJson(res, openaiRes.status, {
        error: data?.error?.message || "Erro ao transcrever áudio na OpenAI.",
        details: data,
      });
    }

    return sendJson(res, 200, { text: data?.text || "" });
  } catch (error) {
    console.error("Erro em /api/transcribe:", error);
    return sendJson(res, 500, {
      error: "Erro interno na transcrição.",
      details: error?.message || String(error),
    });
  }
}
