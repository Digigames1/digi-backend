import express from "express";
import { bambooFetch } from "../utils/bamboo.js";
import { applyMarkup } from "../utils/markup.js";

const router = express.Router();

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function safeN(n, d = 0) {
  n = +n;
  return Number.isFinite(n) ? n : d;
}

function categorize(x) {
  const raw = String(x.category || x.categories || "").toLowerCase();
  if (raw.includes("gaming")) return "gaming";
  if (raw.includes("stream")) return "streaming";
  if (raw.includes("music")) return "music";
  if (raw.includes("food") || raw.includes("drink")) return "fooddrink";
  if (raw.includes("travel")) return "travel";
  if (raw.includes("shop")) return "shopping";
  const guess = String(x.platform || x.vendor || x.name || "").toLowerCase();
  if (/xbox|playstation|steam|nintendo|game/.test(guess)) return "gaming";
  if (/netflix|hulu|disney|prime|stream/.test(guess)) return "streaming";
  if (/spotify|itunes|music|apple/.test(guess)) return "music";
  if (/uber|doordash|food|drink|restaurant/.test(guess)) return "fooddrink";
  if (/air|hotel|travel|flight/.test(guess)) return "travel";
  return "shopping";
}

/**
 * GET /api/cards
 * query: category, platform, regions, denoms, q, sort (priceAsc|priceDesc|ratingDesc),
 *        inStock (1|0), page, limit
 */
router.get("/", async (req, res) => {
  try {
    const {
      category,
      platform,
      regions,
      denoms,
      q,
      sort,
      inStock,
      page = "1",
      limit = "24",
    } = req.query;

    const params = {
      category,
      search: q,
      platform,
      regions,
      denoms,
      inStock: inStock ? "true" : undefined,
      page,
      limit,
    };

    const data = await bambooFetch("/products", params);
    const raw = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data)
          ? data
          : [];

    let products = raw.map((x) => {
      const basePrice = safeN(x.price ?? x.currentPrice ?? x.amount, 0);
      const marked = applyMarkup ? applyMarkup(basePrice, x) : basePrice;
      return {
        id: String(x.id ?? x.sku ?? x.code),
        name: String(x.name ?? x.title ?? "Untitled"),
        img: x.image_url || x.img || x.thumbnail,
        price: marked,
        oldPrice: basePrice && marked < basePrice ? basePrice : undefined,
        rating: safeN(x.rating, 0),
        reviews: safeN(x.reviews, 0),
        platform: String(x.platform || x.vendor || "").toUpperCase(),
        instant: true,
        discount: x.discount ? safeN(x.discount, 0) : undefined,
        region: x.region || x.country || "US",
        denomination: safeN(x.denomination || x.faceValue, undefined),
        category: categorize(x),
      };
    });

    if (platform) {
      const p = String(platform).toUpperCase();
      products = products.filter((it) => (it.platform || "").toUpperCase() === p);
    }
    if (regions) {
      const set = new Set(String(regions).split(",").map((s) => s.trim().toUpperCase()));
      products = products.filter((it) => !it.region || set.has(String(it.region).toUpperCase()));
    }
    if (denoms) {
      const setD = new Set(String(denoms).split(",").map((s) => +s));
      products = products.filter((it) => (it.denomination ? setD.has(+it.denomination) : false));
    }

    if (sort === "priceAsc") products.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "priceDesc") products.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "ratingDesc") products.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const facets = {
      platforms: uniq(products.map((p) => p.platform)),
      regions: uniq(products.map((p) => p.region)),
      denominations: uniq(products.map((p) => p.denomination)).sort((a, b) => a - b),
    };

    res.json({ products, total: products.length, facets });
  } catch (e) {
    console.error("GET /api/cards", e?.message || e);
    res.json({
      products: [],
      total: 0,
      facets: { platforms: [], regions: [], denominations: [] },
    });
  }
});

export default router;

