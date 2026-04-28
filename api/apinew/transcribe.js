export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });
    }

    const chunks = [];

    req.on("data", chunk => {
      chunks.push(chunk);
    });

    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`
          },
          body: buffer
        });

        const data = await response.json();

        if (!response.ok) {
          return res.status(500).json({ error: data });
        }

        return res.status(200).json({
          text: data.text || ""
        });

      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

