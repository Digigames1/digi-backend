export const convert = (value: number, from: string, to: string) => {
  if (from === to) return Number.isFinite(value) ? value : 0;
  try {
    const fx = JSON.parse(localStorage.getItem("dg_fx") || "{}");
    const r = fx.rates || {};
    const base = (fx.base || "USD").toUpperCase();
    const src = (from || base).toUpperCase();
    const tgt = (to || base).toUpperCase();
    if (src === tgt) return Number.isFinite(value) ? value : 0;
    if (src === base) return value * (r[tgt] || 1);
    if (tgt === base) return value / (r[src] || 1);
    return (value / (r[src] || 1)) * (r[tgt] || 1);
  } catch {
    return Number.isFinite(value) ? value : 0;
  }
};

export const money = (value: number, currency: string = "USD", from?: string) => {
  const v = convert(Number.isFinite(value) ? value : 0, from || currency, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(v);
};

export const safeMul = (a: any, b: any) => {
  const x = Number.isFinite(+a) ? +a : 0;
  const y = Number.isFinite(+b) ? +b : 0;
  return x * y;
};

