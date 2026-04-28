export default async function handler(req, res) {
  const { id } = req.query;

  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/shared_lists?id=eq.${id}&select=*`,
    {
      headers: {
        apikey: process.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();

  res.status(200).json(data[0] || {});
}
