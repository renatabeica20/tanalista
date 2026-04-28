export default async function handler(req, res) {
  const body = JSON.parse(req.body);

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/shared_lists`,
    {
      method: "POST",
      headers: {
        apikey: process.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        data: body.data,
        remetente: body.remetente
      })
    }
  );

  const data = await response.json();

  res.status(200).json(data[0]);
}
