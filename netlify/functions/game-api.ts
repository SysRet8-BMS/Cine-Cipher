import type { Handler } from "@netlify/functions";

// Minimal `process` declaration to satisfy TypeScript in this function
declare const process: { env: Record<string, string | undefined> };
const OMDB_BASE = "https://www.omdbapi.com";

// Return the full plot (do not truncate after punctuation).
const truncatePlot = (raw?: unknown) =>
  String(raw ?? "").replace(/\s+/g, " ").trim();

const getKey = () =>
  process.env.OMDB_API_KEY || "c0fd8284";

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
  if (!key) return json(500, { error: "OMDB API key not configured" });

  const qs = event.queryStringParameters || {};

  try {
    /* ============================
       SEARCH MOVIE (?query=...)
       ============================ */
    if (qs.query) {
      const searchUrl = `${OMDB_BASE}/?apikey=${encodeURIComponent(
        key
      )}&t=${encodeURIComponent(qs.query)}&type=movie&plot=short`;

      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok)
        return json(searchRes.status, { error: await searchRes.text() });

      const movieData = await searchRes.json();

      // OMDB returns single movie result with Response field
      if (movieData.Response === "False" || !movieData.Plot || movieData.Plot === "N/A") {
        return json(200, {
          results: [],
          hints: [],
          titlePattern: null,
          details: null,
        });
      }

      const chosenDetails = movieData;
      const hints = [truncatePlot(chosenDetails.Plot)];

      const title = chosenDetails.Title || "";

      const titlePattern = title
        .split("")
        .map((ch: string) =>
          /[A-Za-z0-9]/.test(ch) ? "-" : ch
        )
        .join("");

      return json(200, {
        results: [chosenDetails],
        hints,
        titlePattern,
        details: chosenDetails,
      });
    }

    /* ============================
       MOVIE DETAILS (?id=...)
       ============================ */
    if (qs.id) {
      const detailsUrl = `${OMDB_BASE}/?apikey=${encodeURIComponent(
        key
      )}&t=${encodeURIComponent(qs.id)}&type=movie&plot=short`;

      const res = await fetch(detailsUrl);
      if (!res.ok)
        return json(res.status, { error: await res.text() });

      const data = await res.json();

      if (data.Response === "False") {
        return json(404, { error: "Movie not found" });
      }

      const hints = data?.Plot && data.Plot !== "N/A" ? [truncatePlot(data.Plot)] : [];

      const title = data.Title || "";
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
