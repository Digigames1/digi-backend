// utils/pricing.js
import { fetchBambooById } from "./bamboo.js";
import { applyMarkup } from "./markup.js";
import sample from "../data/sample-products.json" with { type: "json" };

const N = (x, d = 0) => (Number.isFinite(+x) ? +x : d);

const localIndex = new Map(sample.map((p) => [String(p.id), p]));

async function priceFor(id, fallback) {
  const remote = await fetchBambooById(id).catch(() => null);
  const local = localIndex.get(String(id)) || null;
  const product = remote || local || null;

  const base = N(
    product?.price ??
      product?.currentPrice ??
      product?.amount ??
      fallback?.price ??
      fallback?.basePrice,
    0
  );

  const price = applyMarkup(base, product || fallback || {});
  return { product: product || fallback || null, price };
}

export async function quote({ items = [], coupon, method }) {
  const lines = [];
  for (const it of items) {
    const qty = Math.max(1, N(it.qty, 1));
    const { product, price: unitPrice } = await priceFor(String(it.id), it);

    lines.push({
      id: String(it.id),
      name:
        it.name ||
        it.title ||
        product?.name ||
        product?.title ||
        "",
      qty,
      unitPrice,
      lineTotal: +(unitPrice * qty).toFixed(2),
    });
  }

  const subtotal = +lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2);
  const discount = 0;     // TODO: coupons
  const transaction = 0;  // LiqPay commission not added to total
  const total = +(subtotal - discount + transaction).toFixed(2);

  return { lines, subtotal, discount, transaction, total };
}
