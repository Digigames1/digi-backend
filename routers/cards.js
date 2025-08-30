import express from "express";
import { fetchBambooProducts } from "../utils/bamboo.js";
import { applyMarkup } from "../utils/markup.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const fallback = require("../data/sample-products.json");

const router = express.Router();

const N = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const uniq = (a) => [...new Set(a.filter(Boolean))];

router.get("/", async (req, res) => {
  const q = req.query;
  try {
    const bamboo = await fetchBambooProducts({
      category: q.category,
      platform: q.platform,
      regions: q.regions,
      denoms: q.denoms,
      search: q.q,
      inStock: q.inStock ? "true" : undefined,
      page: q.page || "1",
      limit: q.limit || "48",
      sort: q.sort,
      CurrencyCode: q.currency,
      CountryCode: q.country,
      LanguageCode: q.lang,
    });

    let fb = [];
    if (String(q.category).toLowerCase() === "gaming") {
      fb = Array.isArray(fallback) ? fallback : [];
    }

    const mapItem = (x) => {
      const base = N(x.price ?? x.currentPrice ?? x.amount, 0);
      const platform = String(x.platform || x.vendor || "").toUpperCase();
      return {
        id: String(x.id ?? x.sku ?? x.code ?? `${platform}-${x.denomination}-${x.region}`),
        name: String(x.name ?? x.title ?? "Untitled"),
        img: x.image_url || x.img || x.thumbnail,
        basePrice: base,
        platform,
        region: x.region || x.country || "US",
        denomination: N(x.denomination ?? x.faceValue, undefined),
        rating: N(x.rating, 0),
        reviews: N(x.reviews, 0),
        instant: true,
      };
    };

    const mergedRaw = [...bamboo.map(mapItem), ...fb.map(mapItem)];

    const seen = new Set();
    let products = mergedRaw
      .filter((it) => {
        if (seen.has(it.id)) return false;
        seen.add(it.id);
        return true;
      })
      .map((it) => {
        const price = applyMarkup(it.basePrice, it);
        return {
          id: it.id,
          name: it.name,
          img: it.img,
          price,
          oldPrice: it.basePrice && price < it.basePrice ? it.basePrice : undefined,
          platform: it.platform,
          region: it.region,
          denomination: it.denomination,
          rating: it.rating,
          reviews: it.reviews,
          instant: it.instant,
          currency: q.currency ? String(q.currency).toUpperCase() : "USD",
        };
      });

    const wantPlatform = q.platform ? String(q.platform).toUpperCase() : null;
    if (wantPlatform) {
      products = products.filter(
        (it) => (it.platform || "").toUpperCase() === wantPlatform
      );
    }
    if (q.regions) {
      const set = new Set(String(q.regions).split(",").map((s) => s.trim().toUpperCase()));
      products = products.filter((it) => !it.region || set.has(String(it.region).toUpperCase()));
    }
    if (q.denoms) {
      const setD = new Set(String(q.denoms).split(",").map((s) => +s));
      products = products.filter((it) => (it.denomination ? setD.has(+it.denomination) : false));
    }

    if (q.sort === "priceAsc") products.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (q.sort === "priceDesc") products.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (q.sort === "ratingDesc") products.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const facets = {
      platforms: uniq(products.map((p) => p.platform)),
      regions: uniq(products.map((p) => p.region)),
      denominations: uniq(products.map((p) => p.denomination)).sort((a, b) => a - b),
    };

    console.log(
      `[cards] gaming=${String(q.category).toLowerCase() === "gaming"} count=${products.length}`
    );
    res.json({ products, total: products.length, facets, currency: q.currency ? String(q.currency).toUpperCase() : "USD" });
  } catch (e) {
    console.error("[/api/cards] fatal:", e?.message || e);
    res.json({
      products: [],
      total: 0,
      facets: { platforms: [], regions: [], denominations: [] },
      error: true,
    });
  }
});

export default router;

