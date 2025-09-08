# Anime Hub — static site (uses animeapi.skin + 2anime embed)

## Quick start (Termux)
1. Edit `assets/script.js` if you need to set `PROXY_BASE` to your proxy (for CORS).
2. Commit and push to GitHub, then connect to Vercel (or run `vercel` CLI).

## Notes
- This site uses `https://animeapi.skin` endpoints:
  - /trending
  - /search?q=...
  - /episodes?title=...
- The watch page uses `https://2anime.xyz/embed/{episode-id}` for the iframe.
- If fields differ (id vs slug), adjust `assets/script.js` lines where ep id is chosen.
