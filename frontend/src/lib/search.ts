import { api } from "./api";

export const Search = {
  find: (q: string, p: { page?: number; limit?: number } = {}) =>
    api.get<{ products: any[]; total: number }>(
      `/search?q=${encodeURIComponent(q)}&page=${p.page || 1}&limit=${p.limit || 24}`
    ),
};
