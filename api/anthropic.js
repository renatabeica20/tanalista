export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Classifique este item: ${prompt}`
          }
        ]
      })
    });

    const data = await response.json();

    const categoria =
      data?.content?.[0]?.text?.toLowerCase().trim() || "outros";

    return res.status(200).json({ categoria });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno" });
  }
}
