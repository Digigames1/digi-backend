const DEFAULT_MARKUP = Number.parseFloat(process.env.PRICE_MARGIN || "0.1");

export function applyMarkup(price, _product) {
  const base = Number(price);
  if (!Number.isFinite(base)) return 0;
  return Number((base * (1 + DEFAULT_MARKUP)).toFixed(2));
}

export default { applyMarkup };
