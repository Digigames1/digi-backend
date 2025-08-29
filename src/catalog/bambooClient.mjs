import axios from "axios";

// ---- ENV NORMALIZATION ----
const BASE =
  process.env.BAMBOO_API_BASE ||
  process.env.BAMBOO_API_URL ||
  process.env.BAMBOO_BASE_URL ||
  "";

const CLIENT_ID =
  process.env.BAMBOO_PROD_CLIENT_ID ||
  process.env.BAMBOO_CLIENT_ID ||
  "";

const CLIENT_SECRET =
  process.env.BAMBOO_PROD_CLIENT_SECRET ||
  process.env.BAMBOO_CLIENT_SECRET ||
  "";

// шлях каталогу можна перевизначати через ENV
const CATALOG_PATH = (process.env.BAMBOO_CATALOG_PATH || "/catalog").replace(/\/+$/, "") || "/catalog";

if (!BASE) console.error("[bamboo] BASE url is EMPTY. Set BAMBOO_API_URL or BAMBOO_BASE_URL in Render.");
if (!CLIENT_ID || !CLIENT_SECRET) console.warn("[bamboo] CLIENT_ID/CLIENT_SECRET missing — check Render ENV.");

export const api = axios.create({
  baseURL: BASE.replace(/\/+$/, ""), // без кінцевого слеша
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    // Якщо у вашій інтеграції інша схема (Bearer), замініть тут відповідно.
    "X-Client-Id": CLIENT_ID,
    "X-Client-Secret": CLIENT_SECRET,
  },
});

export async function* paginateCatalog(params = {}) {
  let next = null;
  let page = 1;

  while (true) {
    const query = { ...params };
    if ("cursor" in (next || {})) query.cursor = next.cursor;
    else query.page = page;

    try {
      const { data } = await api.get(CATALOG_PATH, { params: query });
      const items = data?.items || data?.data || [];
      if (!items.length) break;

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
        body && typeof body === "object" ? JSON.stringify(body).slice(0, 400) : body || ""
      );
      throw e;
    }
  }
}

