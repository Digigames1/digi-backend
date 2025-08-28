import type { Product } from "../../lib/types";
import { addToCart, removeFromCart, inCart, qtyOf, setQty } from "../../store/cart";
import { money } from "../checkout/cartUtils";

export default function ProductCard({
  product,
  showCategoryBadge,
}: {
  product: Product;
  showCategoryBadge?: boolean;
}) {
  const p = product;
  const added = inCart(p.id);
  const qty = qtyOf(p.id);
  const cur = localStorage.getItem("dg_currency") || p.currency || "USD";
  const categoryLabel = p.category
    ? p.category.charAt(0).toUpperCase() + p.category.slice(1)
    : "";
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ position: "relative" }}>
        {showCategoryBadge && categoryLabel && (
          <span className={`badge cat-${p.category}`}>{categoryLabel}</span>
        )}
        {p.discount ? <span className="badge-tag">-{p.discount}%</span> : null}
        {!showCategoryBadge && p.platform && (
          <span className="badge-tag top-right">{p.platform}</span>
        )}
        <img
          src={p.img || "/assets/images/placeholder.webp"}
          alt={p.name}
          loading="lazy"
          style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12 }}
        />
      </div>
      <div style={{ marginTop: 10, fontWeight: 600 }}>{p.name}</div>
      <div className="muted" style={{ display: "flex", gap: 8, alignItems: "center", margin: "4px 0" }}>
        <span>★ {(p.rating ?? 0).toFixed(1)}</span>
        {p.instant && <span className="chip">Instant</span>}
      </div>
      <div className="price" style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
        {p.oldPrice ? <s className="muted">{money(p.oldPrice, cur)}</s> : null}
        <strong>{money(p.price, cur)}</strong>
      </div>

      {!added ? (
        <button
          className="btn primary"
          style={{marginTop:10}}
          onClick={()=>addToCart({id:p.id,name:p.name,price:p.price,img:p.img})}
        >
          Add to Cart
        </button>
      ) : (
        <div style={{marginTop:10, display:"grid", gap:8}}>
          <div className="qtyrow">
            <button className="btn sm" onClick={()=>setQty(p.id, Math.max(1, qty-1))}>–</button>
            <span className="qty">{qty}</span>
            <button className="btn sm" onClick={()=>setQty(p.id, qty+1)}>+</button>
          </div>
          <button className="btn danger" onClick={()=>removeFromCart(p.id)}>Remove from Cart</button>
        </div>
      )}
    </div>
  );
}
