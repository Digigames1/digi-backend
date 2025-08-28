export type Item = { id:string; name:string; price:number; img?:string; qty:number; region?:string; instant?:boolean };

const KEY="dg_cart_v1";
const safeN = (n:any, def=0)=> Number.isFinite(+n) ? +n : def;

export const getCart = (): Item[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.map((i:any)=>({
      id: String(i.id),
      name: String(i.name ?? ""),
      price: safeN(i.price, 0),
      img: i.img || undefined,
      qty: Math.max(1, safeN(i.qty, 1)),
      region: i.region || "US",
      instant: Boolean(i.instant ?? true),
    })) : [];
  } catch { return []; }
};
export const setCart = (v: Item[]) => localStorage.setItem(KEY, JSON.stringify(v));

export const addToCart = (item: Omit<Item,"qty"> & { qty?:number }) => {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === item.id);
  if (idx === -1) cart.push({ ...item, qty: Math.max(1, safeN(item.qty,1)) });
  else cart[idx].qty += Math.max(1, safeN(item.qty,1));
  setCart(cart);
};
export const setQty = (id:string, qty:number) => {
  const cart = getCart();
  const it = cart.find(i=>i.id===id); if (!it) return;
  it.qty = Math.max(1, safeN(qty,1));
  setCart(cart);
};
export const removeFromCart = (id:string) => setCart(getCart().filter(i=>i.id!==id));
export const inCart = (id:string) => getCart().some(i=>i.id===id);
export const qtyOf = (id:string) => getCart().find(i=>i.id===id)?.qty ?? 0;
export const totalCount = () => getCart().reduce((s,i)=> s + Math.max(1, safeN(i.qty,1)), 0);
export const subtotal = () => getCart().reduce((s,i)=> s + safeN(i.price,0) * Math.max(1,safeN(i.qty,1)), 0);
