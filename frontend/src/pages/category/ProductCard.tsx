import type { Product } from "../../lib/types";
import { addToCart, removeFromCart, inCart, qtyOf, setQty } from "../../store/cart";
import { money } from "../checkout/cartUtils";

export default function ProductCard({
  product,
}: {
  product: Product;
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
        {p.discount ? <span className="badge-tag">-{p.discount}%</span> : null}
        <img
          src={p.img || "/assets/images/placeholder.webp"}
          alt={p.name}
          loading="lazy"
          style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12 }}
        />
      </div>
      <div className="meta" style={{ marginTop: 10 }}>
        {categoryLabel && (
          <span className={`badge badge-${p.category}`}>{categoryLabel}</span>
        )}
        <h3 className="title" style={{ marginTop: 8 }}>{p.name}</h3>
        <div className="muted" style={{ display: "flex", gap: 8, alignItems: "center", margin: "4px 0" }}>
          <span>★ {(p.rating ?? 0).toFixed(1)}</span>
          {p.instant && <span className="chip">Instant</span>}
        </div>
        <div className="price" style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
          {p.oldPrice ? <s className="muted">{money(p.oldPrice, cur, p.currency || "USD")}</s> : null}
          <strong>{money(p.price, cur, p.currency || "USD")}</strong>
        </div>
      </div>

      {!added ? (
        <button
          className="btn primary"
          style={{ marginTop: 10 }}
          onClick={() =>
            addToCart({ id: p.id, name: p.name, price: p.price, img: p.img, currency: p.currency })
          }
        >
          Add to Cart
        </button>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <div className="qtyrow">
            <button className="btn sm" onClick={() => setQty(p.id, Math.max(1, qty - 1))}>–</button>
            <span className="qty">{qty}</span>
            <button className="btn sm" onClick={() => setQty(p.id, qty + 1)}>+</button>
          </div>
          <button className="btn danger" onClick={() => removeFromCart(p.id)}>Remove from Cart</button>
        </div>
      )}
    </div>
  );
}
