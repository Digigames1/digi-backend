import express from "express";
import crypto from "crypto";
import Order from "../src/models/Order.mjs";

const router = express.Router();

router.post(
  "/webhook",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const { data, signature } = req.body || {};
      const prv = process.env.LIQPAY_PRIVATE_KEY;
      const calc = crypto
        .createHash("sha1")
        .update(prv + data + prv)
        .digest("base64");
      if (calc !== signature) return res.status(403).end("bad signature");
      const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
      const ok = payload?.status === "success" || payload?.paid === 1;

      const existing = await Order.findOne({ orderId: payload?.order_id });

      if (existing) {
        existing.status = ok ? "paid" : "failed";
        existing.meta = { liqpay: payload };
        await existing.save();
      } else {
        const amount = Number(payload?.amount) || 0;
        await Order.create({
          orderId: payload?.order_id || `lp_${Date.now()}`,
          email: payload?.sender_email,
          currency: payload?.currency,
          items: [
            {
              id: payload?.product_id || "liqpay",
              name: payload?.description || "LiqPay purchase",
              qty: 1,
              unitPrice: amount,
              lineTotal: amount,
            },
          ],
          subtotal: amount,
          discount: 0,
          transaction: 0,
          total: amount,
          provider: "liqpay",
          status: ok ? "paid" : "failed",
          meta: { liqpay: payload },
        });
      }

      res.sendStatus(200);
    } catch (e) {
      console.error("[liqpay webhook]", e.message);
      res.sendStatus(200);
    }
  }
);

export default router;
