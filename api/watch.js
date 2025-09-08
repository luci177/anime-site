export default async function handler(req, res) {
  const { episodeId } = req.query; // ?episodeId=one-piece-1
  if (!episodeId) return res.status(400).json({ error: "Missing episodeId" });

  try {
    const response = await fetch(`${process.env.ANIME_API}/watch/${episodeId}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch watch links" });
  }
}
