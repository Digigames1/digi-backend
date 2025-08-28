import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, setQty, removeFromCart, subtotal, totalCount } from "../../store/cart";
import { money, safeMul } from "./cartUtils";

type Summary = { itemsTotal:number; discount:number; subTotal:number; total:number };

const getCurrency = () => localStorage.getItem("dg_currency") || "USD";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CartPage(){
  const [items, setItems] = useState(getCart());
  const [email, setEmail] = useState(localStorage.getItem("dg_checkout_email") || "");
  const [code, setCode] = useState(localStorage.getItem("dg_coupon") || "");
  const [currency, setCurrency] = useState(getCurrency());
  const navigate = useNavigate();

  useEffect(()=>{
    const t = setInterval(()=> setItems(getCart()), 600);
    return ()=> clearInterval(t);
  },[]);

  const summary: Summary = useMemo(()=>{
    const sub = subtotal();
    const discount = code.trim().toUpperCase()==="SAVE5" ? Math.min(sub*0.05, 50) : 0;
    const total = Math.max(0, sub - discount);
    return { itemsTotal: totalCount(), discount, subTotal: sub, total };
  }, [items, code]);

  const canPay = items.length>0 && emailRe.test(email);

  return (
    <div className="container checkout">
      <div className="co-left">
        <div className="card">
          <div className="co-title">Shopping Cart</div>
          <div className="co-badge">✅ Instant e-mail delivery</div>

          {items.length===0 && <div className="muted" style={{padding:"12px 0"}}>Your cart is empty.</div>}

          {items.map(it=>(
            <div className="co-item" key={it.id}>
              <img src={it.img || "/assets/images/placeholder.webp"} alt="" />
              <div className="co-item-meta">
                <div className="co-name">{it.name}</div>
                <div className="co-submeta">
                  <span>{it.region || "US"}</span>
                  {it.instant && <span className="chip">Instant delivery</span>}
                </div>
                <div className="co-qty">
                  <button className="btn sm" onClick={()=>{ setQty(it.id, it.qty-1); setItems(getCart()); }}>–</button>
                  <span className="qty">{it.qty}</span>
                  <button className="btn sm" onClick={()=>{ setQty(it.id, it.qty+1); setItems(getCart()); }}>+</button>
                  <button className="icon-x" aria-label="Remove" onClick={()=>{ removeFromCart(it.id); setItems(getCart()); }}>×</button>
                </div>
              </div>
              <div className="co-price">
                {money(safeMul(it.price, it.qty), currency)}
              </div>
            </div>
          ))}

          {items.length>0 && (
            <div className="co-continue">
              Not ready to checkout? <a href="/">Continue Shopping</a>
            </div>
          )}
        </div>
      </div>

      <aside className="co-right">
        <div className="card">
          <div className="co-right-title">Instant delivery to <span className="req">(Required)</span></div>
          <label className="field">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e=>{ setEmail(e.target.value); localStorage.setItem("dg_checkout_email", e.target.value); }}
            />
          </label>
          <div className="muted">Unlock exclusive deals and insider tips</div>

          <div className="divider"/>

          <div className="co-right-title">Order Summary</div>
          <div className="muted">Items in your cart (incl. service costs)</div>
          <div className="co-row">
            <span>{summary.itemsTotal}× items</span>
            <span>{money(summary.subTotal, currency)}</span>
          </div>

          <details className="discount">
            <summary>Discount Code</summary>
            <div className="discount-inner">
              <input placeholder="Enter code (e.g. SAVE5)" value={code} onChange={e=>{ setCode(e.target.value); localStorage.setItem("dg_coupon", e.target.value); }} />
              {!!summary.discount && <div className="applied">− {money(summary.discount, currency)} applied</div>}
            </div>
          </details>

          <div className="divider"/>
          <div className="co-row total">
            <span>Total</span>
            <span>{money(summary.total, currency)}</span>
          </div>

          <button className="btn primary co-cta" disabled={!canPay} onClick={()=>{ localStorage.setItem("dg_checkout_email", email); navigate("/checkout/payment"); }}>
            Choose Payment Method
          </button>
          {!canPay && <div className="muted" style={{fontSize:12}}>Enter a valid email to continue</div>}
        </div>
      </aside>
    </div>
  );
}
