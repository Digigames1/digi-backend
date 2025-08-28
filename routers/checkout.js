import express from "express";
import crypto from "crypto";
import Order from "../models/Order.js";
import { quote } from "../utils/pricing.js";

const router = express.Router();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64");
const sha1b64 = (s) => crypto.createHash("sha1").update(s).digest("base64");

router.post("/quote", async (req, res) => {
  try {
    res.json(
      await quote({
        items: req.body?.items || [],
        coupon: req.body?.coupon,
        method: "liqpay",
      })
    );
  } catch (e) {
    console.error("[quote]", e.message);
    res.json({
      lines: [],
      subtotal: 0,
      discount: 0,
      transaction: 0,
      total: 0,
      error: true,
    });
  }
});

router.post("/create-session", async (req, res) => {
  try {
    const { items = [], currency = "USD", email } = req.body || {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ error: "Valid email required" });

    const q = await quote({ items, method: "liqpay" });
    if (q.total <= 0)
      return res.status(400).json({ error: "Cart total is zero" });

    const orderId = `dg_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    await Order.create({
      orderId,
      email,
      currency,
      items: q.lines,
      subtotal: q.subtotal,
      discount: q.discount,
      transaction: q.transaction,
      total: q.total,
      provider: "liqpay",
      status: "created",
    });

    const pub = process.env.LIQPAY_PUBLIC_KEY;
    const prv = process.env.LIQPAY_PRIVATE_KEY;
    if (!pub || !prv)
      return res.status(500).json({ error: "LiqPay keys missing" });

    const payload = {
      public_key: pub,
      version: 3,
      action: "pay",
      amount: q.total.toFixed(2),
      currency,
      description: `DigiGames order ${orderId} for ${email}`,
      order_id: orderId,
      result_url: process.env.PAYMENT_RESULT_URL,
      server_url:
        process.env.LIQPAY_SERVER_URL ||
        (process.env.PUBLIC_URL
          ? process.env.PUBLIC_URL + "/api/liqpay/webhook"
          : undefined),
      sandbox: process.env.LIQPAY_SANDBOX ? 1 : undefined,
    };
    const data = b64(payload);
    const signature = sha1b64(prv + data + prv);
    const redirectUrl = `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(
      data
    )}&signature=${encodeURIComponent(signature)}`;
    res.json({ sessionId: orderId, redirectUrl });
  } catch (e) {
    console.error("[create-session]", e.message);
    res.status(500).json({ error: "Failed to create session" });
  }
});

export default router;
