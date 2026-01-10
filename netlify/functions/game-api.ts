import type { Handler } from "@netlify/functions";

const TMDB_BASE = "https://api.themoviedb.org/3";

const getKey = () => process.env.TMDB_API_KEY || "f091add1b7dff0fcb7614e3e86b7f03e";

const json = (status: number, body: unknown) => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event) => {
  const key = getKey();
  if (!key) return json(500, { error: "TMDB API key not configured" });

  const qs = event.queryStringParameters || {};

  try {
    // Search movies: ?query=inception
    if (qs.query) {
      // perform search, then fetch details for the first match to get overview
      const url = `${TMDB_BASE}/search/movie?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(qs.query)}`;
      const res = await fetch(url);
      if (!res.ok) return json(res.status, { error: await res.text() });
      const search = await res.json();
      // iterate search results and pick the first movie that has an overview
      const results = search.results || [];
      let chosenDetails: any = null;
      for (const r of results) {
        if (!r?.id) continue;
        const detailsUrl = `${TMDB_BASE}/movie/${encodeURIComponent(r.id)}?api_key=${encodeURIComponent(key)}&append_to_response=credits,images`;
        const detRes = await fetch(detailsUrl);
        if (!detRes.ok) continue;
        const details = await detRes.json();
        if (details && details.overview && String(details.overview).trim().length > 0) {
          chosenDetails = details;
          break;
        }
      }

      if (!chosenDetails) {
        // no movie with an overview found in search results
        return json(200, { results, hints: [], titlePattern: null, details: null });
      }

      const hints = [String(chosenDetails.overview).trim()];
      const title = chosenDetails.title || chosenDetails.original_title || "";
      const titlePattern = String(title).split("").map((ch) => (/[A-Za-z0-9]/.test(ch) ? "-" : ch)).join("");

      return json(200, { results, hints, titlePattern, details: chosenDetails });
    }

    // Random movie with overview: ?random=true
    if (qs.random === "true") {
      // fetch popular movies pages (limit to first 3 pages) and pick first with overview
      const limitPages = 3;
      for (let p = 1; p <= limitPages; p++) {
        const popUrl = `${TMDB_BASE}/movie/popular?api_key=${encodeURIComponent(key)}&page=${p}`;
        const pres = await fetch(popUrl);
        if (!pres.ok) continue;
        const pop = await pres.json();
        const results = pop.results || [];
        for (const r of results) {
          if (!r?.id) continue;
          const detailsUrl = `${TMDB_BASE}/movie/${encodeURIComponent(r.id)}?api_key=${encodeURIComponent(key)}&append_to_response=credits,images`;
          const detRes = await fetch(detailsUrl);
          if (!detRes.ok) continue;
          const details = await detRes.json();
          if (details && details.overview && String(details.overview).trim().length > 0) {
            const hints = [String(details.overview).trim()];
            const title = details.title || details.original_title || "";
            const titlePattern = String(title).split("").map((ch) => (/[A-Za-z0-9]/.test(ch) ? "-" : ch)).join("");
            return json(200, { hints, titlePattern, details });
          }
        }
      }
      return json(200, { hints: [], titlePattern: null, details: null });
    }

    // Get movie details: ?id=550
    if (qs.id) {
      const url = `${TMDB_BASE}/movie/${encodeURIComponent(qs.id)}?api_key=${encodeURIComponent(key)}&append_to_response=credits,images`;
      const res = await fetch(url);
      if (!res.ok) return json(res.status, { error: await res.text() });
      const data = await res.json();

      const hints = [] as string[];
      if (data.overview) {
        hints.push(String(data.overview).trim());
      }

      const title = data.title || data.original_title || "";
      const titlePattern = String(title).split("").map((ch) => (/[A-Za-z0-9]/.test(ch) ? "-" : ch)).join("");

      return json(200, { ...data, hints, titlePattern });
    }

    // If no recognized query, return usage
    return json(400, {
      error: "Missing query parameter. Use ?query=... to search or ?id=... to fetch details",
    });
  } catch (err: any) {
    return json(500, { error: err?.message || String(err) });
  }
};
