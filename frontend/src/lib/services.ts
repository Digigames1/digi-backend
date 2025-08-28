import { api } from "./api";
import type { ProductsResponse } from "./types";

export const Catalog = {
  list: (p: {
    category: string;
    platform?: string;
    regions?: string[];
    denoms?: number[];
    q?: string;
    sort?: string;
    inStock?: boolean;
    page?: number;
    limit?: number;
    currency?: string;
    lang?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set("category", p.category);
    if (p.platform) qs.set("platform", p.platform);
    if (p.regions?.length) qs.set("regions", p.regions.join(","));
    if (p.denoms?.length) qs.set("denoms", p.denoms.join(","));
    if (p.q) qs.set("q", p.q);
    if (p.sort) qs.set("sort", p.sort);
    if (p.inStock) qs.set("inStock", "1");
    if (p.page) qs.set("page", String(p.page));
    if (p.limit) qs.set("limit", String(p.limit));
    if (p.currency) qs.set("currency", p.currency);
    if (p.lang) qs.set("lang", p.lang);
    return api.get<ProductsResponse>(`/cards?${qs.toString()}`);
  },
};
