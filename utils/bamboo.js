import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BAMBOO_BASE = process.env.BAMBOO_BASE || "https://api.bamboo.example";
const BAMBOO_KEY  = process.env.BAMBOO_API_KEY || "";

// Простi курси для демо-режиму
const SAMPLE_RATES = {
  USD: 1,
  EUR: 0.9,
  PLN: 4,
  AUD: 1.5,
  CAD: 1.35,
};

const safeN = (n, d=0) => (Number.isFinite(+n) ? +n : d);

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

function loadSampleProducts() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const p = path.join(__dirname, "../data/sample-products.json");
    const txt = fs.readFileSync(p, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    console.error("Failed to load sample products", e.message);
    return [];
  }
}

export async function bambooFetch(path, params={}) {
  const url = new URL(`${BAMBOO_BASE}${path}`);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": BAMBOO_KEY ? `Bearer ${BAMBOO_KEY}` : undefined,
      }
    });
    if (!res.ok) {
      const t = await res.text().catch(()=> "");
      throw new Error(`Bamboo ${res.status}: ${t || res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.warn("Bamboo fetch failed, using sample products", err.message);
    let products = loadSampleProducts();
    const cur = String(params.currency || "USD").toUpperCase();
    const rate = SAMPLE_RATES[cur] || 1;
    if (rate !== 1) {
      products = products.map(p => ({
        ...p,
        price: Number((safeN(p.price) * rate).toFixed(2))
      }));
    }
    return { products };
  }
}

/** Мапимо товар Bamboo → наш фронтовий формат */
export function mapProduct(x) {
  return {
    id: String(x.id ?? x.sku ?? x.code ?? crypto.randomUUID()),
    name: String(x.name ?? x.title ?? "Untitled"),
    img: x.image_url || x.img || x.thumbnail || undefined,
    price: safeN(x.price ?? x.currentPrice ?? x.amount, 0),
    oldPrice: x.oldPrice ? safeN(x.oldPrice, 0) : undefined,
    rating: x.rating ? safeN(x.rating, 0) : undefined,
    reviews: x.reviews ? safeN(x.reviews, 0) : undefined,
    platform: x.platform || x.vendor || undefined,
    instant: x.instant ?? true,
    discount: x.discount ? safeN(x.discount, 0) : undefined,
    region: x.region || x.country || "US",
    category: categorize(x),
  };
}

export async function fetchBambooProducts(params) {
  try {
    const r = await bambooFetch("/products", params);
    const items = Array.isArray(r?.items)
      ? r.items
      : Array.isArray(r?.products)
        ? r.products
        : Array.isArray(r)
          ? r
          : [];
    return items;
  } catch (e) {
    console.warn("[bamboo] products failed:", e?.message || e);
    return [];
  }
}

export async function fetchAllBambooProducts(params = {}) {
  const limit = safeN(params.limit, 100);
  let page = 1;
  const all = [];
  while (true) {
    const items = await fetchBambooProducts({ ...params, page: String(page), limit: String(limit) });
    if (!items.length) break;
    all.push(...items);
    if (items.length < limit) break;
    page += 1;
  }
  return all;
}

export async function fetchBambooById(id) {
  try {
    const x = await bambooFetch(`/products/${encodeURIComponent(id)}`);
    return x || null;
  } catch (e) {
    console.warn("[bamboo] byId failed:", e?.message || e);
    return null;
  }
}

