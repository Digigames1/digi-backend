import { useEffect, useState } from "react";
import { getCart, totalCount } from "../../store/cart";
import { createSession, getQuote } from "../../lib/payment";
import { money } from "./cartUtils";

const getCurrency = () => localStorage.getItem("dg_currency") || "USD";
const getEmail = () => localStorage.getItem("dg_checkout_email") || "";

export default function PaymentPage() {
  const [items, setItems] = useState(getCart());
  const [email, setEmail] = useState(getEmail());
  const [currency, setCurrency] = useState(getCurrency());
  const [agree, setAgree] = useState(false);
  const [code, setCode] = useState(localStorage.getItem("dg_coupon") || "");
  const [sums, setSums] = useState({
    lines: [],
    subtotal: 0,
    discount: 0,
    transaction: 0,
    total: 0,
  });
  const [creating, setCreating] = useState(false);
  const [pErr, setPErr] = useState<string | null>(null);

  // автооновлення кошика
  useEffect(() => {
    const t = setInterval(() => setItems(getCart()), 800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const payload = {
      items: getCart().map((i) => ({ id: i.id, qty: Math.max(1, +i.qty || 1) })),
      currency,
      coupon: code.trim() || undefined,
    };
    getQuote(payload)
      .then((res) => setSums(res))
      .catch(() =>
        setSums({ lines: [], subtotal: 0, discount: 0, transaction: 0, total: 0 })
      );
  }, [items, code, currency]);

  useEffect(()=>{
    const curH = () => setCurrency(getCurrency());
    window.addEventListener("currencychange", curH);
    return () => window.removeEventListener("currencychange", curH);
  },[]);

  const canProceed =
    !!email &&
    /\S+@\S+\.\S+/.test(email) &&
    items.length > 0 &&
    agree &&
    sums.total > 0;

  async function handlePay() {
    setCreating(true);
    setPErr(null);
    try {
      const payload = {
        items: getCart().map((i) => ({ id: i.id, qty: Math.max(1, +i.qty || 1) })),
        currency,
        coupon: (localStorage.getItem("dg_coupon") || "").trim() || undefined,
        method: "liqpay" as const,
        email,
      };
      const res = await createSession(payload);
      if (res?.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      throw new Error("Payment redirect is missing");
    } catch (e: any) {
      setPErr(e?.message || "Failed to start payment");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="container checkout">
      <aside className="co-right">
        <div className="card">
          <div className="co-right-title">Instant delivery to</div>
          <label className="field">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                localStorage.setItem("dg_checkout_email", e.target.value);
              }}
              placeholder="your@email.com"
            />
          </label>
          <div className="muted">Unlock exclusive deals and insider tips</div>

          <div className="divider" />

          <div className="co-right-title">Order Summary</div>
          <div className="muted">Items in your cart (incl. service costs)</div>

          <div className="co-row">
            <span>{totalCount()}× items</span>
            <span>{money(sums.subtotal, currency)}</span>
          </div>

          <details className="discount" open={!!code}>
            <summary>Discount Code</summary>
            <div className="discount-inner">
              <input
                placeholder="Enter code (e.g. SAVE5)"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  localStorage.setItem("dg_coupon", e.target.value);
                }}
              />
              {!!sums.discount && (
                <div className="applied">
                  − {money(sums.discount, currency)} applied
                </div>
              )}
            </div>
          </details>

          <div className="co-row">
            <span>Subtotal</span>
            <span>
              {money(Math.max(0, sums.subtotal - sums.discount), currency)}
            </span>
          </div>
          <div className="co-row">
            <span>Transaction Costs</span>
            <span>{money(sums.transaction, currency)}</span>
          </div>

          <div className="divider" />
          <div className="co-row total">
            <span>Total</span>
            <span>{money(sums.total, currency)}</span>
          </div>

          <label className="agree">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to <a href="/terms" target="_blank">Terms</a>,{" "}
              <a href="/privacy" target="_blank">Privacy</a> and{" "}
              <a href="/refunds" target="_blank">Return Policy</a>
            </span>
          </label>
          {pErr && <div className="alert warn">{pErr}</div>}
          <button
            className="btn primary co-cta"
            disabled={!canProceed || creating}
            onClick={handlePay}
          >
            Pay with card (LiqPay)
          </button>
        </div>
      </aside>
    </div>
  );
}
