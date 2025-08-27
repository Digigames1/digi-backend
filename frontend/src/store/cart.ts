export type Item = { id: string; name: string; price: number; img?: string; qty: number };
const KEY = "dg_cart_v1";

export const getCart = (): Item[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
export const setCart = (items: Item[]) => localStorage.setItem(KEY, JSON.stringify(items));

export const addToCart = (item: Omit<Item,"qty"> & { qty?: number }) => {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === item.id);
  if (idx === -1) cart.push({ ...item, qty: item.qty ?? 1 });
  else cart[idx].qty += item.qty ?? 1;
  setCart(cart);
};
export const removeFromCart = (id: string) => {
  const cart = getCart().filter(i => i.id !== id);
  setCart(cart);
};
export const setQty = (id: string, qty: number) => {
  const cart = getCart();
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.qty = Math.max(1, qty);
  setCart(cart);
};
export const inCart = (id: string) => getCart().some(i => i.id === id);
export const qtyOf = (id: string) => getCart().find(i => i.id === id)?.qty ?? 0;
export const totalCount = () => getCart().reduce((s,i)=>s+i.qty,0);
