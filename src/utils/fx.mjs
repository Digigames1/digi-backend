import axios from "axios";

const PROVIDER = process.env.FX_PROVIDER || "https://api.exchangerate.host/latest";
const BASE = (process.env.FX_BASE || "USD").toUpperCase();
const TTL_MIN = Math.max(10, Number(process.env.FX_TTL_MIN || 60));

// simple in-memory cache emulating a redis store
const cache = new Map();

export async function getRates(base = BASE) {
  base = (base || BASE).toUpperCase();
  const doc = cache.get(base);
  const fresh = doc && Date.now() - new Date(doc.fetchedAt).getTime() < TTL_MIN * 60 * 1000;
  if (fresh) return doc;

  const { data } = await axios.get(`${PROVIDER}?base=${encodeURIComponent(base)}`, {
    timeout: 15000,
  });
  if (!data?.rates) throw new Error("FX fetch failed");
  const rec = { base, rates: data.rates, fetchedAt: new Date().toISOString() };
  cache.set(base, rec);
  return rec;
}

export function convert(amount, from, to, rates) {
  const r = rates.rates || {};
  const src = (from || rates.base).toUpperCase();
  const tgt = (to || rates.base).toUpperCase();
  if (src === tgt) return amount;
  if (src === rates.base) return amount * (r[tgt] || 1);
  if (tgt === rates.base) return amount / (r[src] || 1);
  return (amount / (r[src] || 1)) * (r[tgt] || 1);
}

let timer;
export function initFxWatcher() {
  clearInterval(timer);
  // prime cache immediately
  getRates().catch(() => {});
  timer = setInterval(() => {
    getRates().catch((e) => console.warn("[fx] refresh failed", e?.message));
  }, TTL_MIN * 60 * 1000);
}
