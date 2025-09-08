export default async function handler(req, res) {
  try {
    const response = await fetch(`${process.env.ANIME_API}/trending`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending" });
  }
}
