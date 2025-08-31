import CuratedCatalog from "../models/CuratedCatalog.mjs";
import { fetchMatrix } from "./bambooMatrix.mjs";

/**
 * Глобальний (на процес) лок, щоб не запускати паралельних оновлень
 */
let refreshing = null;
/** Час до якого заборонено ходити в Bamboo після 429/помилки */
let backoffUntil = 0;
/** Остання помилка оновлення (для діагностики) */
let lastError = null;

const TTL_MIN = Math.max(5, Number(process.env.CATALOG_TTL_MIN || 60));
const BACKOFF_MIN = Math.max(5, Number(process.env.CATALOG_BACKOFF_MIN || 30));
const KEY = "curated:v1";

function now() { return Date.now(); }

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
 * @param {{countries?: string[], currencies?: string[], force?: boolean}} opts
 */
export async function getCuratedFromCache(opts = {}) {
  const { countries, currencies, force = false } = opts;

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
  const data = doc?.data || { categories: {}, meta: {} };
  return {
    ok: true,
    source: doc ? "stale-cache-refreshing" : "empty-refreshing",
    data,
    lastError,
    backoffUntil,
  };
}

/**
 * Примусове оновлення (адмін-дія або CRON).
 */
export async function refreshCuratedNow(opts = {}) {
  if (refreshing) {
    await refreshing; // дочекаємось активного
  }
  try {
    refreshing = (async () => {
      const { categories, meta } = await fetchMatrix(opts);
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

