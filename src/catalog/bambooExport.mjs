import axios from "axios";
import { authHeaders } from "./auth.mjs";

const BASE = process.env.BAMBOO_API_URL || "https://api.bamboocardportal.com";
const PATH = process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog";

const DEFAULT_PAGE_SIZE = Math.max(1, Number(process.env.CATALOG_PAGE_SIZE || 100));
const DEFAULT_MAX_PAGES = Math.max(1, Number(process.env.CATALOG_MAX_PAGES || 30));

function qs(params = {}) {
  const p = new URLSearchParams();
  if (params.CurrencyCode)   p.set("CurrencyCode", params.CurrencyCode);
  if (params.CountryCode)    p.set("CountryCode", params.CountryCode);
  if (params.Name)           p.set("Name", params.Name);
  if (params.ModifiedDate)   p.set("ModifiedDate", params.ModifiedDate);
  if (params.ProductId != null) p.set("ProductId", String(params.ProductId));
  if (params.BrandId != null)   p.set("BrandId", String(params.BrandId));
  if (params.TargetCurrency) p.set("TargetCurrency", params.TargetCurrency);
  p.set("PageSize", String(params.PageSize ?? DEFAULT_PAGE_SIZE));
  p.set("PageIndex", String(params.PageIndex ?? 0));
  return p.toString();
}

async function fetchPage(query) {
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  const url = `${BASE}${PATH}?${qs(query)}`;
  const { data, status } = await axios.get(url, { headers, timeout: 20000 });
  if (status !== 200) throw new Error(`Bamboo status ${status}`);
  const items = Array.isArray(data?.items) ? data.items : [];
  return { items, data };
}

// Перетворення брендів+продуктів у плоскі рядки
function flatten(items, combo) {
  const rows = [];
  for (const b of items) {
    const brandName = b?.name || "";
    const brandId = b?.brandId ?? null;
    const bCountry = b?.countryCode || combo.CountryCode || null;
    const bCurrency = b?.currencyCode || combo.CurrencyCode || null;
    const modifiedDate = b?.modifiedDate || null;
    const products = Array.isArray(b?.products) ? b.products : [];
    for (const p of products) {
      rows.push({
        brandName,
        brandId,
        productId: p?.id,
        productName: p?.name || brandName,
        priceMin: p?.price?.min ?? null,
        priceMax: p?.price?.max ?? null,
        priceCurrency: p?.price?.currencyCode || bCurrency,
        countryCode: bCountry,
        currencyCode: bCurrency,
        modifiedDate,
      });
    }
  }
  return rows;
}

/**
 * Витягує ВСІ сторінки для заданих фільтрів.
 */
export async function exportAllProducts({
  CountryCode,
  CurrencyCode,
  Name,
  ModifiedDate,
  ProductId,
  BrandId,
  TargetCurrency,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
}) {
  const combo = { CountryCode, CurrencyCode };
  const all = [];
  for (let page = 0; page < maxPages; page++) {
    const { items } = await fetchPage({
      CountryCode,
      CurrencyCode,
      Name,
      ModifiedDate,
      ProductId,
      BrandId,
      TargetCurrency,
      PageSize: pageSize,
      PageIndex: page,
    });
    if (!items.length) break;
    all.push(...flatten(items, combo));
    if (items.length < pageSize) break;
  }
  return all;
}
