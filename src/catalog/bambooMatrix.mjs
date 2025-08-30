import axios from "axios";
import { authHeaders } from "./auth.mjs";
import { detectCategory } from "./brandMap.mjs";

const BASE = process.env.BAMBOO_API_URL || "https://api.bamboocardportal.com";
const PATH = process.env.BAMBOO_CATALOG_PATH || "/api/integration/v2.0/catalog";

const PAGE_SIZE = Math.max(1, Number(process.env.CATALOG_PAGE_SIZE || 100));
const MAX_PAGES = Math.max(1, Number(process.env.CATALOG_MAX_PAGES || 8));

const DEF_COUNTRIES = (process.env.CATALOG_DEFAULT_COUNTRIES || "").split(",").map(s=>s.trim()).filter(Boolean);
const DEF_CURRENCIES = (process.env.CATALOG_DEFAULT_CURRENCIES || "").split(",").map(s=>s.trim()).filter(Boolean);

function qs(params={}) {
  const p = new URLSearchParams();
  if (params.CountryCode) p.set("CountryCode", params.CountryCode);
  if (params.CurrencyCode) p.set("CurrencyCode", params.CurrencyCode);
  if (params.Name) p.set("Name", params.Name);
  if (params.ModifiedDate) p.set("ModifiedDate", params.ModifiedDate);
  if (params.ProductId != null) p.set("ProductId", String(params.ProductId));
  if (params.BrandId != null) p.set("BrandId", String(params.BrandId));
  if (params.TargetCurrency) p.set("TargetCurrency", params.TargetCurrency);
  p.set("PageSize", String(params.PageSize ?? PAGE_SIZE));
  p.set("PageIndex", String(params.PageIndex ?? 0));
  return p.toString();
}

async function fetchPage(query) {
  const headers = { "Content-Type":"application/json", ...(await authHeaders()) };
  const url = `${BASE}${PATH}?${qs(query)}`;
  const { data, status } = await axios.get(url, { headers, timeout: 20000 });
  if (status !== 200) throw new Error(`Bamboo status ${status}`);
  const items = Array.isArray(data?.items) ? data.items : [];
  return { items, data };
}

export async function fetchMatrix({
  countries = DEF_COUNTRIES,
  currencies = DEF_CURRENCIES,
  since, name, productId, brandId, targetCurrency,
  pageSize = PAGE_SIZE, maxPages = MAX_PAGES,
}) {
  if (!countries?.length) countries = [undefined];
  if (!currencies?.length) currencies = [undefined];

  const combos = [];
  for (const c of countries) for (const cur of currencies) combos.push({ CountryCode:c, CurrencyCode:cur });

  const brands = [];
  let pagesTried = 0;

  for (const combo of combos) {
    for (let page = 0; page < maxPages; page++) {
      const { items } = await fetchPage({
        ...combo,
        ModifiedDate: since,
        Name: name,
        ProductId: productId,
        BrandId: brandId,
        TargetCurrency: targetCurrency,
        PageSize: pageSize,
        PageIndex: page,
      });
      pagesTried++;
      if (!items.length) break;
      for (const b of items) {
        const cat = detectCategory(b?.name || "");
        const brand = {
          id: b?.brandId ?? null,
          name: b?.name || "",
          logoUrl: b?.logoUrl || "",
          countryCode: b?.countryCode || combo.CountryCode || null,
          currencyCode: b?.currencyCode || combo.CurrencyCode || null,
          modifiedDate: b?.modifiedDate || null,
          category: cat,
          products: (Array.isArray(b?.products) ? b.products : []).map(p => ({
            id: p?.id,
            name: p?.name || b?.name || "",
            minFaceValue: p?.minFaceValue ?? null,
            maxFaceValue: p?.maxFaceValue ?? null,
            priceMin: p?.price?.min ?? null,
            priceMax: p?.price?.max ?? null,
            priceCurrency: p?.price?.currencyCode || b?.currencyCode || combo.CurrencyCode || null,
            _country: combo.CountryCode || null,
            _currency: combo.CurrencyCode || null,
          })),
        };
        brands.push(brand);
      }
      if ((items?.length || 0) < pageSize) break;
    }
  }

  const byCat = {};
  const seen = new Set();
  for (const b of brands) {
    if (!b.category) continue;
    if (!byCat[b.category]) byCat[b.category] = [];
    const copy = { ...b, products: [] };
    for (const p of b.products) {
      const k = String(p.id);
      if (seen.has(k)) continue;
      seen.add(k);
      copy.products.push(p);
    }
    if (copy.products.length) byCat[b.category].push(copy);
  }

  return {
    categories: byCat,
    meta: {
      combos: combos.map(c=>({CountryCode:c.CountryCode||null, CurrencyCode:c.CurrencyCode||null})),
      pagesTried,
      countriesUsed: [...new Set(combos.map(c=>c.CountryCode).filter(Boolean))],
      currenciesUsed: [...new Set(combos.map(c=>c.CurrencyCode).filter(Boolean))],
    }
  };
}
