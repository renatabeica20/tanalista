export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    if (!buffer.length) {
      return res.status(400).json({ error: "Áudio vazio" });
    }

    const contentType = req.headers["content-type"] || "audio/webm";
    const blob = new Blob([buffer], { type: contentType });

    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "gpt-4o-mini-transcribe");
    formData.append("language", "pt");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Falha na transcrição",
        details: data,
      });
    }

    return res.status(200).json({
      text: data.text || "",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno na transcrição",
      details: error.message,
    });
  }
}
