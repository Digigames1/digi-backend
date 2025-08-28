import { useEffect, useMemo, useState } from "react";
import { getCart, subtotal, totalCount } from "../../store/cart";
import { METHOD_FEE, METHOD_LABEL, PayMethod } from "./fees";

const safeN = (n: any, d = 0) => (Number.isFinite(+n) ? +n : d);

const money = (v: number, cur = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(v) ? v : 0);

const getCurrency = () => localStorage.getItem("dg_currency") || "USD";
const getEmail = () => localStorage.getItem("dg_checkout_email") || "";

export default function PaymentPage() {
  const [items, setItems] = useState(getCart());
  const [email, setEmail] = useState(getEmail());
  const [currency] = useState(getCurrency());
  const [method, setMethod] = useState<PayMethod>("paypal");
  const [agree, setAgree] = useState(false);
  const [code, setCode] = useState(localStorage.getItem("dg_coupon") || "");

  // автооновлення кошика
  useEffect(() => {
    const t = setInterval(() => setItems(getCart()), 800);
    return () => clearInterval(t);
  }, []);

  const sums = useMemo(() => {
    const sub = subtotal();
    const discount =
      code.trim().toUpperCase() === "SAVE5" ? Math.min(sub * 0.05, 50) : 0;
    const feePct = Number(METHOD_FEE[method] ?? 0);
    const txn = Math.max(0, (sub - discount) * (feePct / 100));
    const total = Math.max(0, sub - discount + txn);
    return { sub, discount, txn, total };
  }, [items, code, method]);

  const methodLabel = METHOD_LABEL[method];
  const canProceed =
    !!email && /\S+@\S+\.\S+/.test(email) && items.length > 0 && agree;

  return (
    <div className="container checkout">
      {/* LEFT */}
      <div className="co-left">
        <div className="card">
          <div className="co-title">Choose a Payment Method</div>
          <div className="co-badge">✅ Instant e-mail delivery</div>

          <div className="pm-list">
            {(
              ["paypal", "klarna", "sofort", "daopay", "applepay", "card"] as PayMethod[]
            ).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={"pm-item" + (method === m ? " active" : "")}
                aria-pressed={method === m}
              >
                <span className="radio">{method === m ? "●" : "○"}</span>
                <span className="pm-title">{METHOD_LABEL[m]}</span>
                <span className="pm-fee">+ {Number(METHOD_FEE[m] ?? 0)}%</span>
              </button>
            ))}
          </div>

          {method === "paypal" && (
            <div className="alert warn">
              Your code(s) will be sent to the email address linked to your
              PayPal account, not the one you provided earlier.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT */}
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
            <span>{money(sums.sub, currency)}</span>
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
            <span>{money(Math.max(0, sums.sub - sums.discount), currency)}</span>
          </div>
          <div className="co-row">
            <span>Transaction Costs</span>
            <span>{money(sums.txn, currency)}</span>
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

          <button className="btn primary co-cta" disabled={!canProceed}>
            Continue with {methodLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}
