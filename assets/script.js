/*
  assets/script.js
  Single client-side app for index, anime detail, and watch pages.
  CONFIG: set API_BASE to your API host. If CORS blocks you, set PROXY_BASE to your proxy URL.
*/

window.app = (function(){
  // ======= CONFIG =======
  // Default API (from your screenshot). If it has CORS issues, set PROXY_BASE below to your proxy URL.
  const API_BASE = "https://animeapi.skin";
  // OPTIONAL: If you have a proxy (your own Vercel proxy) that forwards requests, put it here. Example:
  // const PROXY_BASE = "https://your-proxy.vercel.app"; // leave empty if not needed
  const PROXY_BASE = ""; // <<--- set this if animeapi.skin blocks CORS. Example: "https://api-consumet-org-fawn.vercel.app"

  // Helper to build fetch URL (use proxy if set)
  function apiUrl(path){
    const url = (API_BASE + path);
    if(PROXY_BASE && PROXY_BASE.length>0){
      // proxy expects full URL as query param `url`
      return `${PROXY_BASE}/proxy?url=${encodeURIComponent(url)}`; // adjust if your proxy uses different route
    }
    return url;
  }

  // ======= Utilities =======
  async function getJson(path){
    const u = apiUrl(path);
    const res = await fetch(u);
    if(!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
  }

  function el(tag, attrs={}, html=''){ const e=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); e.innerHTML=html; return e; }

  // ======= Index Page =======
  async function initIndex(){
    const trendingList = document.getElementById('trendingList');
    const resultsSec = document.getElementById('results');
    const resultsList = document.getElementById('resultsList');
    const searchBox = document.getElementById('searchBox');
    const searchBtn = document.getElementById('searchBtn');

    // load trending
    try{
      const data = await getJson('/trending');
      // Expect data to be array or object with results; adjust if API differs
      const items = Array.isArray(data) ? data : (data.results || data.animes || []);
      trendingList.innerHTML = '';
      items.forEach(a => {
        const id = a.slug || a.id || (a.title ? slugify(a.title) : '');
        const title = a.title || a.name || a.animeTitle || id;
        const img = a.image || a.poster || a.cover || a.thumbnail || '';
        const card = el('div',{class:'card'});
        const link = el('a',{href:`anime.html?title=${encodeURIComponent(id || title)}`});
        link.appendChild(el('img',{src:img,alt:title}));
        link.appendChild(el('h4',{}, title));
        card.appendChild(link);
        trendingList.appendChild(card);
      });
    }catch(err){
      trendingList.innerHTML = '<p class="muted">Unable to load trending. ' + err.message + '</p>';
      console.error(err);
    }

    // search
    async function doSearch(q){
      try{
        resultsList.innerHTML = 'Searching...';
        resultsSec.style.display = 'block';
        const data = await getJson(`/search?q=${encodeURIComponent(q)}&page=1`);
        const items = Array.isArray(data) ? data : (data.results || data.animes || []);
        resultsList.innerHTML = '';
        items.forEach(a => {
          const id = a.slug || a.id || (a.title ? slugify(a.title) : '');
          const title = a.title || a.name || a.animeTitle || id;
          const img = a.image || a.poster || a.cover || '';
          const card = el('div',{class:'card'});
          const link = el('a',{href:`anime.html?title=${encodeURIComponent(id || title)}`});
          link.appendChild(el('img',{src:img,alt:title}));
          link.appendChild(el('h4',{}, title));
          card.appendChild(link);
          resultsList.appendChild(card);
        });
      }catch(err){
        resultsList.innerHTML = '<p class="muted">Search failed. ' + err.message + '</p>';
        console.error(err);
      }
    }

    searchBtn.addEventListener('click', ()=>{ const q=searchBox.value.trim(); if(q) doSearch(q); });
    searchBox.addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ const q=searchBox.value.trim(); if(q) doSearch(q); }});
  }

  // ======= Anime detail page =======
  async function initAnime(){
    // Read title param
    const params = new URLSearchParams(window.location.search);
    const titleParam = params.get('title') || params.get('id') || '';
    if(!titleParam){ document.getElementById('title').textContent = 'No anime specified'; return; }

    const titleEl = document.getElementById('title');
    try{
      // fetch episodes and (if available) metadata
      const episodesData = await getJson(`/episodes?title=${encodeURIComponent(titleParam)}`);
      // episodesData expected to contain episodes array
      const eps = episodesData.episodes || episodesData.results || episodesData || [];
      const episodesList = document.getElementById('episodesList');
      episodesList.innerHTML = '';

      // try metadata fields
      const meta = episodesData.meta || episodesData.info || {};
      titleEl.textContent = meta.title || titleParam;
      if(meta.image) document.getElementById('meta').innerHTML = `<img src="${meta.image}" style="max-width:120px;border-radius:6px">`;
      if(meta.synopsis) document.getElementById('synopsis').textContent = meta.synopsis;

      // Build episode buttons
      eps.forEach(ep => {
        // Determine id/slug used by embed. Try common fields
        const epId = ep.id || ep.slug || ep.episodeId || ep.episode || ep.sourceId || '';
        const epNum = ep.number || ep.episode || ep.episodeNumber || '';
        const display = epNum ? `Episode ${epNum}` : (ep.title || epId);
        const btn = document.createElement('button');
        btn.className = 'ep';
        btn.textContent = display;
        btn.onclick = () => {
          // navigate to watch page with id param; watch page builds iframe URL from this id
          window.location.href = `watch.html?id=${encodeURIComponent(epId)}&title=${encodeURIComponent(meta.title || titleParam)}`;
        };
        episodesList.appendChild(btn);
      });

      if(eps.length===0) episodesList.innerHTML = '<p class="muted">No episodes found for this title.</p>';
    }catch(err){
      document.getElementById('title').textContent = 'Error loading anime';
      document.getElementById('episodesList').innerHTML = '<p class="muted">' + err.message + '</p>';
      console.error(err);
    }
  }

  // ======= Watch page =======
  async function initWatch(){
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || '';
    const title = params.get('title') || '';
    const player = document.getElementById('player');
    const watchTitle = document.getElementById('watchTitle');
    if(!id){
      watchTitle.textContent = 'No episode specified';
      return;
    }
    watchTitle.textContent = title + ' — Playing';
    // Build embed URL (2anime embed format)
    // NOTE: the embed path may depend on provider. If your ep id is already the correct slug, this works:
    const embedUrl = `https://2anime.xyz/embed/${id}`;
    player.src = embedUrl;
    // If embed requires different formatting (e.g. provider/slug/ep-number), you may need to adjust here.
  }

  // small helper
  function slugify(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

  // public API
  return {
    initIndex, initAnime, initWatch
  };
})();
