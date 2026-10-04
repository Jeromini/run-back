// Worldwide food search for the app. Proxies Open Food Facts (open data, ODbL) because its
// search service does not allow direct browser calls, and returns a small, clean result list:
// only products with usable calorie data, normalised to kcal, protein, carbs, fat and fibre per 100 g.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", ...extra } });

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);
  let q = "";
  try { q = String((await req.json()).q || "").trim(); } catch { return json({ error: "Bad request" }, 400); }
  if (q.length < 2 || q.length > 80) return json({ error: "Search for 2 to 80 characters" }, 400);

  const url = new URL("https://search.openfoodfacts.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("page_size", "40");
  url.searchParams.set("fields", "code,product_name,product_name_en,brands,nutriments,serving_size,serving_quantity,countries_tags");
  let data: any;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "RunBack/2.0 (fitness coach app)" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return json({ error: "Food search is busy. Try again in a moment." }, 502);
    data = await r.json();
  } catch {
    return json({ error: "Food search is unavailable right now." }, 502);
  }

  const seen = new Set<string>();
  const items = [];
  for (const h of data.hits || []) {
    const n = h.nutriments || {};
    let k = num(n["energy-kcal_100g"]);
    if (!isFinite(k)) { const kj = num(n["energy_100g"]); if (isFinite(kj)) k = kj / 4.184; }
    const p = num(n["proteins_100g"]), c = num(n["carbohydrates_100g"]), f = num(n["fat_100g"]), fb = num(n["fiber_100g"]);
    const name = String(h.product_name_en || h.product_name || "").trim();
    if (!name || !isFinite(k) || k < 0 || k > 900) continue;
    if (isFinite(p) && p * 4 > k + 5) continue; // inconsistent entry
    const brand = String(first(h.brands) || "").trim();
    const key = (name + "|" + brand).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const sq = num(h.serving_quantity);
    items.push({
      id: "off:" + h.code,
      name, brand,
      k: Math.round(k), p: isFinite(p) ? Math.round(p * 10) / 10 : 0,
      c: isFinite(c) ? Math.round(c * 10) / 10 : null, f: isFinite(f) ? Math.round(f * 10) / 10 : null, fb: isFinite(fb) ? Math.round(fb * 10) / 10 : 0,
      serving: isFinite(sq) && sq > 0 && sq < 2000 ? { label: String(h.serving_size || Math.round(sq) + " g"), g: sq } : null,
    });
    if (items.length >= 25) break;
  }
  return json({ items, source: "Open Food Facts" }, 200, { "Cache-Control": "public, max-age=86400" });
});
