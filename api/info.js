export default async function handler(req, res) {
  const { id } = req.query; // ?id=one-piece
  if (!id) return res.status(400).json({ error: "Missing anime id" });

  try {
    const response = await fetch(`${process.env.ANIME_API}/info/${id}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch anime info" });
  }
}
