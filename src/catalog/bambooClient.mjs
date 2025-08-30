import axios from "axios";
import { authHeaders, debugAuthConfig } from "./auth.mjs";

const BASE =
  process.env.BAMBOO_API_BASE ||
  process.env.BAMBOO_API_URL ||
  process.env.BAMBOO_BASE_URL ||
  "https://api.bamboocardportal.com";

// За замовчуванням — v2.0 (перевизначай через ENV)
const CATALOG_PATH =
  (process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog").replace(
    /\/+$/,
    "",
  ) || "/api/integration/v2.0/catalog";

function buildQuery(q = {}) {
  // Будуємо РІВНО ті ключі, як у Bamboo V2 (чутливі до регістру!)
  const p = new URLSearchParams();
  if (q.CurrencyCode) p.set("CurrencyCode", q.CurrencyCode);
  if (q.CountryCode) p.set("CountryCode", q.CountryCode);
  if (q.Name) p.set("Name", q.Name);
  if (q.ModifiedDate) p.set("ModifiedDate", q.ModifiedDate); // YYYY-MM-DD
  if (q.ProductId != null) p.set("ProductId", String(q.ProductId));
  if (q.BrandId != null) p.set("BrandId", String(q.BrandId));
  if (q.TargetCurrency) p.set("TargetCurrency", q.TargetCurrency);
  if (q.PageSize != null) p.set("PageSize", String(q.PageSize));
  if (q.PageIndex != null) p.set("PageIndex", String(q.PageIndex));
  return p.toString();
}

export const api = axios.create({
  baseURL: BASE.replace(/\/+$/, ""),
  timeout: 15000,
});

export async function* paginateCatalog(params = {}) {
  let next = null;
  let page = 1;

  while (true) {
    const query = { ...params };
    if ("cursor" in (next || {})) query.cursor = next.cursor;
    else query.page = page;

    try {
      const headers = await authHeaders();
      const { data } = await api.get(CATALOG_PATH, {
        params: query,
        headers: { "Content-Type": "application/json", ...headers },
        timeout: 15000,
      });
      const items = data?.items || data?.data || data || [];
      if (!Array.isArray(items) || !items.length) break;

      yield items;

      next = data?.next || data?.pagination?.next || null;
      if (!next && !data?.pagination) {
        if (items.length < (params.limit || 100)) break;
        page += 1;
      } else if (!next) break;
    } catch (e) {
      const st = e?.response?.status;
      const body = e?.response?.data;
      console.error(
        "[bamboo] fetch error:",
        st || e?.code || e?.message,
        body && typeof body === "object"
          ? JSON.stringify(body).slice(0, 400)
          : body || "",
      );
      throw e;
    }
  }
}

export async function getEgressIp() {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json", {
      timeout: 5000,
    });
    return data?.ip || null;
  } catch {
    return null;
  }
}

export function getBambooConfig() {
  return {
    baseUrl: BASE,
    catalogPath: CATALOG_PATH,
    ...debugAuthConfig(),
  };
}

export async function fetchCatalogRaw(query = {}) {
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  const qs = buildQuery(query);
  const url = `${BASE}${CATALOG_PATH}${qs ? `?${qs}` : ""}`;
  const { data, status } = await axios.get(url, { headers, timeout: 20000 });
  return { data, status, usedHeaders: Object.keys(headers) };
}

