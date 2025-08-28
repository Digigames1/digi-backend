import { api } from "./api";
import type { ProductsResponse } from "./types";

export const Catalog = {
  list: async (params: { category?: string; q?: string; sort?: string; regions?: string[]; inStock?: boolean }) => {
    const query = new URLSearchParams();
    if (params.category) query.set("category", params.category);
    if (params.q) query.set("q", params.q);
    if (params.sort) query.set("sort", params.sort);
    if (params.regions?.length) query.set("regions", params.regions.join(","));
    if (typeof params.inStock === "boolean") query.set("inStock", String(params.inStock));
    const qs = query.toString();
    return api.get<ProductsResponse>(`/cards${qs ? `?${qs}` : ""}`);
  },
};
