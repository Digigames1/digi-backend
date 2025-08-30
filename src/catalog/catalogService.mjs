import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { paginateCatalog, getBambooConfig } from "./bambooClient.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_PATH = process.env.CATALOG_CACHE_PATH || path.join(__dirname, "..", "data", "catalog-cache.json");
const TTL_MIN = Math.max(1, Number(process.env.CATALOG_CACHE_TTL_MIN || 60));
const MAX_ITEMS = Math.max(100, Number(process.env.CATALOG_MAX_ITEMS || 10000));

let inFlight = null; // проміс, що сигналізує активне оновлення, щоб не дублювати запити

async function ensureDirExists(p) {
  try {
    await fs.mkdir(path.dirname(p), { recursive: true });
  } catch {}
}

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      updatedAt: 0,
      source: "none",
      items: [],
      meta: { lastError: null, lastErrorAt: 0, ttlMin: TTL_MIN, maxItems: MAX_ITEMS },
      bamboo: getBambooConfig(),
    };
  }
}

async function writeCache(doc) {
  await ensureDirExists(CACHE_PATH);
  const payload = JSON.stringify(doc, null, 2);
  await fs.writeFile(CACHE_PATH, payload, "utf8");
}

function isFresh(cache) {
  const ageMin = (Date.now() - (cache.updatedAt || 0)) / 60000;
  return ageMin < TTL_MIN && (cache.items?.length || 0) > 0;
}

async function fetchAllFromBamboo() {
  const items = [];
  for await (const page of paginateCatalog({ limit: 200 })) {
    for (const it of page) {
      items.push(it);
      if (items.length >= MAX_ITEMS) break;
    }
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

/**
 * Оновлює кеш із Bamboo. Якщо помилка — не ламає кеш, просто записує lastError.
 * @param {object} opts
 * @param {boolean} opts.force - ігнорувати TTL
 * @returns {Promise<{items, source, updatedAt, meta, bamboo}>}
 */
export async function refreshCatalog({ force = false } = {}) {
  const cache = await readCache();
  if (!force && isFresh(cache)) {
    return { ...cache, source: "cache" };
  }

  // Лок — щоб не запускати паралельно
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const items = await fetchAllFromBamboo();
      const doc = {
        updatedAt: Date.now(),
        source: "bamboo",
        items,
        meta: { lastError: null, lastErrorAt: 0, ttlMin: TTL_MIN, maxItems: MAX_ITEMS, count: items.length },
        bamboo: getBambooConfig(),
      };
      await writeCache(doc);
      return doc;
    } catch (e) {
      const doc = {
        ...cache,
        source: "cache",
        meta: {
          ...(cache.meta || {}),
          lastError: e?.response?.data || e?.message || String(e),
          lastErrorAt: Date.now(),
          ttlMin: TTL_MIN,
          maxItems: MAX_ITEMS,
          count: cache.items?.length || 0,
        },
        bamboo: getBambooConfig(),
      };
      // зберігаємо оновлену мету, але не перетираємо items, якщо упало
      await writeCache(doc);
      return doc;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * Повертає дані каталогу без примусового оновлення.
 * Якщо кеш протух — спробує тихо оновити, але все одно поверне те, що є.
 */
export async function getCatalog() {
  const cache = await readCache();
  if (isFresh(cache)) {
    return { ...cache, source: "cache" };
  }
  // Без очікування (не блокуємо відповідь) запускаємо оновлення у фоні
  refreshCatalog({ force: false }).catch(() => {});
  // Віддаємо поточний кеш (якщо пустий — все одно віддаємо, але з метою)
  return { ...cache, source: (cache.items?.length ? "cache" : "none") };
}

/** Метадані кешу без віддачі всіх items */
export async function getCatalogStatus() {
  const cache = await readCache();
  const ageMin = ((Date.now() - (cache.updatedAt || 0)) / 60000).toFixed(1);
  return {
    updatedAt: cache.updatedAt,
    ageMin: Number(ageMin),
    count: cache.items?.length || 0,
    meta: cache.meta || {},
    bamboo: cache.bamboo || getBambooConfig(),
    inFlight: Boolean(inFlight),
    ttlMin: TTL_MIN,
    cachePath: CACHE_PATH,
    maxItems: MAX_ITEMS,
  };
}

