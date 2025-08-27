export const api = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch("/api" + url);
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
};
