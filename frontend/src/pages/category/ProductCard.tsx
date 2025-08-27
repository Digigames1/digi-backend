import type { Product } from "./types";
import { addToCart, removeFromCart, inCart, qtyOf, setQty } from "../../store/cart";

export default function ProductCard({p}:{p:Product}){
  const added = inCart(p.id);
  const qty = qtyOf(p.id);
  return (
    <div className="card" style={{padding:12}}>
      <div style={{position:"relative"}}>
        {p.discount ? <span className="badge-tag">-{p.discount}%</span> : null}
        <img src={p.img || "/assets/images/placeholder.webp"} alt={p.name} loading="lazy" style={{width:"100%",height:180,objectFit:"cover",borderRadius:12}}/>
        {p.platform && <span className="badge-tag top-right">{p.platform}</span>}
      </div>
      <div style={{marginTop:10, fontWeight:600}}>{p.name}</div>
      <div className="muted" style={{display:"flex", gap:8, alignItems:"center", margin:"4px 0"}}>
        <span>★ {p.rating.toFixed(1)}</span>
        {p.instant && <span className="chip">Instant</span>}
      </div>
      <div style={{display:"flex", gap:8, alignItems:"baseline"}}>
        <div style={{fontWeight:700}}>${p.price}</div>
        {p.oldPrice ? <div className="muted" style={{textDecoration:"line-through"}}>${p.oldPrice}</div> : null}
      </div>

      {!added ? (
        <button className="btn primary" style={{marginTop:10}} onClick={()=>addToCart({id:p.id,name:p.name,price:p.price,img:p.img})}>Add to Cart</button>
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
