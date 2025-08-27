import { api } from "./api";
import type { Product } from "../pages/category/types";

export const Catalog = {
  list: async (params: { category: string; q?: string; sort?: string; view?: string; regions?: string[]; inStock?: boolean }) => {
    const query = new URLSearchParams({
      category: params.category,
      ...(params.q ? { q: params.q } : {}),
      ...(params.sort ? { sort: params.sort } : {}),
      ...(params.inStock ? { inStock: "1" } : {}),
      ...(params.regions?.length ? { regions: params.regions.join(",") } : {}),
    }).toString();
    try {
      return await api.get<{products: Product[]; total: number}>(`/cards?${query}`);
    } catch {
      const products: Product[] = Array.from({ length: 12 }, (_, i) => ({
        id: `stub-${i+1}`,
        name: `Sample Product ${i+1}`,
        img: "/assets/images/placeholder.webp",
        price: 10 + i,
        oldPrice: 15 + i,
        rating: 4.5,
        discount: 5,
        platform: i % 3 === 0 ? "XBOX" : i % 3 === 1 ? "PLAYSTATION" : "STEAM",
        instant: true,
        region: "US",
      }));
      return { products, total: products.length };
    }
  },
};
