import crypto from "crypto";

const PUB = process.env.LIQPAY_PUBLIC_KEY;
const PRIV = process.env.LIQPAY_PRIVATE_KEY;
const BASE_URL = process.env.BASE_URL || "http://localhost:10000";

export function liqpayParams({ orderId, amount, currency, description }) {
  const payload = {
    public_key: PUB,
    version: 3,
    action: "pay",
    amount: +amount.toFixed(2),
    currency,
    description,
    order_id: orderId,
    server_url: `${BASE_URL}/api/liqpay/callback`,
    result_url: `${BASE_URL}/thank-you?order=${encodeURIComponent(orderId)}`
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const sign = crypto.createHash("sha1").update(PRIV + data + PRIV).digest("base64");
  return { data, signature: sign, payload };
}

export function verifyLiqpaySignature({ data, signature }) {
  const calc = crypto.createHash("sha1").update(process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY).digest("base64");
  return calc === signature;
}
