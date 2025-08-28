const BASE =
  (import.meta as any)?.env?.VITE_API_BASE?.replace(/\/+$/, "") ||
  "/api";

type JSONValue = string | number | boolean | null | JSONValue[] | { [k: string]: JSONValue };

export class ApiError extends Error {
  status: number;
  body?: any;
  constructor(message: string, status: number, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function fetchJSON<T>(
  path: string,
  opts: RequestInit = {},
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  try {
    const res = await fetch(url, { ...opts, headers, signal: controller.signal });
    const text = await res.text(); // спершу як текст
    let data: any;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = text;
    }

    if (!res.ok) {
      throw new ApiError(
        data?.message || data?.error || res.statusText || "Request failed",
        res.status,
        data
      );
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Зручні шорткати */
export const api = {
  get: <T>(p: string) => fetchJSON<T>(p),
  post: <T>(p: string, body?: JSONValue) =>
    fetchJSON<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};

