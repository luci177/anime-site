export default async function handler(req, res) {
  const { q } = req.query; // ?q=naruto
  if (!q) return res.status(400).json({ error: "Missing search query" });

  try {
    const response = await fetch(`${process.env.ANIME_API}/search?query=${encodeURIComponent(q)}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch search results" });
  }
}
