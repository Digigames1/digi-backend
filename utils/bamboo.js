import crypto from "crypto";

const BAMBOO_BASE = process.env.BAMBOO_BASE || "https://api.bamboo.example";
const BAMBOO_KEY  = process.env.BAMBOO_API_KEY || "";

const safeN = (n, d=0) => (Number.isFinite(+n) ? +n : d);

export async function bambooFetch(path, params={}) {
  const url = new URL(`${BAMBOO_BASE}${path}`);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });

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
  };
}

