import type { Handler } from "@netlify/functions";

// Minimal `process` declaration to satisfy TypeScript in this function
declare const process: { env: Record<string, string | undefined> };
const TMDB_BASE = "https://api.themoviedb.org/3";

// Return the full overview (do not truncate after punctuation).
const truncateOverview = (raw?: unknown) =>
  String(raw ?? "").replace(/\s+/g, " ").trim();

const getKey = () =>
  process.env.TMDB_API_KEY || "f091add1b7dff0fcb7614e3e86b7f03e";

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
    /* ============================
       SEARCH MOVIE (?query=...)
       ============================ */
    if (qs.query) {
      const searchUrl = `${TMDB_BASE}/search/movie?api_key=${encodeURIComponent(
        key
      )}&query=${encodeURIComponent(qs.query)}`;

      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok)
        return json(searchRes.status, { error: await searchRes.text() });

      const search = await searchRes.json();
      const results = search.results || [];

      let chosenDetails: any = null;

      // Find first movie with a valid overview
      for (const r of results) {
        if (!r?.id) continue;

        const detailsUrl = `${TMDB_BASE}/movie/${encodeURIComponent(
          r.id
        )}?api_key=${encodeURIComponent(key)}&append_to_response=credits,images`;

        const detRes = await fetch(detailsUrl);
        if (!detRes.ok) continue;

        const details = await detRes.json();
        if (details?.overview?.trim()) {
          chosenDetails = details;
          break;
        }
      }

      if (!chosenDetails) {
        return json(200, {
          results,
          hints: [],
          titlePattern: null,
          details: null,
        });
      }

      const hints = [truncateOverview(chosenDetails.overview)];


      const title =
        chosenDetails.title || chosenDetails.original_title || "";

      const titlePattern = title
        .split("")
        .map((ch: string) =>
          /[A-Za-z0-9]/.test(ch) ? "-" : ch
        )
        .join("");

      return json(200, {
        results,
        hints,
        titlePattern,
        details: chosenDetails,
      });
    }

    /* ============================
       MOVIE DETAILS (?id=...)
       ============================ */
    if (qs.id) {
      const detailsUrl = `${TMDB_BASE}/movie/${encodeURIComponent(
        qs.id
      )}?api_key=${encodeURIComponent(key)}&append_to_response=credits,images`;

      const res = await fetch(detailsUrl);
      if (!res.ok)
        return json(res.status, { error: await res.text() });

      const data = await res.json();

        const hints = data?.overview ? [truncateOverview(data.overview)] : [];


      const title = data.title || data.original_title || "";
      const titlePattern = title
        .split("")
        .map((ch: string) =>
          /[A-Za-z0-9]/.test(ch) ? "-" : ch
        )
        .join("");

      return json(200, {
        ...data,
        hints,
        titlePattern,
      });
    }

    /* ============================
       INVALID REQUEST
       ============================ */
    return json(400, {
      error:
        "Missing query parameter. Use ?query=... or ?id=...",
    });
  } catch (err: any) {
    return json(500, {
      error: err?.message || String(err),
    });
  }
};
