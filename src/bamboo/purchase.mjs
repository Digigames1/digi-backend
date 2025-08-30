// src/bamboo/purchase.mjs
// TODO: replace with real Bamboo purchase API when available.

export async function purchaseCodes({ lines, currency, email }) {
  const codes = [];
  for (const l of lines) {
    for (let i=0;i<l.qty;i++) {
      codes.push({
        code: `MOCK-${l.productId}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        pin: null,
        brand: l.name,
        productId: l.productId,
      });
    }
  }
  return { ok:true, codes };
}
