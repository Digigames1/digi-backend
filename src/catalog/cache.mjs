import CuratedCatalog from "../models/CuratedCatalog.mjs";
import { fetchMatrix } from "./bambooMatrix.mjs";

let refreshing = null;     // лок проти паралельних оновлень
let backoffUntil = 0;      // не ходити в Bamboo до цього часу після 429/помилки
let lastError = null;

const TTL_MIN = Math.max(5, Number(process.env.CATALOG_TTL_MIN || 60));
const BACKOFF_MIN = Math.max(5, Number(process.env.CATALOG_BACKOFF_MIN || 30));
const KEY = "curated:v1";
const now = () => Date.now();

async function readCache() {
  return CuratedCatalog.findOne({ key: KEY }).lean();
}

async function writeCache(data) {
  await CuratedCatalog.updateOne(
    { key: KEY },
    { $set: { data, updatedAt: new Date() } },
    { upsert: true }
  );
}

function isFresh(ts) {
  return ts && (now() - new Date(ts).getTime() < TTL_MIN * 60 * 1000);
}

/**
 * Основний метод: повертає дані з кешу, а при потребі — оновлює (керовано).
 */
export async function getCuratedFromCache({ countries, currencies, force = false } = {}) {

  // 1) читаємо кеш
  const doc = await readCache();
  const fresh = doc?.data && isFresh(doc.updatedAt);

  // 2) якщо свіжий — віддаємо негайно
  if (!force && fresh) {
    return { ok: true, source: "cache", data: doc.data, lastError };
  }

  // 3) якщо діє backoff — віддаємо останній кеш (або порожньо), не ходимо в Bamboo
  if (!force && now() < backoffUntil) {
    return {
      ok: true,
      source: "stale-cache",
      data: doc?.data || { categories: {}, meta: {} },
      lastError,
      backoffUntil,
    };
  }

  // 4) якщо вже оновлюється — чекаємо один проміс і віддаємо результат (або кеш)
  if (refreshing) {
    try {
      await refreshing;
    } catch (_) {}
    const after = await readCache();
    return {
      ok: true,
      source: "cache-after-refresh",
      data: after?.data || doc?.data || { categories: {}, meta: {} },
      lastError,
      backoffUntil,
    };
  }

  // 5) стартуємо оновлення (під локом)
  refreshing = (async () => {
    try {
      const { categories, meta } = await fetchMatrix({ countries, currencies });
      const data = { categories, meta, updatedAt: new Date().toISOString() };
      await writeCache(data);
      lastError = null;
    } catch (e) {
      // при помилці виставляємо backoff
      lastError = e?.response?.data || e?.message || String(e);
      backoffUntil = now() + BACKOFF_MIN * 60 * 1000;
    }
  })();

  // 6) Не блокуємо відповідь: віддаємо те, що є в кеші (або порожньо)
  return {
    ok: true,
    source: doc ? "stale-cache-refreshing" : "empty-refreshing",
    data: doc?.data || { categories: {}, meta: {} },
    lastError,
    backoffUntil,
  };
}

/**
 * Примусове оновлення (адмін-дія або CRON).
 */
export async function refreshCuratedNow({ countries, currencies } = {}) {
  if (refreshing) await refreshing;
  try {
    refreshing = (async () => {
      const { categories, meta } = await fetchMatrix({ countries, currencies });
      const data = { categories, meta, updatedAt: new Date().toISOString() };
      await writeCache(data);
      lastError = null;
      return data;
    })();
    const data = await refreshing;
    return { ok: true, data };
  } catch (e) {
    lastError = e?.response?.data || e?.message || String(e);
    backoffUntil = now() + BACKOFF_MIN * 60 * 1000;
    const doc = await readCache();
    return { ok: false, data: doc?.data || { categories: {}, meta: {} }, error: lastError, backoffUntil };
  } finally {
    refreshing = null;
  }
}

