import express from "express";
import { fetchBambooProducts } from "../utils/bamboo.js";
import { applyMarkup } from "../utils/markup.js";

const router = express.Router();
const N = (x, d = 0) => (Number.isFinite(+x) ? +x : d);

const score = (q, x) => {
  const s = String(q).trim().toLowerCase();
  const name = String(x.name || "").toLowerCase();
  const ven = String(x.vendor || x.platform || "").toLowerCase();
  let sc = 0;
  if (name.includes(s)) sc += 3;
  if (ven.includes(s)) sc += 1;
  return sc;
};

function map(x) {
  const base = N(x.price ?? x.currentPrice ?? x.amount, 0);
  const price = applyMarkup(base, x);
  const name = String(x.name ?? x.title ?? "Untitled").slice(0, 200);
  const imgRaw = x.image_url || x.img || x.thumbnail || "";
  const img = imgRaw ? String(imgRaw).slice(0, 500) : undefined;
  return {
    id: String(x.id ?? x.sku ?? x.code),
    name,
    img,
    price,
    oldPrice: base && price < base ? base : undefined,
    category: autoCategory(x),
    platform: String(x.platform || x.vendor || "").toUpperCase(),
    region: x.region || x.country || "US",
    denomination: N(x.denomination ?? x.faceValue, undefined),
    rating: N(x.rating, 0),
    reviews: N(x.reviews, 0),
  };
}

function autoCategory(x) {
  const name = String(x.name || "").toLowerCase();
  const plat = String(x.platform || x.vendor || "").toUpperCase();
  if (
    ["XBOX", "PLAYSTATION", "STEAM", "NINTENDO"].includes(plat) ||
    /xbox|playstation|psn|steam|nintendo|game/.test(name)
  )
    return "gaming";
  if (
    /netflix|spotify|hulu|disney|hbo|max|prime video|youtube|twitch/.test(
      name
    )
  )
    return "streaming";
  if (/apple music|spotify|deezer|tidal|music/.test(name)) return "music";
  if (/uber|airbnb|booking|bolt|lyft|travel/.test(name)) return "travel";
  if (/starbucks|ubereats|doordash|grubhub|food|drink/.test(name))
    return "fooddrink";
  if (/amazon|ebay|target|aliexpress|walmart|shopping/.test(name))
    return "shopping";
  return "shopping";
}

router.get("/", async (req, res) => {
  const q = (req.query.q || "").trim();
  const { page = "1", limit = "24" } = req.query;
  if (q.length < 2) return res.json({ products: [], total: 0 });
  try {
    const raw = await fetchBambooProducts({ search: q, page, limit });
    const withScore = raw
      .map((x) => ({ item: map(x), sc: score(q, x) }))
      .filter((z) => z.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .map((z) => z.item);
    res.json({ products: withScore, total: withScore.length });
  } catch (e) {
    console.error("[/api/search]", e?.message || e);
    res.json({ products: [], total: 0, error: true });
  }
});

export default router;
