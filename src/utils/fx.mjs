import axios from "axios";
import { FxRates } from "../models/FxRates.mjs";

const PROVIDER = process.env.FX_PROVIDER || "https://api.exchangerate.host/latest";
const BASE = (process.env.FX_BASE || "USD").toUpperCase();
const TTL_MIN = Math.max(10, Number(process.env.FX_TTL_MIN || 60));

export async function getRates(base = BASE) {
  const doc = await FxRates.findOne({ base }).lean();
  const fresh = doc && (Date.now() - new Date(doc.fetchedAt).getTime() < TTL_MIN*60*1000);
  if (fresh) return doc;

  const { data } = await axios.get(`${PROVIDER}?base=${encodeURIComponent(base)}`, { timeout: 15000 });
  if (!data?.rates) throw new Error("FX fetch failed");
  const rec = { base, rates: data.rates, fetchedAt: new Date() };
  await FxRates.updateOne({ base }, { $set: rec }, { upsert:true });
  return rec;
}

export function convert(amount, from, to, rates) {
  const r = rates.rates;
  if (from === rates.base) return amount * (r[to] || 1);
  if (to === rates.base)   return amount / (r[from] || 1);
  return (amount / (r[from] || 1)) * (r[to] || 1);
}
