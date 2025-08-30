import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BAMBOO_BASE = process.env.BAMBOO_BASE_URL;
const BAMBOO_CLIENT_ID = process.env.BAMBOO_CLIENT_ID;
const BAMBOO_CLIENT_SECRET = process.env.BAMBOO_CLIENT_SECRET;

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

export async function bambooFetch(path, params = {}) {
  if (!BAMBOO_BASE || !BAMBOO_CLIENT_ID || !BAMBOO_CLIENT_SECRET) {
    throw new Error(
      "BAMBOO_BASE_URL, BAMBOO_CLIENT_ID and BAMBOO_CLIENT_SECRET must be set in the environment"
    );
  }

  const url = new URL(`${BAMBOO_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

  const auth = Buffer.from(`${BAMBOO_CLIENT_ID}:${BAMBOO_CLIENT_SECRET}`).toString(
    "base64"
  );

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    };

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Bamboo ${res.status}: ${t || res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.warn("Bamboo fetch failed, using sample products", err.message);
    let products = loadSampleProducts();
    const cur = String(params.CurrencyCode || "USD").toUpperCase();
    const rate = SAMPLE_RATES[cur] || 1;
    if (rate !== 1) {
      products = products.map((p) => ({
        ...p,
        price: Number((safeN(p.price) * rate).toFixed(2)),
      }));
    }
    return { items: products };
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

export async function fetchBambooProducts(params = {}) {
  const r = await bambooFetch("/api/integration/v2.0/catalog", params);
  const items = Array.isArray(r?.items)
    ? r.items
    : Array.isArray(r?.products)
    ? r.products
    : Array.isArray(r)
    ? r
    : [];
  return items;
}

export async function fetchAllBambooProducts(params = {}) {
  const pageSize = safeN(params.PageSize, 100);
  let pageIndex = 0;
  const all = [];
  while (true) {
    const items = await fetchBambooProducts({
      ...params,
      PageSize: String(pageSize),
      PageIndex: String(pageIndex),
    });
    if (!items.length) break;
    all.push(...items);
    if (items.length < pageSize) break;
    pageIndex += 1;
  }
  return all;
}

export async function fetchBambooById(id) {
  try {
    const x = await bambooFetch(`/api/integration/v2.0/catalog/${encodeURIComponent(id)}`);
    if (x && !Array.isArray(x) && !x.products && !x.items) return x;
    const list = Array.isArray(x?.products)
      ? x.products
      : Array.isArray(x?.items)
        ? x.items
        : Array.isArray(x)
          ? x
          : [];
    const found = list.find(
      (p) =>
        String(p.id) === String(id) ||
        String(p.sku) === String(id) ||
        String(p.code) === String(id)
    );
    if (found) return found;
  } catch (e) {
    console.warn("[bamboo] byId failed:", e?.message || e);
  }
  try {
    const sample = loadSampleProducts();
    return sample.find((p) => String(p.id) === String(id)) || null;
  } catch {
    return null;
  }
}

