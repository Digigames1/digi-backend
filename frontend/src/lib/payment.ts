import { api } from "./api";

interface CartItem {
  id: string;
  qty: number;
}

interface QuotePayload {
  items: CartItem[];
  currency: string;
  coupon?: string;
}

export interface QuoteResponse {
  sub: number;
  discount: number;
  txn: number;
  total: number;
}

export const getQuote = (payload: QuotePayload) =>
  api.post<QuoteResponse>("/checkout/quote", payload);

interface SessionPayload extends QuotePayload {
  method: "liqpay";
  email: string;
}

interface SessionResponse {
  redirectUrl?: string;
}

export const createSession = (payload: SessionPayload) =>
  api.post<SessionResponse>("/checkout/create-session", payload);

