export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Imagem não enviada' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: image.replace(/^data:image\/\w+;base64,/, '')
                }
              },
              {
                type: 'text',
                text: `
Leia esta lista de compras manuscrita e retorne SOMENTE um JSON no formato:

[
  { "nome": "arroz", "quantidade": 2, "unidade": "pacote" },
  { "nome": "feijão", "quantidade": 2, "unidade": "pacote" }
]

Regras:
- Corrigir erros de leitura
- Ignorar rabiscos
- Normalizar nomes
- Não retornar texto fora do JSON
`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    const text = data?.content?.[0]?.text || '';

    return res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao processar imagem' });
  }
}
