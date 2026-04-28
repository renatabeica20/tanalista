export const config = {
  api: {
    bodyParser: false,
  },
};

function json(res, status, payload) {
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

function parseMultipart(buffer, contentType) {
  const boundaryMatch = String(contentType || "").match(/boundary=(?:(?:"([^"]+)")|([^;]+))/i);
  if (!boundaryMatch) throw new Error("Boundary multipart não encontrado.");
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];

  let cursor = buffer.indexOf(boundaryBuffer);
  while (cursor !== -1) {
    const next = buffer.indexOf(boundaryBuffer, cursor + boundaryBuffer.length);
    if (next === -1) break;

    let part = buffer.slice(cursor + boundaryBuffer.length, next);
    if (part.slice(0, 2).toString() === "\r\n") part = part.slice(2);
    if (part.slice(-2).toString() === "\r\n") part = part.slice(0, -2);
    if (part.length && part.toString("utf8", 0, 2) !== "--") parts.push(part);
    cursor = next;
  }

  const fields = {};
  const files = {};

  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;

    const rawHeaders = part.slice(0, headerEnd).toString("utf8");
    let body = part.slice(headerEnd + 4);
    if (body.slice(-2).toString() === "\r\n") body = body.slice(0, -2);

    const nameMatch = rawHeaders.match(/name="([^"]+)"/i);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const filenameMatch = rawHeaders.match(/filename="([^"]*)"/i);
    const contentTypeMatch = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i);

    if (filenameMatch) {
      files[name] = {
        filename: filenameMatch[1] || "audio.webm",
        contentType: (contentTypeMatch?.[1] || "application/octet-stream").trim(),
        buffer: body,
      };
    } else {
      fields[name] = body.toString("utf8");
    }
  }

  return { fields, files };
}

function guessFilename(filename, contentType) {
  const clean = String(filename || "").trim();
  if (clean && /\.[a-z0-9]{2,5}$/i.test(clean)) return clean;
  const type = String(contentType || "").toLowerCase();
  if (type.includes("mp4")) return "lista-voz.m4a";
  if (type.includes("aac")) return "lista-voz.aac";
  if (type.includes("wav")) return "lista-voz.wav";
  if (type.includes("mpeg")) return "lista-voz.mp3";
  return "lista-voz.webm";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Método não permitido." });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json(res, 500, { error: "OPENAI_API_KEY não configurada no Vercel." });
    }

    const contentType = req.headers["content-type"] || "";
    if (!String(contentType).toLowerCase().includes("multipart/form-data")) {
      return json(res, 400, { error: "Envie multipart/form-data com o campo audio." });
    }

    const buffer = await readRequestBuffer(req);
    const { fields, files } = parseMultipart(buffer, contentType);
    const audio = files.audio;

    if (!audio?.buffer?.length) {
      return json(res, 400, { error: "Áudio não recebido." });
    }

    const model = process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1";
    const formData = new FormData();
    const blob = new Blob([audio.buffer], { type: audio.contentType || "audio/webm" });
    formData.append("file", blob, guessFilename(audio.filename, audio.contentType));
    formData.append("model", model);
    formData.append("language", fields.language || "pt");
    formData.append("response_format", "json");

    if (fields.context) {
      formData.append("prompt", String(fields.context).slice(0, 800));
    }

    const openaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await openaiRes.json().catch(() => ({}));
    if (!openaiRes.ok) {
      return json(res, openaiRes.status, {
        error: data?.error?.message || "Erro ao transcrever áudio.",
      });
    }

    return json(res, 200, { text: data?.text || "" });
  } catch (err) {
    console.error("Erro em /api/transcribe:", err);
    return json(res, 500, { error: err?.message || "Erro interno ao transcrever áudio." });
  }
}
