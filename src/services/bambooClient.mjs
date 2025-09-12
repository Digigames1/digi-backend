import axios from "axios";

const BASE = process.env.BAMBOO_BASE_URL || "https://api.bamboocardportal.com";
const CATALOG_PATH = process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog";
const TIMEOUT = +(process.env.FETCH_TIMEOUT_MS || 15000);

function basicAuthHeader() {
  const id = process.env.BAMBOO_CLIENT_ID;
  const secret = process.env.BAMBOO_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Bamboo Basic credentials missing");
  const token = Buffer.from(`${id}:${secret}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

/**
 * Fetch one page from Bamboo catalog v2 with optional filters.
 * Supports params like: CurrencyCode, CountryCode, Name, ModifiedDate, ProductId, PageSize, PageIndex, BrandId, TargetCurrency
 */
export async function fetchCatalogPage(params = {}) {
  const url = `${BASE}${CATALOG_PATH}`;
  const headers = {
    "Content-Type": "application/json",
    ...basicAuthHeader(),
  };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && `${v}` !== "") qs.append(k, v);
  }
  const finalUrl = `${url}?${qs.toString()}`;

  const res = await axios.get(finalUrl, { headers, timeout: TIMEOUT, validateStatus: () => true });
  if (res.status === 429) {
    const msg = res.data?.reason || "Too many requests";
    throw Object.assign(new Error(`Bamboo 429: ${msg}`), { status: 429 });
  }
  if (res.status !== 200) {
    const msg = res.data?.reason || `Unexpected status ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return res.data; // expected shape: { pageindex, pageSize, count, items: [ { name, products: [...] } ] }
}

export async function fetchCatalogPageWithRetry(params = {}, { retries = 0, minRetrySec = 1800 } = {}) {
  try {
    return await fetchCatalogPage(params);
  } catch (e) {
    if (e?.status === 429) {
      const retrySec = Math.max(minRetrySec, 1800); // 30 хв за замовчуванням
      const next = new Date(Date.now() + retrySec * 1000);
      return { __rateLimited: true, nextRetryAt: next };
    }
    throw e;
  }
}

/** Paged fetch with guard and early-stop by empty pages */
export async function fetchCatalogPaged({ PageSize = 100, maxPages = 30, PageIndex = 0, ...filters } = {}, onPage) {
  let pageIndex = +PageIndex || 0;
  const limit = Math.max(1, +maxPages || 1);
  const pageSize = Math.max(1, +PageSize || 100);

  for (let i = 0; i < limit; i++) {
    const data = await fetchCatalogPage({ ...filters, PageSize: pageSize, PageIndex: pageIndex });
    if (!data || !Array.isArray(data.items) || data.items.length === 0) break;
    await onPage?.(data, pageIndex);
    pageIndex++;
  }
}

